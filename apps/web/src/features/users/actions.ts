'use server';

import { revalidatePath } from 'next/cache';
import { prisma, type RoleName } from '@examforge/db';
import { AdminUserUpdateSchema, InviteUserRequestSchema } from '@examforge/shared-types';
import { authService } from '@/server/auth/auth-service';
import type { UserMutationResult } from './types';

const usersPath = '/admin/users';

const getFieldErrors = (error: { flatten: () => { fieldErrors: Record<string, string[]> } }) => {
  const { fieldErrors } = error.flatten();
  return Object.fromEntries(
    Object.entries(fieldErrors)
      .map(([field, messages]) => [field, messages[0]])
      .filter((entry): entry is [string, string] => Boolean(entry[1])),
  );
};

const createSuccess = (message: string): UserMutationResult => ({ ok: true, message });

const createFailure = (
  message: string,
  fieldErrors?: Record<string, string>,
): UserMutationResult => ({
  ok: false,
  message,
  fieldErrors,
});

const getUserForAdminMutation = async (userId: string) => {
  return prisma.user.findFirst({
    where: {
      id: userId,
      deletedAt: null,
    },
    select: {
      id: true,
      email: true,
      role: { select: { name: true } },
      isActive: true,
    },
  });
};

const getActiveAdminCount = async () => {
  return prisma.user.count({
    where: {
      deletedAt: null,
      isActive: true,
      role: { name: 'ADMIN' },
    },
  });
};

const wouldRemoveFinalAdmin = async (target: {
  id: string;
  role: { name: RoleName };
  isActive: boolean;
}) => {
  if (target.role.name !== 'ADMIN' || !target.isActive) {
    return false;
  }

  const activeAdminCount = await getActiveAdminCount();
  return activeAdminCount <= 1;
};

const logUserAuditEvent = async ({
  actorId,
  action,
  targetUserId,
  metadata,
}: {
  actorId: string;
  action: string;
  targetUserId: string;
  metadata: Record<string, string | boolean | null>;
}) => {
  await prisma.auditLog.create({
    data: {
      actorId,
      action,
      entityType: 'User',
      entityId: targetUserId,
      metadata,
    },
  });
};

export const inviteUserAction = async (input: unknown): Promise<UserMutationResult> => {
  const session = await authService.requireAdmin();
  const parsed = InviteUserRequestSchema.safeParse(input);

  if (!parsed.success) {
    return createFailure('Check the invite details and try again.', getFieldErrors(parsed.error));
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      email: parsed.data.email,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (existingUser) {
    return createFailure('A user with this email already exists.', {
      email: 'A user with this email already exists.',
    });
  }

  const role = await prisma.role.findUnique({
    where: { name: parsed.data.role },
    select: { id: true },
  });

  if (!role) {
    return createFailure('Selected role does not exist.');
  }

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      roleId: role.id,
      isActive: true,
      emailVerified: false,
    },
    select: { id: true },
  });

  await logUserAuditEvent({
    actorId: session.user.id,
    action: 'USER_INVITED',
    targetUserId: user.id,
    metadata: {
      role: parsed.data.role,
      emailDelivery: false,
    },
  });

  revalidatePath(usersPath);
  return createSuccess('User invited. Email delivery is ready for a future phase.');
};

export const updateUserAction = async (
  userId: string,
  input: unknown,
): Promise<UserMutationResult> => {
  const session = await authService.requireAdmin();
  const parsed = AdminUserUpdateSchema.safeParse(input);

  if (!parsed.success) {
    return createFailure('Check the user update and try again.', getFieldErrors(parsed.error));
  }

  const target = await getUserForAdminMutation(userId);
  if (!target) {
    return createFailure('User not found.');
  }

  if (target.id === session.user.id && parsed.data.role && parsed.data.role !== target.role.name) {
    return createFailure('You cannot change your own role.');
  }

  if (target.id === session.user.id && parsed.data.isActive === false) {
    return createFailure('You cannot deactivate yourself.');
  }

  const nextRoleName = parsed.data.role ?? target.role.name;
  const nextIsActive = parsed.data.isActive ?? target.isActive;

  if (
    target.role.name === 'ADMIN' &&
    target.isActive &&
    (nextRoleName !== 'ADMIN' || !nextIsActive) &&
    (await wouldRemoveFinalAdmin(target))
  ) {
    return createFailure('Cannot remove the final active administrator.');
  }

  const role = parsed.data.role
    ? await prisma.role.findUnique({
        where: { name: parsed.data.role },
        select: { id: true },
      })
    : null;

  if (parsed.data.role && !role) {
    return createFailure('Selected role does not exist.');
  }

  await prisma.user.update({
    where: { id: target.id },
    data: {
      ...(role ? { roleId: role.id } : {}),
      ...(typeof parsed.data.isActive === 'boolean' ? { isActive: parsed.data.isActive } : {}),
    },
  });

  if (role || typeof parsed.data.isActive === 'boolean') {
    await prisma.session.deleteMany({ where: { userId: target.id } });
  }

  await logUserAuditEvent({
    actorId: session.user.id,
    action: 'USER_UPDATED',
    targetUserId: target.id,
    metadata: {
      previousRole: target.role.name,
      nextRole: nextRoleName,
      previousIsActive: target.isActive,
      nextIsActive,
    },
  });

  revalidatePath(usersPath);
  return createSuccess('User updated.');
};

export const deactivateUserAction = async (userId: string): Promise<UserMutationResult> => {
  return updateUserAction(userId, { isActive: false });
};

export const activateUserAction = async (userId: string): Promise<UserMutationResult> => {
  return updateUserAction(userId, { isActive: true });
};

export const softDeleteUserAction = async (userId: string): Promise<UserMutationResult> => {
  const session = await authService.requireAdmin();
  const target = await getUserForAdminMutation(userId);

  if (!target) {
    return createFailure('User not found.');
  }

  if (target.id === session.user.id) {
    return createFailure('You cannot delete yourself.');
  }

  if (await wouldRemoveFinalAdmin(target)) {
    return createFailure('Cannot delete the final active administrator.');
  }

  await prisma.session.deleteMany({ where: { userId: target.id } });
  await prisma.user.delete({ where: { id: target.id } });

  await logUserAuditEvent({
    actorId: session.user.id,
    action: 'USER_DELETED',
    targetUserId: target.id,
    metadata: {
      previousRole: target.role.name,
      previousIsActive: target.isActive,
    },
  });

  revalidatePath(usersPath);
  return createSuccess('User deleted.');
};

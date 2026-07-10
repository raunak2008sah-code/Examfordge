import 'server-only';

import { prisma, type Prisma, type RoleName } from '@examforge/db';
import {
  UserListQuerySchema,
  type UserListQuery,
  type UserProfileResponse,
  type UserStatus,
} from '@examforge/shared-types';
import type { UserManagementData } from './types';

const sortableColumns = new Set<UserListQuery['sort']>([
  'name',
  'email',
  'role',
  'status',
  'createdAt',
  'lastLoginAt',
]);

const getUserStatus = (user: {
  isActive: boolean;
  accounts: { providerId: string; password: string | null }[];
}): UserStatus => {
  if (!user.isActive) {
    return 'INACTIVE';
  }

  const hasCredentialAccount = user.accounts.some(
    (account) => account.providerId === 'credential' && Boolean(account.password),
  );

  return hasCredentialAccount ? 'ACTIVE' : 'INVITED';
};

const getOrderBy = (
  sort: UserListQuery['sort'],
  direction: UserListQuery['direction'],
): Prisma.UserOrderByWithRelationInput => {
  switch (sort) {
    case 'name':
      return { name: direction };
    case 'email':
      return { email: direction };
    case 'role':
      return { role: { name: direction } };
    case 'status':
      return { isActive: direction };
    case 'lastLoginAt':
      return { sessions: { _count: direction } };
    case 'createdAt':
    default:
      return { createdAt: direction };
  }
};

const toUserProfileResponse = (user: {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
  role: { name: RoleName };
  accounts: { providerId: string; password: string | null }[];
  sessions: { createdAt: Date }[];
  _count: { sessions: number };
}): UserProfileResponse => {
  const hasCredentialAccount = user.accounts.some(
    (account) => account.providerId === 'credential' && Boolean(account.password),
  );
  const lastLoginAt = user.sessions[0]?.createdAt ?? null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role.name,
    status: getUserStatus(user),
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    lastLoginAt: lastLoginAt ? lastLoginAt.toISOString() : null,
    activeSessionCount: user._count.sessions,
    hasCredentialAccount,
  };
};

const getSummaryCounts = async () => {
  const [total, active, inactive, admins, reviewers, students, invitedCandidates] =
    await prisma.$transaction([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: null, isActive: true } }),
      prisma.user.count({ where: { deletedAt: null, isActive: false } }),
      prisma.user.count({ where: { deletedAt: null, role: { name: 'ADMIN' } } }),
      prisma.user.count({ where: { deletedAt: null, role: { name: 'REVIEWER' } } }),
      prisma.user.count({ where: { deletedAt: null, role: { name: 'STUDENT' } } }),
      prisma.user.findMany({
        where: { deletedAt: null, isActive: true },
        select: {
          accounts: {
            where: { providerId: 'credential' },
            select: { password: true },
          },
        },
      }),
    ]);

  const invited = invitedCandidates.filter(
    (user) => !user.accounts.some((account) => Boolean(account.password)),
  ).length;

  return {
    total,
    active: active - invited,
    invited,
    inactive,
    admins,
    reviewers,
    students,
  };
};

export const parseUserListSearchParams = (
  searchParams: Record<string, string | string[] | undefined>,
): UserListQuery => {
  const parsed = UserListQuerySchema.safeParse({
    page: searchParams.page,
    pageSize: searchParams.pageSize,
    search: searchParams.search,
    role: searchParams.role,
    status: searchParams.status,
    sort: searchParams.sort,
    direction: searchParams.direction,
  });

  if (!parsed.success) {
    return UserListQuerySchema.parse({});
  }

  if (!sortableColumns.has(parsed.data.sort)) {
    return { ...parsed.data, sort: 'createdAt' };
  }

  return parsed.data;
};

export const getUserManagementData = async (
  filters: UserListQuery,
): Promise<UserManagementData> => {
  const where: Prisma.UserWhereInput = { deletedAt: null };

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  if (filters.role !== 'ALL') {
    where.role = { name: filters.role };
  }

  if (filters.status === 'ACTIVE') {
    where.isActive = true;
    where.accounts = {
      some: {
        providerId: 'credential',
        password: { not: null },
      },
    };
  }

  if (filters.status === 'INVITED') {
    where.isActive = true;
    where.accounts = {
      none: {
        providerId: 'credential',
        password: { not: null },
      },
    };
  }

  if (filters.status === 'INACTIVE') {
    where.isActive = false;
  }

  const skip = (filters.page - 1) * filters.pageSize;
  const [users, totalCount, summary] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: getOrderBy(filters.sort, filters.direction),
      skip,
      take: filters.pageSize,
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true,
        role: { select: { name: true } },
        accounts: {
          where: { providerId: 'credential' },
          select: { providerId: true, password: true },
        },
        sessions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true },
        },
        _count: { select: { sessions: true } },
      },
    }),
    prisma.user.count({ where }),
    getSummaryCounts(),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / filters.pageSize));

  return {
    users: users.map(toUserProfileResponse),
    totalCount,
    totalPages,
    currentPage: Math.min(filters.page, totalPages),
    pageSize: filters.pageSize,
    filters,
    summary,
  };
};

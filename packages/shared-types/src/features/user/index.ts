import { z } from 'zod';
import { UserRoleSchema } from '../auth';
import { UuidSchema, createPaginatedResponseSchema } from '../../core';

export const UserStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'INVITED']);

export type UserStatus = z.infer<typeof UserStatusSchema>;

export const UserProfileResponseSchema = z.object({
  id: UuidSchema,
  name: z.string().nullable(),
  email: z.string().email(),
  role: UserRoleSchema,
  status: UserStatusSchema,
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  lastLoginAt: z.string().datetime().nullable(),
  activeSessionCount: z.number().int().nonnegative(),
  hasCredentialAccount: z.boolean(),
});

export type UserProfileResponse = z.infer<typeof UserProfileResponseSchema>;

export const UpdateProfileRequestSchema = z.object({
  name: z.string().min(1).optional(),
  password: z.string().min(8).optional(),
});

export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>;

export const InviteUserRequestSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120, 'Name is too long'),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  role: UserRoleSchema,
});

export type InviteUserRequest = z.infer<typeof InviteUserRequestSchema>;

export const AdminUserUpdateSchema = z.object({
  role: UserRoleSchema.optional(),
  isActive: z.boolean().optional(),
});

export type AdminUserUpdate = z.infer<typeof AdminUserUpdateSchema>;

export const UserListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(50).default(10),
  search: z.string().trim().max(120).default(''),
  role: z.union([UserRoleSchema, z.literal('ALL')]).default('ALL'),
  status: z.union([UserStatusSchema, z.literal('ALL')]).default('ALL'),
  sort: z
    .enum(['name', 'email', 'role', 'status', 'createdAt', 'lastLoginAt'])
    .default('createdAt'),
  direction: z.enum(['asc', 'desc']).default('desc'),
});

export type UserListQuery = z.infer<typeof UserListQuerySchema>;

export const UserListResponseSchema = createPaginatedResponseSchema(UserProfileResponseSchema);

export type UserListResponse = z.infer<typeof UserListResponseSchema>;

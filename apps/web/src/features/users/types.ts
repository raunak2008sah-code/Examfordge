import type { RoleName } from '@examforge/db';
import type { UserListQuery, UserProfileResponse, UserStatus } from '@examforge/shared-types';

export type UserRow = UserProfileResponse;

export type UserManagementSearchParams = UserListQuery;

export type UserManagementData = {
  users: UserRow[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  filters: UserManagementSearchParams;
  summary: {
    total: number;
    active: number;
    invited: number;
    inactive: number;
    admins: number;
    reviewers: number;
    students: number;
  };
};

export type UserMutationResult =
  | {
      ok: true;
      message: string;
    }
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string>;
    };

export type EditableRole = RoleName;

export type EditableStatus = Extract<UserStatus, 'ACTIVE' | 'INACTIVE'>;

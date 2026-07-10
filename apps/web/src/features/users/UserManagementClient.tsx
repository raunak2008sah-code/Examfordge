'use client';

import React, { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  Calendar,
  CheckCircle2,
  Edit3,
  Mail,
  MoreHorizontal,
  Power,
  Search,
  Shield,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import type { RoleName } from '@examforge/db';
import { RoleBadge } from '@/components/admin/feedback/RoleBadge';
import { StatusBadge } from '@/components/admin/feedback/StatusBadge';
import { ConfirmationDialog } from '@/components/admin/feedback/ConfirmationDialog';
import { SectionCard } from '@/components/admin/containers/SectionCard';
import { StatCard } from '@/components/admin/containers/StatCard';
import {
  DataTable,
  SortableHeader,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/tables/Table';
import { Pagination } from '@/components/ui/tables/Pagination';
import { Modal } from '@/components/ui/overlays/Modal';
import { Drawer } from '@/components/ui/overlays/Drawer';
import { DropdownMenu } from '@/components/ui/overlays/Dropdown';
import { TextInput } from '@/components/ui/forms/TextInput';
import { Select } from '@/components/ui/forms/Select';
import { ToastContainer, type ToastVariant } from '@/components/ui/feedback/Toast';
import {
  activateUserAction,
  deactivateUserAction,
  inviteUserAction,
  softDeleteUserAction,
  updateUserAction,
} from './actions';
import type { EditableStatus, UserManagementData, UserMutationResult, UserRow } from './types';

type ToastState = {
  id: string;
  title: string;
  message?: string;
  variant: ToastVariant;
};

type PendingAction =
  | { type: 'activate'; user: UserRow }
  | { type: 'deactivate'; user: UserRow }
  | { type: 'delete'; user: UserRow };

type UserManagementClientProps = {
  data: UserManagementData;
  currentUser: {
    id: string;
    role: RoleName;
  };
};

const roleOptions = [
  { label: 'All roles', value: 'ALL' },
  { label: 'Admin', value: 'ADMIN' },
  { label: 'Reviewer', value: 'REVIEWER' },
  { label: 'Student', value: 'STUDENT' },
];

const editableRoleOptions = [
  { label: 'Admin', value: 'ADMIN' },
  { label: 'Reviewer', value: 'REVIEWER' },
  { label: 'Student', value: 'STUDENT' },
];

const statusOptions = [
  { label: 'All statuses', value: 'ALL' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Invited', value: 'INVITED' },
  { label: 'Inactive', value: 'INACTIVE' },
];

const editableStatusOptions = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
];

const formatDate = (value: string | null) => {
  if (!value) {
    return 'Not yet';
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const getInitials = (user: UserRow) => {
  const source = user.name || user.email;
  return source
    .split(/[.@\s_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
};

const getStatusBadgeVariant = (status: UserRow['status']) => {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'INVITED':
      return 'info';
    case 'INACTIVE':
      return 'default';
    default:
      return 'default';
  }
};

const resultToast = (result: UserMutationResult): ToastState => ({
  id: crypto.randomUUID(),
  title: result.ok ? 'Done' : 'Action failed',
  message: result.message,
  variant: result.ok ? 'success' : 'error',
});

export function UserManagementClient({ data, currentUser }: UserManagementClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(data.filters.search);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    role: 'STUDENT' as RoleName,
  });
  const [editForm, setEditForm] = useState({
    role: 'STUDENT' as RoleName,
    status: 'ACTIVE' as EditableStatus,
  });
  const canManageUsers = currentUser.role === 'ADMIN';

  const pushToast = (toast: ToastState) => {
    setToasts((current) => [...current, toast]);
  };

  const closeToast = (id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  const updateQuery = (updates: Record<string, string | number>) => {
    const params = new URLSearchParams();
    const next = {
      page: data.filters.page,
      pageSize: data.filters.pageSize,
      search: data.filters.search,
      role: data.filters.role,
      status: data.filters.status,
      sort: data.filters.sort,
      direction: data.filters.direction,
      ...updates,
    };

    Object.entries(next).forEach(([key, value]) => {
      if (value !== '' && value !== 'ALL') {
        params.set(key, String(value));
      }
    });

    router.push(`/admin/users?${params.toString()}`);
  };

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateQuery({ search, page: 1 });
  };

  const handleSort = (sort: string) => {
    const direction =
      data.filters.sort === sort && data.filters.direction === 'asc' ? 'desc' : 'asc';
    updateQuery({ sort, direction, page: 1 });
  };

  const openEdit = (user: UserRow) => {
    setEditingUser(user);
    setEditForm({
      role: user.role,
      status: user.isActive ? 'ACTIVE' : 'INACTIVE',
    });
  };

  const handleInvite = () => {
    startTransition(async () => {
      const result = await inviteUserAction(inviteForm);
      pushToast(resultToast(result));
      if (result.ok) {
        setInviteForm({ name: '', email: '', role: 'STUDENT' });
        setIsInviteOpen(false);
        router.refresh();
      }
    });
  };

  const handleEdit = () => {
    if (!editingUser) return;

    startTransition(async () => {
      const result = await updateUserAction(editingUser.id, {
        role: editForm.role,
        isActive: editForm.status === 'ACTIVE',
      });
      pushToast(resultToast(result));
      if (result.ok) {
        setEditingUser(null);
        router.refresh();
      }
    });
  };

  const executePendingAction = () => {
    if (!pendingAction) return;

    startTransition(async () => {
      const action = pendingAction;
      let result: UserMutationResult;
      if (action.type === 'activate') {
        result = await activateUserAction(action.user.id);
      } else if (action.type === 'deactivate') {
        result = await deactivateUserAction(action.user.id);
      } else {
        result = await softDeleteUserAction(action.user.id);
      }

      pushToast(resultToast(result));
      setPendingAction(null);
      if (result.ok) {
        router.refresh();
      }
    });
  };

  const pendingDialogCopy = useMemo(() => {
    if (!pendingAction) return null;
    const label = pendingAction.user.name || pendingAction.user.email;
    if (pendingAction.type === 'activate') {
      return {
        title: 'Activate user',
        description: `${label} will regain access after signing in again.`,
        confirmLabel: 'Activate',
        destructive: false,
      };
    }
    if (pendingAction.type === 'deactivate') {
      return {
        title: 'Deactivate user',
        description: `${label} will lose access immediately and active sessions will be revoked.`,
        confirmLabel: 'Deactivate',
        destructive: true,
      };
    }
    return {
      title: 'Delete user',
      description: `${label} will be soft-deleted. Existing audit history remains preserved.`,
      confirmLabel: 'Delete',
      destructive: true,
    };
  }, [pendingAction]);

  return (
    <>
      <div className="ef-grid-responsive" style={{ marginBottom: 'var(--space-5)' }}>
        <StatCard title="Total users" value={data.summary.total} icon={<Users size={20} />} />
        <StatCard
          title="Active accounts"
          value={data.summary.active}
          icon={<CheckCircle2 size={20} />}
        />
        <StatCard title="Pending invites" value={data.summary.invited} icon={<Mail size={20} />} />
      </div>

      <SectionCard
        title="Users"
        description="Manage account access, roles, and invite lifecycle."
        actions={
          canManageUsers && (
            <button className="ef-button ef-button-primary" onClick={() => setIsInviteOpen(true)}>
              <UserPlus size={16} />
              Invite user
            </button>
          )
        }
      >
        <div className="user-management-toolbar">
          <form onSubmit={submitSearch} className="user-search-form">
            <div className="user-search-input">
              <Search size={16} />
              <input
                className="ef-input"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name or email"
                aria-label="Search users"
              />
            </div>
            <button className="ef-button ef-button-secondary" type="submit">
              Search
            </button>
          </form>

          <div className="user-filter-row">
            <Select
              label="Role"
              value={data.filters.role}
              options={roleOptions}
              onChange={(event) => updateQuery({ role: event.target.value, page: 1 })}
            />
            <Select
              label="Status"
              value={data.filters.status}
              options={statusOptions}
              onChange={(event) => updateQuery({ status: event.target.value, page: 1 })}
            />
          </div>
        </div>

        <DataTable>
          <TableHeader>
            <TableCell isHeader width="280px">
              User
            </TableCell>
            <SortableHeader
              label="Role"
              sortKey="role"
              currentSort={data.filters.sort}
              direction={data.filters.direction}
              onSort={handleSort}
            />
            <SortableHeader
              label="Status"
              sortKey="status"
              currentSort={data.filters.sort}
              direction={data.filters.direction}
              onSort={handleSort}
            />
            <SortableHeader
              label="Created"
              sortKey="createdAt"
              currentSort={data.filters.sort}
              direction={data.filters.direction}
              onSort={handleSort}
            />
            <TableCell isHeader>Last Login</TableCell>
            <TableCell isHeader align="right">
              Actions
            </TableCell>
          </TableHeader>
          <TableBody>
            {data.users.map((user) => {
              const isSelf = user.id === currentUser.id;
              const actionItems = [
                {
                  label: 'View details',
                  icon: <Activity size={16} />,
                  onClick: () => setSelectedUser(user),
                },
                ...(canManageUsers
                  ? [
                      {
                        label: 'Edit user',
                        icon: <Edit3 size={16} />,
                        onClick: () => openEdit(user),
                      },
                      {
                        label: user.isActive ? 'Deactivate' : 'Activate',
                        icon: <Power size={16} />,
                        onClick: () =>
                          setPendingAction({
                            type: user.isActive ? 'deactivate' : 'activate',
                            user,
                          }),
                        danger: user.isActive,
                      },
                      {
                        label: 'DIVIDER',
                      },
                      {
                        label: 'Delete',
                        icon: <Trash2 size={16} />,
                        onClick: () => setPendingAction({ type: 'delete', user }),
                        danger: true,
                      },
                    ]
                  : []),
              ];

              return (
                <TableRow key={user.id}>
                  <TableCell>
                    <button
                      className="user-identity-button"
                      onClick={() => setSelectedUser(user)}
                      type="button"
                    >
                      <span className="user-avatar" aria-hidden="true">
                        {getInitials(user)}
                      </span>
                      <span>
                        <span className="user-name-line">
                          {user.name}
                          {isSelf && <span className="user-self-chip">You</span>}
                        </span>
                        <span className="user-email-line">{user.email}</span>
                      </span>
                    </button>
                  </TableCell>
                  <TableCell>
                    <RoleBadge role={user.role} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      label={
                        user.status === 'INVITED'
                          ? 'Invited'
                          : user.isActive
                            ? 'Active'
                            : 'Inactive'
                      }
                      variant={getStatusBadgeVariant(user.status)}
                    />
                  </TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell>{formatDate(user.lastLoginAt)}</TableCell>
                  <TableCell align="right">
                    <DropdownMenu
                      trigger={
                        <button className="ef-button ef-button-secondary" aria-label="User actions">
                          <MoreHorizontal size={16} />
                        </button>
                      }
                      items={actionItems}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </DataTable>

        {data.users.length === 0 && (
          <div className="user-empty-inline">
            <Users size={32} />
            <h3 className="text-h2">No users match these filters</h3>
            <p className="text-meta">Try a different search, role, or status filter.</p>
          </div>
        )}

        <Pagination
          currentPage={data.currentPage}
          totalPages={data.totalPages}
          onPageChange={(page) => updateQuery({ page })}
        />
      </SectionCard>

      <Modal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        title="Invite user"
        footer={
          <>
            <button
              className="ef-button ef-button-secondary"
              onClick={() => setIsInviteOpen(false)}
            >
              Cancel
            </button>
            <button
              className="ef-button ef-button-primary"
              onClick={handleInvite}
              disabled={isPending}
            >
              Send invite
            </button>
          </>
        }
      >
        <p className="text-meta" style={{ marginBottom: 'var(--space-4)' }}>
          Email delivery is not enabled yet. This creates an invited account ready for future
          password setup.
        </p>
        <TextInput
          label="Name"
          value={inviteForm.name}
          onChange={(event) => setInviteForm({ ...inviteForm, name: event.target.value })}
          autoComplete="name"
        />
        <TextInput
          label="Email"
          type="email"
          value={inviteForm.email}
          onChange={(event) => setInviteForm({ ...inviteForm, email: event.target.value })}
          autoComplete="email"
        />
        <Select
          label="Role"
          value={inviteForm.role}
          options={editableRoleOptions}
          onChange={(event) =>
            setInviteForm({ ...inviteForm, role: event.target.value as RoleName })
          }
        />
      </Modal>

      <Modal
        isOpen={Boolean(editingUser)}
        onClose={() => setEditingUser(null)}
        title="Edit user"
        footer={
          <>
            <button className="ef-button ef-button-secondary" onClick={() => setEditingUser(null)}>
              Cancel
            </button>
            <button
              className="ef-button ef-button-primary"
              onClick={handleEdit}
              disabled={isPending}
            >
              Save changes
            </button>
          </>
        }
      >
        {editingUser && (
          <>
            <div className="user-detail-header" style={{ marginBottom: 'var(--space-5)' }}>
              <span className="user-avatar user-avatar-large" aria-hidden="true">
                {getInitials(editingUser)}
              </span>
              <div>
                <h3 className="text-h2">{editingUser.name}</h3>
                <p className="text-meta">{editingUser.email}</p>
              </div>
            </div>
            <Select
              label="Role"
              value={editForm.role}
              options={editableRoleOptions}
              onChange={(event) =>
                setEditForm({ ...editForm, role: event.target.value as RoleName })
              }
              disabled={editingUser.id === currentUser.id}
              helperText={
                editingUser.id === currentUser.id ? 'You cannot change your own role.' : undefined
              }
            />
            <Select
              label="Account status"
              value={editForm.status}
              options={editableStatusOptions}
              onChange={(event) =>
                setEditForm({ ...editForm, status: event.target.value as EditableStatus })
              }
              disabled={editingUser.id === currentUser.id}
              helperText={
                editingUser.id === currentUser.id
                  ? 'You cannot deactivate your own account.'
                  : 'Status changes revoke active sessions.'
              }
            />
          </>
        )}
      </Modal>

      <Drawer
        isOpen={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        title="User details"
      >
        {selectedUser && (
          <div className="user-details-grid">
            <div className="user-detail-header user-detail-card">
              <span className="user-avatar user-avatar-large" aria-hidden="true">
                {getInitials(selectedUser)}
              </span>
              <div>
                <h3 className="text-h2">{selectedUser.name}</h3>
                <p className="text-meta">{selectedUser.email}</p>
              </div>
            </div>
            <div className="user-detail-card">
              <Shield size={18} />
              <div>
                <p className="text-meta">Role</p>
                <RoleBadge role={selectedUser.role} />
              </div>
            </div>
            <div className="user-detail-card">
              <CheckCircle2 size={18} />
              <div>
                <p className="text-meta">Account status</p>
                <StatusBadge
                  label={
                    selectedUser.status === 'INVITED'
                      ? 'Invited'
                      : selectedUser.isActive
                        ? 'Active'
                        : 'Inactive'
                  }
                  variant={getStatusBadgeVariant(selectedUser.status)}
                />
              </div>
            </div>
            <div className="user-detail-card">
              <Calendar size={18} />
              <div>
                <p className="text-meta">Created</p>
                <p className="text-body">{formatDate(selectedUser.createdAt)}</p>
              </div>
            </div>
            <div className="user-detail-card">
              <Activity size={18} />
              <div>
                <p className="text-meta">Active sessions</p>
                <p className="text-body">{selectedUser.activeSessionCount}</p>
              </div>
            </div>
            <div className="user-detail-card user-detail-card-wide">
              <Mail size={18} />
              <div>
                <p className="text-meta">Account lifecycle</p>
                <p className="text-body">
                  {selectedUser.hasCredentialAccount
                    ? 'Credential account is provisioned.'
                    : 'Invitation is provisioned; password setup email is deferred.'}
                </p>
              </div>
            </div>
            <div className="user-detail-card user-detail-card-wide">
              <Activity size={18} />
              <div>
                <p className="text-meta">Audit</p>
                <p className="text-body">
                  Detailed audit timeline will appear after audit browsing ships.
                </p>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {pendingDialogCopy && (
        <ConfirmationDialog
          isOpen={Boolean(pendingAction)}
          title={pendingDialogCopy.title}
          description={pendingDialogCopy.description}
          confirmLabel={pendingDialogCopy.confirmLabel}
          isDestructive={pendingDialogCopy.destructive}
          onCancel={() => setPendingAction(null)}
          onConfirm={executePendingAction}
        />
      )}

      {!canManageUsers && (
        <div className="user-readonly-notice">
          <Shield size={16} />
          Reviewers can inspect users, but only administrators can invite or modify accounts.
        </div>
      )}

      <ToastContainer toasts={toasts} onClose={closeToast} />
    </>
  );
}

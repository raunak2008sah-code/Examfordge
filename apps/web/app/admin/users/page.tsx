import { PageContainer } from '@/components/admin/layout/PageContainer';
import { Breadcrumb } from '@/components/admin/layout/Breadcrumb';
import { authService } from '@/server/auth/auth-service';
import { UserManagementClient } from '@/features/users/UserManagementClient';
import { getUserManagementData, parseUserListSearchParams } from '@/features/users/queries';
import './users.css';

export const metadata = { title: 'Users Management' };

type UsersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const session = await authService.requireAnyRole(['ADMIN', 'REVIEWER']);
  const filters = parseUserListSearchParams(await searchParams);
  const data = await getUserManagementData(filters);

  return (
    <PageContainer>
      <div className="users-page-header">
        <Breadcrumb items={[{ label: 'Admin', href: '/admin' }, { label: 'Users' }]} />
        <div>
          <h1 className="text-display">Users</h1>
          <p className="text-meta">
            Invite, inspect, and manage access for administrators, reviewers, and students.
          </p>
        </div>
      </div>

      <UserManagementClient
        data={data}
        currentUser={{ id: session.user.id, role: session.user.role }}
      />
    </PageContainer>
  );
}

import React from 'react';
import { PageContainer } from '@/components/admin/layout/PageContainer';
import { Breadcrumb } from '@/components/admin/layout/Breadcrumb';
import { SectionCard } from '@/components/admin/containers/SectionCard';
import { StatCard } from '@/components/admin/containers/StatCard';
import { FileText, Users, CheckSquare, Activity, ChevronRight } from 'lucide-react';
import {
  DataTable,
  TableHeader,
  TableRow,
  TableCell,
  TableBody,
} from '@/components/ui/tables/Table';
import { Badge } from '@/components/ui/utility/Utilities';
import { prisma, type Prisma } from '@examforge/db';
import Link from 'next/link';

export const metadata = { title: 'Dashboard' };

export default async function AdminDashboardPage() {
  const [examCount, userCount, activeUserCount] = await Promise.all([
    prisma.exam.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null, isActive: true } }),
  ]);

  const recentExams = await prisma.exam.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { owner: true },
  });

  return (
    <PageContainer>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <Breadcrumb items={[{ label: 'Admin' }, { label: 'Dashboard' }]} />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginTop: 'var(--space-2)',
          }}
        >
          <div>
            <h1 className="text-display" style={{ marginBottom: 'var(--space-1)' }}>
              Dashboard
            </h1>
            <p className="text-meta">Overview of your examination system and recent activity.</p>
          </div>
          <Link href="/admin/exams/new" className="ef-button ef-button-primary">
            New Exam
          </Link>
        </div>
      </div>

      <div className="ef-grid-responsive" style={{ marginBottom: 'var(--space-6)' }}>
        <StatCard title="Total Exams" value={examCount} icon={<FileText size={20} />} />
        <StatCard title="Total Users" value={userCount} icon={<Users size={20} />} />
        <StatCard title="Active Accounts" value={activeUserCount} icon={<Activity size={20} />} />
        <StatCard title="Pending Reviews" value={0} icon={<CheckSquare size={20} />} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-6)' }}>
        <SectionCard
          title="Recent Exams"
          description="The most recently created or modified exams."
          actions={
            <Link
              href="/admin/exams"
              className="ef-button ef-button-secondary"
              style={{ padding: '4px 8px' }}
            >
              View all <ChevronRight size={16} />
            </Link>
          }
        >
          {recentExams.length > 0 ? (
            <DataTable>
              <TableHeader>
                <TableCell isHeader>Title</TableCell>
                <TableCell isHeader>Type</TableCell>
                <TableCell isHeader>Status</TableCell>
                <TableCell isHeader>Owner</TableCell>
              </TableHeader>
              <TableBody>
                {recentExams.map((exam: Prisma.ExamGetPayload<{ include: { owner: true } }>) => (
                  <TableRow key={exam.id}>
                    <TableCell>
                      <Link
                        href={`/admin/exams/${exam.id}/configure`}
                        style={{ fontWeight: 500, color: 'var(--text-primary)' }}
                      >
                        {exam.title}
                      </Link>
                    </TableCell>
                    <TableCell>{exam.examType.replace('_', ' ')}</TableCell>
                    <TableCell>
                      <Badge variant="warning">Draft</Badge>
                    </TableCell>
                    <TableCell>{exam.owner?.name || 'System'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </DataTable>
          ) : (
            <div
              className="text-meta"
              style={{
                padding: 'var(--space-4)',
                textAlign: 'center',
                backgroundColor: 'var(--bg-sunken)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              No recent exams found.
            </div>
          )}
        </SectionCard>
      </div>
    </PageContainer>
  );
}

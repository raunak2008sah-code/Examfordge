import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Roles
  const roles = ['ADMIN', 'REVIEWER', 'STUDENT'] as const;
  for (const roleName of roles) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: {
        name: roleName,
        description: `Default ${roleName} role`,
      },
    });
  }
  console.log('✔ Roles seeded');

  // 2. Default Users
  const [adminRole, reviewerRole, studentRole] = await Promise.all([
    prisma.role.findUnique({ where: { name: 'ADMIN' } }),
    prisma.role.findUnique({ where: { name: 'REVIEWER' } }),
    prisma.role.findUnique({ where: { name: 'STUDENT' } }),
  ]);
  if (!adminRole) throw new Error('ADMIN role not found');
  if (!reviewerRole) throw new Error('REVIEWER role not found');
  if (!studentRole) throw new Error('STUDENT role not found');

  const adminEmail = 'admin@examforge.com';
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      deletedAt: null,
      isActive: true,
      roleId: adminRole.id,
    },
    create: {
      email: adminEmail,
      name: 'System Admin',
      // No password hash by default for seed (OAuth or explicit set later)
      roleId: adminRole.id,
      isActive: true,
    },
  });
  console.log('✔ Default admin user seeded');

  const sampleUsers = [
    {
      email: 'reviewer@examforge.com',
      name: 'Review Lead',
      roleId: reviewerRole.id,
      isActive: true,
    },
    {
      email: 'student.one@examforge.com',
      name: 'Aarav Sharma',
      roleId: studentRole.id,
      isActive: true,
    },
    {
      email: 'student.two@examforge.com',
      name: 'Meera Iyer',
      roleId: studentRole.id,
      isActive: true,
    },
    {
      email: 'inactive.student@examforge.com',
      name: 'Inactive Student',
      roleId: studentRole.id,
      isActive: false,
    },
  ];

  for (const user of sampleUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        roleId: user.roleId,
        isActive: user.isActive,
        deletedAt: null,
      },
      create: {
        email: user.email,
        name: user.name,
        roleId: user.roleId,
        isActive: user.isActive,
      },
    });
  }
  console.log('✔ Sample users seeded');

  // 3. Default Settings (e.g. confidence thresholds)
  const defaultSettings = [
    {
      key: 'confidence.threshold.medium',
      value: { min: 70, max: 89 },
    },
    {
      key: 'confidence.threshold.high',
      value: { min: 90, max: 100 },
    },
  ];

  for (const setting of defaultSettings) {
    await prisma.settings.upsert({
      where: { key: setting.key },
      update: {},
      create: {
        key: setting.key,
        value: setting.value,
      },
    });
  }
  console.log('✔ Default settings seeded');

  console.log('Seeding complete! 🚀');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

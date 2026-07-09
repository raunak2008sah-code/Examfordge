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

  // 2. Default Admin User
  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
  if (!adminRole) throw new Error('ADMIN role not found');

  const adminEmail = 'admin@examforge.com';
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'System Admin',
      // No password hash by default for seed (OAuth or explicit set later)
      roleId: adminRole.id,
      isActive: true,
    },
  });
  console.log('✔ Default admin user seeded');

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

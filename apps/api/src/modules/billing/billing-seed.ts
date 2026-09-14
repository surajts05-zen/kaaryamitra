import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ALL_MODULES = [
  'core_hr',
  'leave',
  'attendance',
  'ess',
  'helpdesk',
  'assets',
  'performance',
  'payroll',
  'projects',
  'library',
  'reports',
  'ai',
  'developer',
];

async function seedBilling() {
  console.log('🌱 Seeding billing plans and modules...');

  // 1. Seed Modules
  const modules = [
    { key: 'core_hr', name: 'Core HR', monthlyPriceInr: 0, monthlyPriceUsd: 0 },
    { key: 'leave', name: 'Leave Management', monthlyPriceInr: 0, monthlyPriceUsd: 0 },
    { key: 'attendance', name: 'Attendance & Timesheets', monthlyPriceInr: 0, monthlyPriceUsd: 0 },
    { key: 'ess', name: 'Employee Self Service', monthlyPriceInr: 0, monthlyPriceUsd: 0 },
    { key: 'helpdesk', name: 'Helpdesk', monthlyPriceInr: 0, monthlyPriceUsd: 0 },
    { key: 'assets', name: 'Asset Management', monthlyPriceInr: 499, monthlyPriceUsd: 6 },
    { key: 'performance', name: 'Performance Management', monthlyPriceInr: 999, monthlyPriceUsd: 12 },
    { key: 'payroll', name: 'Payroll & Compensation', monthlyPriceInr: 1499, monthlyPriceUsd: 18 },
    { key: 'projects', name: 'Project & Budget Mgmt', monthlyPriceInr: 799, monthlyPriceUsd: 10 },
    { key: 'library', name: 'Content Library', monthlyPriceInr: 299, monthlyPriceUsd: 4 },
    { key: 'reports', name: 'Advanced Reports', monthlyPriceInr: 499, monthlyPriceUsd: 6 },
    { key: 'ai', name: 'AI Assistant', monthlyPriceInr: 1999, monthlyPriceUsd: 24 },
    { key: 'developer', name: 'Developer Hub', monthlyPriceInr: 499, monthlyPriceUsd: 6 },
  ];

  for (let i = 0; i < modules.length; i++) {
    const mod = modules[i];
    if (!mod) continue;
    await (prisma as any).moduleAddon.upsert({
      where: { key: mod.key },
      create: { ...mod, sortOrder: i },
      update: { ...mod, sortOrder: i },
    });
  }

  // 2. Seed Plans
  const plans = [
    {
      name: 'Free',
      slug: 'FREE' as const,
      monthlyPriceInr: 0,
      monthlyPriceUsd: 0,
      maxEmployees: 10,
      maxStorageMb: 500,
      maxApiCallsPerMonth: 1000,
      trialDays: 14,
      modules: ['core_hr', 'leave', 'ess'],
      sortOrder: 0,
    },
    {
      name: 'Starter',
      slug: 'STARTER' as const,
      monthlyPriceInr: 2999,
      monthlyPriceUsd: 35,
      maxEmployees: 50,
      maxStorageMb: 5000,
      maxApiCallsPerMonth: 50000,
      employeeOverageRateInr: 59,
      employeeOverageRateUsd: 0.7,
      trialDays: 0,
      modules: ['core_hr', 'leave', 'attendance', 'ess', 'helpdesk'],
      sortOrder: 1,
    },
    {
      name: 'Growth',
      slug: 'GROWTH' as const,
      monthlyPriceInr: 7999,
      monthlyPriceUsd: 95,
      maxEmployees: 250,
      maxStorageMb: 25000,
      maxApiCallsPerMonth: 500000,
      employeeOverageRateInr: 39,
      employeeOverageRateUsd: 0.5,
      trialDays: 0,
      modules: [
        'core_hr',
        'leave',
        'attendance',
        'ess',
        'helpdesk',
        'assets',
        'performance',
        'projects',
        'library',
        'reports',
      ],
      sortOrder: 2,
    },
    {
      name: 'Enterprise',
      slug: 'ENTERPRISE' as const,
      monthlyPriceInr: 24999, // placeholder for custom
      monthlyPriceUsd: 299,
      maxEmployees: null, // unlimited
      maxStorageMb: null,
      maxApiCallsPerMonth: null,
      trialDays: 30, // POC trial
      modules: ALL_MODULES,
      sortOrder: 3,
    },
  ];

  for (const plan of plans) {
    await (prisma as any).planDefinition.upsert({
      where: { slug: plan.slug },
      create: plan,
      update: plan,
    });
  }

  console.log('✅ Billing plans and modules seeded successfully.');
}

seedBilling()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

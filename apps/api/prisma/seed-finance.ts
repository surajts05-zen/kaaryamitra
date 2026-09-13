import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.findFirst({
    where: { slug: 'kaaryamitra' } // Try kaaryamitra first
  });

  const targetTenant = tenant || await prisma.tenant.findFirst();

  if (!targetTenant) {
    console.error('No tenant found.');
    process.exit(1);
  }

  console.log(`Seeding finance data for tenant: ${targetTenant.name} (${targetTenant.id})`);

  // Cost Centers
  const costCenters = [
    { name: 'Engineering & Technology', code: 'ENG-01', isActive: true, tenantId: targetTenant.id },
    { name: 'Sales & Marketing', code: 'SLS-01', isActive: true, tenantId: targetTenant.id },
    { name: 'Human Resources', code: 'HR-01', isActive: true, tenantId: targetTenant.id },
    { name: 'Operations & Admin', code: 'OPS-01', isActive: true, tenantId: targetTenant.id }
  ];

  for (const cc of costCenters) {
    await prisma.costCenter.upsert({
      where: { tenantId_code: { tenantId: cc.tenantId, code: cc.code } },
      update: {},
      create: cc
    });
  }

  // Budget Categories
  const budgetCategories = [
    { name: 'Software Subscriptions', code: 'SW-OPEX', capexOpex: 'OPEX', isActive: true, tenantId: targetTenant.id },
    { name: 'Hardware & Equipment', code: 'HW-CAPEX', capexOpex: 'CAPEX', isActive: true, tenantId: targetTenant.id },
    { name: 'Travel & Events', code: 'TRV-OPEX', capexOpex: 'OPEX', isActive: true, tenantId: targetTenant.id },
    { name: 'Consulting & Services', code: 'CNS-OPEX', capexOpex: 'OPEX', isActive: true, tenantId: targetTenant.id }
  ];

  for (const bc of budgetCategories) {
    await prisma.budgetCategory.upsert({
      where: { tenantId_code: { tenantId: bc.tenantId, code: bc.code } },
      update: {},
      create: bc as any // using any because capexOpex is an enum, prisma client handles it
    });
  }

  // Projects
  await prisma.project.upsert({
    where: { tenantId_code: { tenantId: targetTenant.id, code: 'INT-FY26' } },
    update: {},
    create: {
      tenantId: targetTenant.id,
      name: 'Internal Operations FY26', 
      code: 'INT-FY26', 
      description: 'Default bucket for internal operational expenses',
      status: 'ACTIVE',
      priority: 'MEDIUM',
      approvedBudget: 1000000,
      currentBudget: 1000000
    }
  });

  console.log('Finance data seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

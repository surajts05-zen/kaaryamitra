import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.findUnique({ where: { slug: 'vyoma' } });
  if (!tenant) return console.log('Tenant vyoma not found');
  
  const categories = [
    { name: 'Human Resources', description: 'Employee lifecycle, benefits, and workplace culture' },
    { name: 'IT & Security', description: 'Data protection, hardware usage, and cybersecurity' },
    { name: 'Compliance & Legal', description: 'Code of conduct, anti-harassment, and legal compliance' },
    { name: 'Finance & Expenses', description: 'Travel, reimbursements, and purchasing' },
    { name: 'Workplace & Facilities', description: 'Health & safety, office rules, and remote work' }
  ];

  for (const cat of categories) {
    await prisma.policyCategory.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: cat.name } },
      update: {},
      create: { tenantId: tenant.id, name: cat.name, description: cat.description }
    });
  }
  console.log('Categories seeded successfully');
}
main().catch(console.error).finally(() => prisma.$disconnect());

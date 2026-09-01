import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany();
  for (const tenant of tenants) {
    const categories = [
      { name: 'Id Proof', description: 'Government issued ID card', isRequired: true },
      { name: 'Address Proof', description: 'Utility bill, passport, or rent agreement', isRequired: true },
      { name: 'Nationality proof / passport', description: 'Passport or Citizenship document', isRequired: false }
    ];

    for (const cat of categories) {
      await prisma.documentCategory.upsert({
        where: { tenantId_name: { tenantId: tenant.id, name: cat.name } },
        update: {},
        create: {
          tenantId: tenant.id,
          name: cat.name,
          description: cat.description,
          isRequired: cat.isRequired,
        }
      });
    }
  }
  console.log('Done seeding categories');
}

main().finally(() => prisma.$disconnect());

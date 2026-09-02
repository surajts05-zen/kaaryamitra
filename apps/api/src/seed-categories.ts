import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany();
  for (const t of tenants) {
    const cats = [
      { name: 'IT Support', description: 'Hardware, software, and network issues' },
      { name: 'HR Inquiry', description: 'Payroll, benefits, and policies' },
      { name: 'Facilities', description: 'Office maintenance and supplies' }
    ];
    for (const cat of cats) {
      await prisma.helpdeskCategory.upsert({
        where: { tenantId_name: { tenantId: t.id, name: cat.name } },
        update: {},
        create: { tenantId: t.id, name: cat.name, description: cat.description }
      });
    }
  }
  console.log('Categories seeded for all tenants!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

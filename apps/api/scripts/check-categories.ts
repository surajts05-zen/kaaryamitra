import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const cats = await prisma.helpdeskCategory.findMany();
  console.log(cats);
}
main().finally(() => prisma.$disconnect());

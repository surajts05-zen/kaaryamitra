import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'ca@vyomalabs.online' } });
  if (!user) throw new Error('User not found');

  const role = await prisma.role.findFirst({
    where: { name: 'Company Admin', tenantId: user.tenantId }
  });
  if (!role) throw new Error('Role not found');

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: user.id,
        roleId: role.id
      }
    },
    update: {},
    create: {
      userId: user.id,
      roleId: role.id
    }
  });

  console.log('Successfully assigned Company Admin role to ca@vyomalabs.online');
}

main().catch(console.error).finally(() => prisma.$disconnect());

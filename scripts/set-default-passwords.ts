import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../apps/api/src/lib/auth.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Fetching users with PENDING_SETUP status...');
  const users = await prisma.user.findMany({
    where: {
      status: 'PENDING_SETUP',
    },
  });

  if (users.length === 0) {
    console.log('No users found needing password setup.');
    return;
  }

  const defaultPasswordHash = await hashPassword('Password@123');

  console.log(`Updating ${users.length} users with default password...`);
  
  const result = await prisma.user.updateMany({
    where: {
      status: 'PENDING_SETUP',
    },
    data: {
      passwordHash: defaultPasswordHash,
      status: 'ACTIVE',
    },
  });

  console.log(`Successfully updated ${result.count} users.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

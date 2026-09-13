import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) return console.log('Tenant not found');

  const project = await prisma.project.findFirst({
    where: { tenantId: tenant.id, code: 'INT-FY26' }
  });

  if (!project) return console.log('Project INT-FY26 not found');

  const category = await prisma.budgetCategory.findFirst({
    where: { tenantId: tenant.id, code: 'SW-OPEX' }
  });

  // Create a budget request
  const request = await prisma.budgetRequest.create({
    data: {
      tenantId: tenant.id,
      projectId: project.id,
      requesterId: 'cmtiigkaa0005yp1udkhcp9he',
      requestNumber: 'REQ-' + Date.now().toString().slice(-6),
      requestType: 'OPERATIONAL',
      priority: 'HIGH',
      status: 'APPROVED',
      objective: 'Purchase new SaaS software licenses',
      businessJustification: 'Team needs GitHub Copilot',
      requestedAmount: 50000,
      lineItems: {
        create: [
          {
            description: 'GitHub Copilot Enterprise',
            categoryId: category?.id,
            capexOpex: 'OPEX',
            quantity: 10,
            unitCost: 5000,
            requestedAmount: 50000
          }
        ]
      }
    }
  });

  // Create a transaction
  await prisma.budgetTransaction.create({
    data: {
      tenantId: tenant.id,
      projectId: project.id,
      type: 'EXPENSE',
      amount: 15000,
      referenceId: 'INV-29384',
      description: 'AWS Cloud Hosting',
      transactionDate: new Date(),
      createdBy: 'cmtiigkaa0005yp1udkhcp9he'
    }
  });

  // Update project costs
  await prisma.project.update({
    where: { id: project.id },
    data: {
      actualCost: { increment: 15000 },
      committedCost: { increment: 50000 }
    }
  });

  console.log('seeded budget data');
}

main().catch(console.error).finally(() => prisma.$disconnect());

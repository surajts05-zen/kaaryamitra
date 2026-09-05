import { PrismaClient } from '@prisma/client';
import { STANDARD_POLICY_TEMPLATES } from './apps/api/src/modules/policies/policies.service.ts';

const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany();
  
  for (const tenant of tenants) {
    const tenantId = tenant.id;
    console.log(`Processing tenant: ${tenant.name} (${tenantId})`);
    
    const categoriesMap = new Map<string, string>();
    
    for (const tpl of STANDARD_POLICY_TEMPLATES) {
      // Create category if not exists
      if (!categoriesMap.has(tpl.categoryName)) {
        let cat = await prisma.policyCategory.findUnique({
          where: { tenantId_name: { tenantId, name: tpl.categoryName } }
        });
        if (!cat) {
          cat = await prisma.policyCategory.create({
            data: {
              tenantId,
              name: tpl.categoryName,
              description: tpl.categoryDescription
            }
          });
        }
        categoriesMap.set(tpl.categoryName, cat.id);
      }

      const categoryId = categoriesMap.get(tpl.categoryName)!;
      
      // Check if policy exists
      const existingPolicy = await prisma.policy.findFirst({
        where: { tenantId, title: tpl.title }
      });
      
      if (!existingPolicy) {
        await prisma.$transaction(async (tx) => {
          const policy = await tx.policy.create({
            data: {
              tenantId,
              categoryId,
              title: tpl.title,
              description: tpl.description,
              isPublished: true,
              requiresAck: tpl.requiresAck
            }
          });
  
          const version = await tx.policyVersion.create({
            data: {
              tenantId,
              policyId: policy.id,
              versionNumber: 1,
              status: 'PUBLISHED',
              blocks: tpl.blocks as any,
              publishedAt: new Date()
            }
          });
        });
        console.log(`  + Added: ${tpl.title}`);
      } else {
        console.log(`  - Skipped (already exists): ${tpl.title}`);
      }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

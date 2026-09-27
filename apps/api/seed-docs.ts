import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

const docs = [
  // Identity & Address
  { name: 'Aadhar Card', description: 'National Identity & Address Proof', isRequired: true },
  { name: 'PAN Card', description: 'Tax Identification Number', isRequired: true },
  { name: 'Passport', description: 'International Travel Document', isRequired: false },
  { name: 'Driving License', description: 'Driving License ID', isRequired: false },
  { name: 'Voter ID', description: 'Voter Identification Card', isRequired: false },
  { name: 'Current Address Proof', description: 'Rental agreement, utility bill, etc.', isRequired: true },
  
  // Education
  { name: '10th Marksheet/Certificate', description: 'Secondary School Certificate', isRequired: true },
  { name: '12th Marksheet/Certificate', description: 'Higher Secondary Certificate', isRequired: true },
  { name: 'Degree Certificate', description: 'Graduation Certificate', isRequired: true },
  { name: 'Post-Graduation Certificate', description: 'Master\'s Degree if applicable', isRequired: false },
  
  // Previous Employment
  { name: 'Relieving Letter', description: 'From last employer', isRequired: true },
  { name: 'Experience Letters', description: 'From all previous employers', isRequired: true },
  { name: 'Last 3 Months Payslips', description: 'From last employer', isRequired: true },
  { name: 'Form 16', description: 'Tax deduction certificate from previous employer', isRequired: false },
  { name: 'Resignation Acceptance', description: 'Proof of resignation acceptance', isRequired: false },
  
  // Banking & Tax
  { name: 'Cancelled Cheque', description: 'For salary account setup', isRequired: true },
  
  // Company Documents
  { name: 'Signed Offer Letter', description: 'Accepted offer letter', isRequired: true },
  { name: 'Signed Appointment Letter', description: 'Signed copy of appointment', isRequired: true },
  { name: 'Non-Disclosure Agreement (NDA)', description: 'Confidentiality agreement', isRequired: true },
  
  // Miscellaneous
  { name: 'Passport Size Photographs', description: 'Recent photographs', isRequired: true },
  { name: 'Medical Fitness Certificate', description: 'Doctor\'s fitness certificate', isRequired: false },
  { name: 'Background Verification Form', description: 'Signed BGV consent form', isRequired: false },
];

async function main() {
  const tenants = await prisma.tenant.findMany();
  for (const tenant of tenants) {
    for (const doc of docs) {
      await prisma.documentCategory.upsert({
        where: {
          tenantId_name: {
            tenantId: tenant.id,
            name: doc.name,
          }
        },
        update: {},
        create: {
          tenantId: tenant.id,
          name: doc.name,
          description: doc.description,
          isRequired: doc.isRequired,
        }
      });
    }
    console.log(`Seeded standard document categories for tenant: ${tenant.name}`);
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});

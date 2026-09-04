import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import { z } from 'zod';
import {
  createPolicyCategorySchema,
  updatePolicyCategorySchema,
  createPolicySchema,
  updatePolicySchema,
  updatePolicyVersionSchema
} from './policies.schema.js';

export const STANDARD_POLICY_TEMPLATES = [
  {
    categoryName: 'Code of Conduct & Ethics',

    categoryDescription: 'Business conduct, ethics, workplace behavior, anti-harassment',
    title: 'Code of Business Conduct & Ethics',
    description: 'Core rules governing employee conduct, professional ethics, anti-harassment, and conflict of interest.',
    requiresAck: true,
    blocks: [
      { id: '1', type: 'heading', level: 1, content: '1. Objective & Purpose' },
      { id: '2', type: 'paragraph', content: 'This policy outlines the ethical standards and expected behavior of all employees at KaaryaMitra. We are committed to maintaining a respectful, inclusive, and professional environment free from harassment or discrimination.' },
      { id: '3', type: 'alert', alertType: 'warning', content: 'Compliance with this Code of Conduct is mandatory for all full-time, part-time, and contract personnel.' },
      { id: '4', type: 'heading', level: 2, content: '2. Professional Integrity & Anti-Harassment' },
      { id: '5', type: 'list', items: [
        'Maintain zero tolerance for discrimination, sexual harassment, or verbal abuse.',
        'Protect company confidential information and client data at all times.',
        'Avoid real or perceived conflicts of interest in all business dealings.'
      ]},
      { id: '6', type: 'heading', level: 2, content: '3. Reporting Violations' },
      { id: '7', type: 'paragraph', content: 'Any employee who observes a violation of this code should report it immediately to their Manager or HR. Whistleblowers are protected against retaliation.' }
    ]
  },
  {
    categoryName: 'Attendance & Leave',
    categoryDescription: 'Working hours, leave policies, holidays, remote work rules',
    title: 'Employee Attendance & Leave Policy',
    description: 'Guidelines on working hours, leave types, accrual rules, and remote work arrangements.',
    requiresAck: true,
    blocks: [
      { id: '1', type: 'heading', level: 1, content: '1. Standard Working Hours' },
      { id: '2', type: 'paragraph', content: 'Standard working hours are 9:00 AM to 6:00 PM, Monday through Friday, with a 1-hour lunch break. Core collaboration hours are 10:00 AM to 4:00 PM.' },
      { id: '3', type: 'heading', level: 2, content: '2. Leave Entitlements' },
      { id: '4', type: 'list', items: [
        'Earned / Privilege Leave: Accrued monthly up to 18 days per year.',
        'Casual & Sick Leave: 12 days per year allotted on joining.',
        'Maternity / Paternity Leave: Provided in accordance with statutory labor laws.'
      ]},
      { id: '5', type: 'alert', alertType: 'info', content: 'Leave applications must be submitted in advance through the ESS portal for Manager approval.' }
    ]
  },
  {
    categoryName: 'IT & Data Security',
    categoryDescription: 'Acceptable use, password safety, device management, confidentiality',
    title: 'IT & Data Security Policy',
    description: 'Security practices for device management, passwords, phishing awareness, and data protection.',
    requiresAck: true,
    blocks: [
      { id: '1', type: 'heading', level: 1, content: '1. Device Security & Access Control' },
      { id: '2', type: 'paragraph', content: 'All laptops and company devices must be encrypted and protected by a strong password or biometric lock. Devices must lock automatically after 5 minutes of inactivity.' },
      { id: '3', type: 'heading', level: 2, content: '2. Password & Multi-Factor Authentication' },
      { id: '4', type: 'list', items: [
        'Passwords must be at least 12 characters long and changed every 90 days.',
        'Multi-Factor Authentication (MFA) must be enabled on all corporate email and cloud accounts.',
        'Never share passwords or OTPs with anyone, including internal IT staff.'
      ]},
      { id: '5', type: 'alert', alertType: 'warning', content: 'Report suspicious emails or phishing attempts immediately to IT Security.' }
    ]
  },
  {
    categoryName: 'Health & Safety',
    categoryDescription: 'Workplace safety, emergency procedures, health guidelines',
    title: 'Workplace Health & Emergency Safety Policy',
    description: 'Emergency response procedures, office safety protocols, and health resources.',
    requiresAck: false,
    blocks: [
      { id: '1', type: 'heading', level: 1, content: '1. Workplace Health & Hygiene' },
      { id: '2', type: 'paragraph', content: 'We are committed to providing a clean, safe, and ergonomic working environment for all team members.' },
      { id: '3', type: 'heading', level: 2, content: '2. Emergency Evacuation Procedures' },
      { id: '4', type: 'list', items: [
        'Locate the nearest emergency exits on your floor map upon joining.',
        'In case of fire alarm, exit calmly using stairs. Do not use elevators.',
        'Gather at the designated Assembly Area outside the main entrance.'
      ]}
    ]
  },
  {
    categoryName: 'Compensation & Benefits',
    categoryDescription: 'Payroll, reimbursements, perks, performance appraisals',
    title: 'Compensation & Expense Reimbursement Guidelines',
    description: 'Overview of payroll disbursement schedule, expense claims, and employee benefits.',
    requiresAck: true,
    blocks: [
      { id: '1', type: 'heading', level: 1, content: '1. Payroll Processing Schedule' },
      { id: '2', type: 'paragraph', content: 'Monthly salaries are disbursed directly into employee bank accounts on or before the last working day of each calendar month.' },
      { id: '3', type: 'heading', level: 2, content: '2. Business Expense Claims' },
      { id: '4', type: 'list', items: [
        'Reimbursement requests for travel, client meals, or supplies must be submitted within 30 days.',
        'Valid tax receipts/invoices are mandatory for all claim approvals.'
      ]}
    ]
  },
  {
    categoryName: 'Onboarding & Offboarding',
    categoryDescription: 'Joining formalities, probation, exit procedures',
    title: 'Onboarding & Exit Formalities Policy',
    description: 'Guidelines for new hire orientation, probation evaluation, notice period, and asset clearance during offboarding.',
    requiresAck: true,
    blocks: [
      { id: '1', type: 'heading', level: 1, content: '1. Onboarding & Probation' },
      { id: '2', type: 'paragraph', content: 'All new hires undergo a standard probation period of 3 to 6 months. Performance reviews are conducted at 30, 60, and 90 days.' },
      { id: '3', type: 'heading', level: 2, content: '2. Notice Period & Exit Formalities' },
      { id: '4', type: 'list', items: [
        'Employees resigning must serve a 30 to 60 day notice period as per employment contract.',
        'All company laptops, access cards, and documents must be returned prior to the last working day.',
        'No Due Certificate (Clearance) must be completed to initiate Final & Full (F&F) settlement.'
      ]}
    ]
  }
];

export class PoliciesService {
  // ─────────────────────────────────────────────────────────────────────────────
  // Categories
  // ─────────────────────────────────────────────────────────────────────────────

  static async getCategories(tenantId: string) {
    let categories = await prisma.policyCategory.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { policies: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    if (categories.length === 0) {
      await PoliciesService.seedStandardPoliciesForTenant(tenantId);
      categories = await prisma.policyCategory.findMany({
        where: { tenantId },
        include: {
          _count: {
            select: { policies: true }
          }
        },
        orderBy: { name: 'asc' }
      });
    }

    return categories;
  }

  static async createCategory(tenantId: string, data: z.infer<typeof createPolicyCategorySchema>) {
    return prisma.policyCategory.create({
      data: { tenantId, name: data.name, description: data.description ?? null }
    });
  }

  static async updateCategory(tenantId: string, id: string, data: z.infer<typeof updatePolicyCategorySchema>) {
    const updateData: any = { ...data };
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);
    return prisma.policyCategory.update({
      where: { id, tenantId },
      data: updateData
    });
  }

  static async deleteCategory(tenantId: string, id: string) {
    const count = await prisma.policy.count({ where: { categoryId: id, tenantId } });
    if (count > 0) throw AppError.badRequest('Cannot delete category with policies attached');
    return prisma.policyCategory.delete({ where: { id, tenantId } });
  }

  static async seedStandardPoliciesForTenant(tenantId: string) {
    const existingPoliciesCount = await prisma.policy.count({ where: { tenantId } });
    if (existingPoliciesCount > 0) {
      return { message: 'Tenant already has policies configured.' };
    }

    const categoriesMap = new Map<string, string>();
    for (const tpl of STANDARD_POLICY_TEMPLATES) {
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

        if (tpl.requiresAck) {
          const activeEmployees = await tx.employee.findMany({
            where: { tenantId, exitDate: null }
          });
          if (activeEmployees.length > 0) {
            await tx.policyAcknowledgement.createMany({
              data: activeEmployees.map(emp => ({
                tenantId,
                policyVersionId: version.id,
                employeeId: emp.id,
                status: 'PENDING'
              }))
            });
          }
        }
      });
    }

    return { success: true, message: 'Standard policies seeded successfully.' };
  }

  static async seedStandardPoliciesForAllTenants() {
    const tenants = await prisma.tenant.findMany({ select: { id: true } });
    for (const t of tenants) {
      await PoliciesService.seedStandardPoliciesForTenant(t.id);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Policies
  // ─────────────────────────────────────────────────────────────────────────────

  static async getPolicies(tenantId: string) {
    let policies = await prisma.policy.findMany({
      where: { tenantId },
      include: {
        category: true,
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (policies.length === 0) {
      await PoliciesService.seedStandardPoliciesForTenant(tenantId);
      policies = await prisma.policy.findMany({
        where: { tenantId },
        include: {
          category: true,
          versions: {
            orderBy: { versionNumber: 'desc' },
            take: 1
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    return policies;
  }

  static async getPolicyById(tenantId: string, id: string) {
    const policy = await prisma.policy.findFirst({
      where: { id, tenantId },
      include: {
        category: true,
        versions: {
          orderBy: { versionNumber: 'desc' },
          include: {
            publisher: { select: { firstName: true, lastName: true, email: true } },
            _count: { select: { acknowledgements: true } }
          }
        }
      }
    });
    if (!policy) throw AppError.notFound('Policy');
    return policy;
  }

  static async createPolicy(tenantId: string, data: z.infer<typeof createPolicySchema>) {
    return prisma.$transaction(async (tx) => {
      const policy = await tx.policy.create({
        data: {
          tenantId,
          title: data.title,
          categoryId: data.categoryId,
          requiresAck: data.requiresAck,
          description: data.description ?? null,
          isPublished: false
        }
      });

      // Spawn initial draft version
      await tx.policyVersion.create({
        data: {
          tenantId,
          policyId: policy.id,
          versionNumber: 1,
          status: 'DRAFT',
          blocks: []
        }
      });

      return policy;
    });
  }

  static async updatePolicy(tenantId: string, id: string, data: z.infer<typeof updatePolicySchema>) {
    const updateData: any = { ...data };
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);
    return prisma.policy.update({
      where: { id, tenantId },
      data: updateData
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Policy Versions & Publishing
  // ─────────────────────────────────────────────────────────────────────────────

  static async createDraftVersion(tenantId: string, policyId: string) {
    const policy = await prisma.policy.findFirst({ where: { id: policyId, tenantId }, include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } } });
    if (!policy) throw AppError.notFound('Policy');

    const hasDraft = policy.versions.some(v => v.status === 'DRAFT');
    if (hasDraft) throw AppError.badRequest('A draft version already exists');

    const lastVersion = policy.versions[0];
    const newVersionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

    return prisma.policyVersion.create({
      data: {
        tenantId,
        policyId,
        versionNumber: newVersionNumber,
        status: 'DRAFT',
        blocks: lastVersion ? (lastVersion.blocks as any) : []
      }
    });
  }

  static async getVersionById(tenantId: string, policyId: string, versionId: string) {
    const version = await prisma.policyVersion.findFirst({
      where: { id: versionId, policyId, tenantId }
    });
    if (!version) throw AppError.notFound('Policy version');
    return version;
  }

  static async saveDraftVersion(tenantId: string, policyId: string, versionId: string, data: z.infer<typeof updatePolicyVersionSchema>) {
    const version = await prisma.policyVersion.findFirst({ where: { id: versionId, policyId, tenantId } });
    if (!version) throw AppError.notFound('Policy version');
    if (version.status !== 'DRAFT') throw AppError.badRequest('Can only edit DRAFT versions');

    return prisma.policyVersion.update({
      where: { id: versionId },
      data: { blocks: data.blocks as any }
    });
  }

  static async publishVersion(tenantId: string, policyId: string, versionId: string, userId: string) {
    const policy = await prisma.policy.findFirst({ where: { id: policyId, tenantId } });
    if (!policy) throw AppError.notFound('Policy');

    const version = await prisma.policyVersion.findFirst({ where: { id: versionId, policyId, tenantId } });
    if (!version) throw AppError.notFound('Policy version');
    if (version.status !== 'DRAFT') throw AppError.badRequest('Can only publish DRAFT versions');

    return prisma.$transaction(async (tx) => {
      // Archive existing published versions
      await tx.policyVersion.updateMany({
        where: { policyId, tenantId, status: 'PUBLISHED' },
        data: { status: 'ARCHIVED' }
      });

      // Publish this version
      const published = await tx.policyVersion.update({
        where: { id: versionId },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
          publishedById: userId
        }
      });

      // Mark policy as published
      await tx.policy.update({
        where: { id: policyId },
        data: { isPublished: true }
      });

      // Generate acknowledgements if required
      if (policy.requiresAck) {
        const activeEmployees = await tx.employee.findMany({
          where: { tenantId, exitDate: null }
        });

        if (activeEmployees.length > 0) {
          await tx.policyAcknowledgement.createMany({
            data: activeEmployees.map(emp => ({
              tenantId,
              policyVersionId: versionId,
              employeeId: emp.id,
              status: 'PENDING'
            }))
          });
        }
      }

      return published;
    });
  }

  static async getVersionAcknowledgements(tenantId: string, policyId: string, versionId: string) {
    return prisma.policyAcknowledgement.findMany({
      where: { tenantId, policyVersionId: versionId },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            workEmail: true,
            employeeCode: true
          }
        }
      },
      orderBy: { status: 'asc' }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ESS / Employee Actions
  // ─────────────────────────────────────────────────────────────────────────────

  static async getMyPolicies(tenantId: string, employeeId: string) {
    const publishedPolicies = await prisma.policy.findMany({
      where: { tenantId, isPublished: true },
      include: {
        category: true,
        versions: {
          where: { status: 'PUBLISHED' },
          include: {
            acknowledgements: {
              where: { employeeId }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return publishedPolicies.map(p => {
      const activeVersion = p.versions[0];
      const ack = activeVersion?.acknowledgements[0];
      return {
        ...p,
        activeVersion,
        myAcknowledgement: ack || null
      };
    });
  }

  static async acknowledgePolicy(tenantId: string, employeeId: string, versionId: string) {
    const ack = await prisma.policyAcknowledgement.findFirst({
      where: { tenantId, employeeId, policyVersionId: versionId }
    });

    if (!ack) {
      // Create if it didn't exist for some reason but was required
      const version = await prisma.policyVersion.findUnique({
        where: { id: versionId },
        include: { policy: true }
      });
      if (!version || version.status !== 'PUBLISHED' || !version.policy.requiresAck) {
        throw AppError.badRequest('Invalid policy for acknowledgement');
      }

      return prisma.policyAcknowledgement.create({
        data: {
          tenantId,
          employeeId,
          policyVersionId: versionId,
          status: 'ACKNOWLEDGED',
          acknowledgedAt: new Date()
        }
      });
    }

    return prisma.policyAcknowledgement.update({
      where: { id: ack.id },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedAt: new Date()
      }
    });
  }
}


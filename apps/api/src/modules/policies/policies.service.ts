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
    categoryName: 'Attendance & Leave',
    categoryDescription: 'Standard guidelines for Attendance & Leave',
    title: 'Leave Policy',
    description: 'Standard guidelines and rules for the Leave Policy.',
    requiresAck: true,
    blocks: [
      { id: '1', type: 'heading', level: 1, content: '1. Overview' },
      { id: '2', type: 'paragraph', content: 'This is the standard Leave Policy for KaaryaMitra employees.' }
    ]
  },
  {
    categoryName: 'Attendance & Leave',
    categoryDescription: 'Standard guidelines for Attendance & Leave',
    title: 'Attendance Policy',
    description: 'Standard guidelines and rules for the Attendance Policy.',
    requiresAck: true,
    blocks: [
      { id: '1', type: 'heading', level: 1, content: '1. Overview' },
      { id: '2', type: 'paragraph', content: 'This is the standard Attendance Policy for KaaryaMitra employees.' }
    ]
  },
  {
    categoryName: 'Attendance & Leave',
    categoryDescription: 'Standard guidelines for Attendance & Leave',
    title: 'Work From Home / Hybrid Work Policy',
    description: 'Standard guidelines and rules for the Work From Home / Hybrid Work Policy.',
    requiresAck: true,
    blocks: [
      { id: '1', type: 'heading', level: 1, content: '1. Overview' },
      { id: '2', type: 'paragraph', content: 'This is the standard Work From Home / Hybrid Work Policy for KaaryaMitra employees.' }
    ]
  },
  {
    categoryName: 'Attendance & Leave',
    categoryDescription: 'Standard guidelines for Attendance & Leave',
    title: 'Working Hours Policy',
    description: 'Standard guidelines and rules for the Working Hours Policy.',
    requiresAck: true,
    blocks: [
      { id: '1', type: 'heading', level: 1, content: '1. Overview' },
      { id: '2', type: 'paragraph', content: 'This is the standard Working Hours Policy for KaaryaMitra employees.' }
    ]
  },
  {
    categoryName: 'Attendance & Leave',
    categoryDescription: 'Standard guidelines for Attendance & Leave',
    title: 'Overtime Policy',
    description: 'Standard guidelines and rules for the Overtime Policy.',
    requiresAck: true,
    blocks: [
      { id: '1', type: 'heading', level: 1, content: '1. Overview' },
      { id: '2', type: 'paragraph', content: 'This is the standard Overtime Policy for KaaryaMitra employees.' }
    ]
  },
  {
    categoryName: 'Code of Conduct & Ethics',
    categoryDescription: 'Standard guidelines for Code of Conduct & Ethics',
    title: 'Work Ethic and Code of Conduct',
    description: 'Standard guidelines and rules for the Work Ethic and Code of Conduct.',
    requiresAck: true,
    blocks: [
      { id: '1', type: 'heading', level: 1, content: '1. Overview' },
      { id: '2', type: 'paragraph', content: 'This is the standard Work Ethic and Code of Conduct for KaaryaMitra employees.' }
    ]
  },
  {
    categoryName: 'Code of Conduct & Ethics',
    categoryDescription: 'Standard guidelines for Code of Conduct & Ethics',
    title: 'Employee Code of Ethics',
    description: 'Standard guidelines and rules for the Employee Code of Ethics.',
    requiresAck: true,
    blocks: [
      { id: '1', type: 'heading', level: 1, content: '1. Overview' },
      { id: '2', type: 'paragraph', content: 'This is the standard Employee Code of Ethics for KaaryaMitra employees.' }
    ]
  },
  {
    categoryName: 'Code of Conduct & Ethics',
    categoryDescription: 'Standard guidelines for Code of Conduct & Ethics',
    title: 'Anti-Harassment / Workplace Conduct Policy',
    description: 'Standard guidelines and rules for the Anti-Harassment / Workplace Conduct Policy.',
    requiresAck: true,
    blocks: [
      { id: '1', type: 'heading', level: 1, content: '1. Overview' },
      { id: '2', type: 'paragraph', content: 'This is the standard Anti-Harassment / Workplace Conduct Policy for KaaryaMitra employees.' }
    ]
  },
  {
    categoryName: 'Code of Conduct & Ethics',
    categoryDescription: 'Standard guidelines for Code of Conduct & Ethics',
    title: 'Equal Opportunity Policy',
    description: 'Standard guidelines and rules for the Equal Opportunity Policy.',
    requiresAck: true,
    blocks: [
      { id: '1', type: 'heading', level: 1, content: '1. Overview' },
      { id: '2', type: 'paragraph', content: 'This is the standard Equal Opportunity Policy for KaaryaMitra employees.' }
    ]
  },
  {
    categoryName: 'Code of Conduct & Ethics',
    categoryDescription: 'Standard guidelines for Code of Conduct & Ethics',
    title: 'Conflict of Interest Policy',
    description: 'Standard guidelines and rules for the Conflict of Interest Policy.',
    requiresAck: true,
    blocks: [
      { id: '1', type: 'heading', level: 1, content: '1. Overview' },
      { id: '2', type: 'paragraph', content: 'This is the standard Conflict of Interest Policy for KaaryaMitra employees.' }
    ]
  },
  {
    categoryName: 'IT & Data Security',
    categoryDescription: 'Standard guidelines for IT & Data Security',
    title: 'IT / Acceptable Use Policy',
    description: 'Standard guidelines and rules for the IT / Acceptable Use Policy.',
    requiresAck: true,
    blocks: [
      { id: '1', type: 'heading', level: 1, content: '1. Overview' },
      { id: '2', type: 'paragraph', content: 'This is the standard IT / Acceptable Use Policy for KaaryaMitra employees.' }
    ]
  },
  {
    categoryName: 'IT & Data Security',
    categoryDescription: 'Standard guidelines for IT & Data Security',
    title: 'Information Security Policy',
    description: 'Standard guidelines and rules for the Information Security Policy.',
    requiresAck: true,
    blocks: [
      { id: '1', type: 'heading', level: 1, content: '1. Overview' },
      { id: '2', type: 'paragraph', content: 'This is the standard Information Security Policy for KaaryaMitra employees.' }
    ]
  },
  {
    categoryName: 'IT & Data Security',
    categoryDescription: 'Standard guidelines for IT & Data Security',
    title: 'Data Privacy Policy',
    description: 'Standard guidelines and rules for the Data Privacy Policy.',
    requiresAck: true,
    blocks: [
      { id: '1', type: 'heading', level: 1, content: '1. Overview' },
      { id: '2', type: 'paragraph', content: 'This is the standard Data Privacy Policy for KaaryaMitra employees.' }
    ]
  },
  {
    categoryName: 'IT & Data Security',
    categoryDescription: 'Standard guidelines for IT & Data Security',
    title: 'Social Media Policy',
    description: 'Standard guidelines and rules for the Social Media Policy.',
    requiresAck: true,
    blocks: [
      { id: '1', type: 'heading', level: 1, content: '1. Overview' },
      { id: '2', type: 'paragraph', content: 'This is the standard Social Media Policy for KaaryaMitra employees.' }
    ]
  },
  {
    categoryName: 'IT & Data Security',
    categoryDescription: 'Standard guidelines for IT & Data Security',
    title: 'Asset Usage Policy',
    description: 'Standard guidelines and rules for the Asset Usage Policy.',
    requiresAck: true,
    blocks: [
      { id: '1', type: 'heading', level: 1, content: '1. Overview' },
      { id: '2', type: 'paragraph', content: 'This is the standard Asset Usage Policy for KaaryaMitra employees.' }
    ]
  },
  {
    categoryName: 'Performance & Appraisals',
    categoryDescription: 'Standard guidelines for Performance & Appraisals',
    title: 'Performance Management Policy',
    description: 'Standard guidelines and rules for the Performance Management Policy.',
    requiresAck: true,
    blocks: [
      { id: '1', type: 'heading', level: 1, content: '1. Overview' },
      { id: '2', type: 'paragraph', content: 'This is the standard Performance Management Policy for KaaryaMitra employees.' }
    ]
  },
  {
    categoryName: 'Performance & Appraisals',
    categoryDescription: 'Standard guidelines for Performance & Appraisals',
    title: 'Promotion Policy',
    description: 'Standard guidelines and rules for the Promotion Policy.',
    requiresAck: true,
    blocks: [
      { id: '1', type: 'heading', level: 1, content: '1. Overview' },
      { id: '2', type: 'paragraph', content: 'This is the standard Promotion Policy for KaaryaMitra employees.' }
    ]
  },
  {
    categoryName: 'Compensation & Benefits',
    categoryDescription: 'Standard guidelines for Compensation & Benefits',
    title: 'Compensation and Benefits Policy',
    description: 'Standard guidelines and rules for the Compensation and Benefits Policy.',
    requiresAck: true,
    blocks: [
      { id: '1', type: 'heading', level: 1, content: '1. Overview' },
      { id: '2', type: 'paragraph', content: 'This is the standard Compensation and Benefits Policy for KaaryaMitra employees.' }
    ]
  },
  {
    categoryName: 'Compensation & Benefits',
    categoryDescription: 'Standard guidelines for Compensation & Benefits',
    title: 'Travel and Expense Policy',
    description: 'Standard guidelines and rules for the Travel and Expense Policy.',
    requiresAck: true,
    blocks: [
      { id: '1', type: 'heading', level: 1, content: '1. Overview' },
      { id: '2', type: 'paragraph', content: 'This is the standard Travel and Expense Policy for KaaryaMitra employees.' }
    ]
  },
  {
    categoryName: 'Employee Relations',
    categoryDescription: 'Standard guidelines for Employee Relations',
    title: 'Grievance Policy',
    description: 'Standard guidelines and rules for the Grievance Policy.',
    requiresAck: true,
    blocks: [
      { id: '1', type: 'heading', level: 1, content: '1. Overview' },
      { id: '2', type: 'paragraph', content: 'This is the standard Grievance Policy for KaaryaMitra employees.' }
    ]
  },
  {
    categoryName: 'Employee Relations',
    categoryDescription: 'Standard guidelines for Employee Relations',
    title: 'Disciplinary Policy',
    description: 'Standard guidelines and rules for the Disciplinary Policy.',
    requiresAck: true,
    blocks: [
      { id: '1', type: 'heading', level: 1, content: '1. Overview' },
      { id: '2', type: 'paragraph', content: 'This is the standard Disciplinary Policy for KaaryaMitra employees.' }
    ]
  },
  {
    categoryName: 'Employee Relations',
    categoryDescription: 'Standard guidelines for Employee Relations',
    title: 'Whistleblower Policy',
    description: 'Standard guidelines and rules for the Whistleblower Policy.',
    requiresAck: true,
    blocks: [
      { id: '1', type: 'heading', level: 1, content: '1. Overview' },
      { id: '2', type: 'paragraph', content: 'This is the standard Whistleblower Policy for KaaryaMitra employees.' }
    ]
  },
  {
    categoryName: 'Health & Safety',
    categoryDescription: 'Standard guidelines for Health & Safety',
    title: 'Health and Safety Policy',
    description: 'Standard guidelines and rules for the Health and Safety Policy.',
    requiresAck: true,
    blocks: [
      { id: '1', type: 'heading', level: 1, content: '1. Overview' },
      { id: '2', type: 'paragraph', content: 'This is the standard Health and Safety Policy for KaaryaMitra employees.' }
    ]
  },
  {
    categoryName: 'Onboarding & Offboarding',
    categoryDescription: 'Standard guidelines for Onboarding & Offboarding',
    title: 'Probation Policy',
    description: 'Standard guidelines and rules for the Probation Policy.',
    requiresAck: true,
    blocks: [
      { id: '1', type: 'heading', level: 1, content: '1. Overview' },
      { id: '2', type: 'paragraph', content: 'This is the standard Probation Policy for KaaryaMitra employees.' }
    ]
  },
  {
    categoryName: 'Onboarding & Offboarding',
    categoryDescription: 'Standard guidelines for Onboarding & Offboarding',
    title: 'Employee Separation / Exit Policy',
    description: 'Standard guidelines and rules for the Employee Separation / Exit Policy.',
    requiresAck: true,
    blocks: [
      { id: '1', type: 'heading', level: 1, content: '1. Overview' },
      { id: '2', type: 'paragraph', content: 'This is the standard Employee Separation / Exit Policy for KaaryaMitra employees.' }
    ]
  },
  {
    categoryName: 'General',
    categoryDescription: 'Standard guidelines for General',
    title: 'General Employee Handbook',
    description: 'Standard guidelines and rules for the General Employee Handbook.',
    requiresAck: true,
    blocks: [
      { id: '1', type: 'heading', level: 1, content: '1. Overview' },
      { id: '2', type: 'paragraph', content: 'This is the standard General Employee Handbook for KaaryaMitra employees.' }
    ]
  },
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

  static async submitForReview(tenantId: string, policyId: string, versionId: string) {
    const version = await prisma.policyVersion.findFirst({ where: { id: versionId, policyId, tenantId } });
    if (!version) throw AppError.notFound('Policy version');
    if (version.status !== 'DRAFT') throw AppError.badRequest('Can only submit DRAFT versions for review');

    return prisma.policyVersion.update({
      where: { id: versionId },
      data: { status: 'PENDING_REVIEW' }
    });
  }

  static async publishVersion(tenantId: string, policyId: string, versionId: string, userId: string) {
    const policy = await prisma.policy.findFirst({ where: { id: policyId, tenantId } });
    if (!policy) throw AppError.notFound('Policy');

    const version = await prisma.policyVersion.findFirst({ where: { id: versionId, policyId, tenantId } });
    if (!version) throw AppError.notFound('Policy version');
    if (version.status !== 'DRAFT' && version.status !== 'PENDING_REVIEW') throw AppError.badRequest('Can only publish DRAFT or PENDING_REVIEW versions');

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


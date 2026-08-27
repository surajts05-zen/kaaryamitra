import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import type { WorkflowStepDef } from './workflow.schema.js';
import type { z } from 'zod';
import type { CreateWorkflowTemplateSchema, UpdateWorkflowTemplateSchema } from './workflow.schema.js';
import { createNotification } from '../notifications/notification.service.js';

// ─── Template Management ───────────────────────────────────────────────────────

export async function listWorkflowTemplates(tenantId: string) {
  return prisma.workflowTemplate.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getWorkflowTemplate(tenantId: string, id: string) {
  const template = await prisma.workflowTemplate.findFirst({ where: { id, tenantId } });
  if (!template) throw AppError.notFound('Workflow template');
  return template;
}

export async function getTemplateByTrigger(tenantId: string, triggerType: string) {
  return prisma.workflowTemplate.findUnique({
    where: {
      tenantId_triggerType: {
        tenantId,
        triggerType: triggerType as any,
      },
    },
  });
}

export async function createWorkflowTemplate(
  tenantId: string,
  data: z.infer<typeof CreateWorkflowTemplateSchema>,
) {
  // Ensure no duplicate triggerType for this tenant
  const existing = await prisma.workflowTemplate.findUnique({
    where: {
      tenantId_triggerType: {
        tenantId,
        triggerType: data.triggerType as any,
      },
    },
  });

  if (existing) {
    throw AppError.badRequest(
      `A workflow for trigger type "${data.triggerType}" already exists. Please edit the existing one or disable it first.`,
    );
  }

  return prisma.workflowTemplate.create({
    data: {
      tenantId,
      name: data.name,
      description: data.description ?? null,
      triggerType: data.triggerType as any,
      entityType: triggerTypeToEntityType(data.triggerType),
      steps: data.steps,
      isActive: true,
    },
  });
}

export async function updateWorkflowTemplate(
  tenantId: string,
  id: string,
  data: z.infer<typeof UpdateWorkflowTemplateSchema>,
) {
  const existing = await prisma.workflowTemplate.findFirst({ where: { id, tenantId } });
  if (!existing) throw AppError.notFound('Workflow template');

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.steps !== undefined) updateData.steps = data.steps;

  return prisma.workflowTemplate.update({
    where: { id },
    data: updateData,
  });
}

// ─── Workflow Engine — Execution ───────────────────────────────────────────────

/**
 * Start a new workflow instance for a given trigger + target entity.
 * Returns null if no active workflow is configured for the trigger.
 */
export async function startWorkflow(
  tenantId: string,
  triggerType: string,
  entityType: string,
  entityId: string,
): Promise<string | null> {
  const template = await getTemplateByTrigger(tenantId, triggerType);
  if (!template || !template.isActive) return null;

  const instance = await prisma.workflowInstance.create({
    data: {
      tenantId,
      templateId: template.id,
      entityType,
      entityId,
      status: 'IN_PROGRESS',
      currentStepIndex: 0,
    },
  });

  return instance.id;
}

/**
 * Get the current pending step for an instance.
 */
export async function getCurrentStep(instanceId: string): Promise<WorkflowStepDef | null> {
  const instance = await prisma.workflowInstance.findUnique({
    where: { id: instanceId },
    include: { template: true },
  });

  if (!instance || instance.status !== 'IN_PROGRESS') return null;

  const steps = instance.template.steps as WorkflowStepDef[];
  return steps[instance.currentStepIndex] ?? null;
}

/**
 * Check whether a specific user is authorized to action the given workflow step.
 */
export async function isUserStepApprover(
  step: WorkflowStepDef,
  employeeId: string,
  userId: string,
  tenantId: string,
): Promise<boolean> {
  if (step.assigneeType === 'SPECIFIC_USER') {
    return step.assigneeId === userId;
  }

  if (step.assigneeType === 'ROLE') {
    if (!step.assigneeId) return false;
    const userRole = await prisma.userRole.findFirst({
      where: {
        userId,
        roleId: step.assigneeId,
      },
    });
    return userRole !== null;
  }

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      manager: true,
      department: { include: { head: true } },
    },
  });

  if (!employee) return false;

  if (step.assigneeType === 'MANAGER') {
    return employee.manager?.userId === userId;
  }

  if (step.assigneeType === 'DEPARTMENT_HEAD') {
    return employee.department?.head?.userId === userId;
  }

  if (step.assigneeType === 'HR') {
    const hrRole = await prisma.userRole.findFirst({
      where: {
        userId,
        role: {
          tenantId,
          name: { in: ['HR Manager', 'Company Admin'] },
        },
      },
    });
    return hrRole !== null;
  }

  return false;
}


/**
 * Process an action (APPROVED / REJECTED) on the current step.
 * Returns the updated instance.
 */
export async function processWorkflowAction(
  tenantId: string,
  instanceId: string,
  actorUserId: string,
  action: 'APPROVED' | 'REJECTED',
  comment?: string,
) {
  const instance = await prisma.workflowInstance.findUnique({
    where: { id: instanceId },
    include: { template: true },
  });

  if (!instance) throw AppError.notFound('Workflow instance');
  if (instance.tenantId !== tenantId) throw AppError.forbidden('Access denied');
  if (instance.status !== 'IN_PROGRESS') {
    throw AppError.badRequest(`Workflow is already ${instance.status}`);
  }

  const steps = instance.template.steps as WorkflowStepDef[];

  // Record the action
  await prisma.workflowAction.create({
    data: {
      instanceId,
      stepIndex: instance.currentStepIndex,
      actorId: actorUserId,
      action: action.toLowerCase(),
      comment: comment ?? null,
    },
  });

  if (action === 'REJECTED') {
    // Reject terminates the entire workflow
    const rejected = await prisma.workflowInstance.update({
      where: { id: instanceId },
      data: { status: 'REJECTED', completedAt: new Date() },
    });

    // Notify initiating employee
    if (instance.leaveApplicationId) {
      const app = await prisma.leaveApplication.findUnique({
        where: { id: instance.leaveApplicationId },
        include: { employee: { include: { user: true } } },
      });
      if (app?.employee?.user) {
        const tenantSlug = (await prisma.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } }))?.slug;
        createNotification({
          tenantId,
          userId: app.employee.user.id,
          type: 'workflow.rejected',
          title: 'Your request has been Rejected ❌',
          body: `Your leave request was rejected${comment ? `: "${comment}"` : '.'}`,
          link: tenantSlug ? `/t/${tenantSlug}/me/leave` : undefined,
          email: app.employee.user.email,
        }).catch(() => {});
      }
    } else if (instance.attendanceCorrectionId) {
      const correction = await prisma.attendanceCorrection.update({
        where: { id: instance.attendanceCorrectionId },
        data: { status: 'REJECTED' },
        include: { record: { include: { employee: { include: { user: true } } } } }
      });
      if (correction?.record?.employee?.user) {
        const tenantSlug = (await prisma.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } }))?.slug;
        createNotification({
          tenantId,
          userId: correction.record.employee.user.id,
          type: 'workflow.rejected',
          title: 'Attendance Correction Rejected ❌',
          body: `Your attendance regularization request was rejected${comment ? `: "${comment}"` : '.'}`,
          link: tenantSlug ? `/t/${tenantSlug}/me/attendance` : undefined,
          email: correction.record.employee.user.email,
        }).catch(() => {});
      }
    }

    return rejected;
  }

  // APPROVED — advance to next step
  const nextStepIndex = instance.currentStepIndex + 1;
  const isComplete = nextStepIndex >= steps.length;

  const updated = await prisma.workflowInstance.update({
    where: { id: instanceId },
    data: {
      currentStepIndex: isComplete ? instance.currentStepIndex : nextStepIndex,
      status: isComplete ? 'COMPLETED' : 'IN_PROGRESS',
      completedAt: isComplete ? new Date() : null,
    },
  });

  const tenantSlug = (await prisma.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } }))?.slug;

  if (isComplete && instance.leaveApplicationId) {
    // Notify employee that their request completed
    const app = await prisma.leaveApplication.findUnique({
      where: { id: instance.leaveApplicationId },
      include: { employee: { include: { user: true } } },
    });
    if (app?.employee?.user) {
      createNotification({
        tenantId,
        userId: app.employee.user.id,
        type: 'workflow.completed',
        title: 'Your Leave Request is Approved ✅',
        body: 'All approval steps have been completed. Your leave is confirmed.',
        link: tenantSlug ? `/t/${tenantSlug}/me/leave` : undefined,
        email: app.employee.user.email,
      }).catch(() => {});
    }
  } else if (isComplete && instance.attendanceCorrectionId) {
    const correction = await prisma.attendanceCorrection.update({
      where: { id: instance.attendanceCorrectionId },
      data: { status: 'APPROVED' },
      include: { record: { include: { employee: { include: { user: true } } } } }
    });
    
    // Apply the correction to the AttendanceRecord
    const updateData: any = {};
    if (correction.requestedCheckIn) updateData.punchInTime = correction.requestedCheckIn;
    if (correction.requestedCheckOut) updateData.punchOutTime = correction.requestedCheckOut;
    
    // Recalculate total minutes if both exist
    const finalIn = correction.requestedCheckIn || correction.record.punchInTime;
    const finalOut = correction.requestedCheckOut || correction.record.punchOutTime;
    if (finalIn && finalOut) {
      updateData.totalMinutes = Math.floor((finalOut.getTime() - finalIn.getTime()) / 60000) - correction.record.totalBreakMinutes;
    }

    updateData.status = 'PRESENT';

    await prisma.attendanceRecord.update({
      where: { id: correction.attendanceRecordId },
      data: updateData
    });

    if (correction?.record?.employee?.user) {
      createNotification({
        tenantId,
        userId: correction.record.employee.user.id,
        type: 'workflow.completed',
        title: 'Attendance Correction Approved ✅',
        body: 'Your attendance regularization request has been approved.',
        link: tenantSlug ? `/t/${tenantSlug}/me/attendance` : undefined,
        email: correction.record.employee.user.email,
      }).catch(() => {});
    }
  }

  return updated;
}

/**
 * Get all workflow instances where the given user is the current approver.
 */
export async function getPendingActionsForUser(tenantId: string, userId: string) {
  const instances = await prisma.workflowInstance.findMany({
    where: {
      tenantId,
      status: 'IN_PROGRESS',
    },
    include: {
      template: true,
      leaveApplication: {
        include: {
          employee: { include: { user: true, department: true, designation: true } },
          leaveType: true,
        },
      },
      attendanceCorrection: {
        include: {
          record: {
            include: {
              employee: { include: { user: true, department: true, designation: true } },
            },
          },
        },
      },
    },
  });

  // Filter to only the ones where this user is the current approver
  const pending = [];
  for (const instance of instances) {
    const steps = instance.template.steps as WorkflowStepDef[];
    const currentStep = steps[instance.currentStepIndex];
    if (!currentStep) continue;

    const employeeId = instance.leaveApplication?.employeeId || instance.attendanceCorrection?.record.employeeId;
    if (!employeeId) continue;

    const isApprover = await isUserStepApprover(
      currentStep,
      employeeId,
      userId,
      tenantId,
    );

    if (isApprover) {
      pending.push({ instance, currentStep });
    }
  }

  return pending;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function triggerTypeToEntityType(triggerType: string): string {
  const map: Record<string, string> = {
    LEAVE_REQUEST: 'LeaveApplication',
    EXPENSE_REQUEST: 'ExpenseRequest',
    OFFBOARDING_REQUEST: 'OffboardingRequest',
    DOCUMENT_REQUEST: 'DocumentRequest',
    CUSTOM: 'Custom',
  };
  return map[triggerType] ?? 'Custom';
}

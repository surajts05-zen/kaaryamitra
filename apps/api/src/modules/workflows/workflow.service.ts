import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import type { WorkflowStepDef } from './workflow.schema.js';
import type { z } from 'zod';
import type { CreateWorkflowTemplateSchema, UpdateWorkflowTemplateSchema } from './workflow.schema.js';

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
 * Get the actor userId for the current step given the entity context.
 * For MANAGER → fetch employee's manager
 * For DEPARTMENT_HEAD → fetch department head
 * For HR → caller must provide the HR admin's userId
 * For SPECIFIC_USER → return the assigneeId directly
 */
export async function resolveStepActor(
  step: WorkflowStepDef,
  employeeId: string,
): Promise<string | null> {
  if (step.assigneeType === 'SPECIFIC_USER' || step.assigneeType === 'ROLE') {
    return step.assigneeId ?? null;
  }

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      manager: { include: { user: true } },
      department: { include: { head: { include: { user: true } } } },
    },
  });

  if (!employee) return null;

  if (step.assigneeType === 'MANAGER') {
    return employee.manager?.user?.id ?? null;
  }

  if (step.assigneeType === 'DEPARTMENT_HEAD') {
    return employee.department?.head?.user?.id ?? null;
  }

  return null;
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
    return prisma.workflowInstance.update({
      where: { id: instanceId },
      data: {
        status: 'REJECTED',
        completedAt: new Date(),
      },
    });
  }

  // APPROVED — advance to next step
  const nextStepIndex = instance.currentStepIndex + 1;
  const isComplete = nextStepIndex >= steps.length;

  return prisma.workflowInstance.update({
    where: { id: instanceId },
    data: {
      currentStepIndex: isComplete ? instance.currentStepIndex : nextStepIndex,
      status: isComplete ? 'COMPLETED' : 'IN_PROGRESS',
      completedAt: isComplete ? new Date() : null,
    },
  });
}

/**
 * Get all workflow instances where the given user is the current approver.
 */
export async function getPendingActionsForUser(tenantId: string, userId: string) {
  const instances = await prisma.workflowInstance.findMany({
    where: {
      tenantId,
      status: 'IN_PROGRESS',
      leaveApplicationId: { not: null },
    },
    include: {
      template: true,
      leaveApplication: {
        include: {
          employee: { include: { user: true, department: true, designation: true } },
          leaveType: true,
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

    if (!instance.leaveApplication) continue;

    const actorId = await resolveStepActor(currentStep, instance.leaveApplication.employeeId);
    if (actorId === userId) {
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

import type { Request, Response } from 'express';
import { AppError } from '../../lib/errors.js';
import {
  CreateWorkflowTemplateSchema,
  UpdateWorkflowTemplateSchema,
  WorkflowActionSchema,
} from './workflow.schema.js';
import {
  listWorkflowTemplates,
  getWorkflowTemplate,
  createWorkflowTemplate,
  updateWorkflowTemplate,
  getPendingActionsForUser,
  processWorkflowAction,
} from './workflow.service.js';
import { prisma } from '../../lib/prisma.js';

// ─── Admin: Workflow Template CRUD ────────────────────────────────────────────

export async function listWorkflowTemplatesHandler(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  const templates = await listWorkflowTemplates(tenantId);
  res.json({ data: templates });
}

export async function getWorkflowTemplateHandler(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  const { id } = req.params;
  const template = await getWorkflowTemplate(tenantId, id!);
  res.json({ data: template });
}

export async function createWorkflowTemplateHandler(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  const data = CreateWorkflowTemplateSchema.parse(req.body);
  const template = await createWorkflowTemplate(tenantId, data);
  res.status(201).json({ data: template, message: 'Workflow created successfully' });
}

export async function updateWorkflowTemplateHandler(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  const { id } = req.params;
  const data = UpdateWorkflowTemplateSchema.parse(req.body);
  const template = await updateWorkflowTemplate(tenantId, id!, data);
  res.json({ data: template, message: 'Workflow updated successfully' });
}

// ─── Approvals Inbox ──────────────────────────────────────────────────────────

export async function listMyPendingApprovalsHandler(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  const userId = req.auth!.userId;

  const pending = await getPendingActionsForUser(tenantId, userId);
  res.json({ data: pending });
}

export async function processWorkflowActionHandler(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  const userId = req.auth!.userId;
  const { instanceId } = req.params;
  const { action, comment } = WorkflowActionSchema.parse(req.body);

  if (!instanceId) throw new AppError(400, 'VALIDATION_ERROR', 'instanceId is required');

  // Security: Verify this user is the current approver
  const instance = await prisma.workflowInstance.findFirst({
    where: { id: instanceId, tenantId },
    include: {
      template: true,
      leaveApplication: true,
    },
  });

  if (!instance) throw AppError.notFound('Workflow instance');

  const updated = await processWorkflowAction(tenantId, instanceId, userId, action, comment);

  // If the workflow is now complete or rejected, sync the LeaveApplication status
  if (instance.leaveApplicationId) {
    let leaveStatus: 'APPROVED' | 'REJECTED' | null = null;
    if (updated.status === 'COMPLETED') leaveStatus = 'APPROVED';
    if (updated.status === 'REJECTED') leaveStatus = 'REJECTED';

    if (leaveStatus) {
      const leaveApp = await prisma.leaveApplication.findUnique({
        where: { id: instance.leaveApplicationId },
      });

      if (leaveApp) {
        await prisma.leaveApplication.update({
          where: { id: instance.leaveApplicationId },
          data: {
            status: leaveStatus,
            managerNote: comment ?? null,
          },
        });

        // If rejected, restore the leave balance
        if (leaveStatus === 'REJECTED') {
          const currentYear = new Date(leaveApp.startDate).getFullYear();
          const balance = await prisma.leaveBalance.findUnique({
            where: {
              tenantId_employeeId_leaveTypeId_year: {
                tenantId,
                employeeId: leaveApp.employeeId,
                leaveTypeId: leaveApp.leaveTypeId,
                year: currentYear,
              },
            },
          });

          if (balance) {
            await prisma.leaveBalance.update({
              where: { id: balance.id },
              data: { available: balance.available + leaveApp.totalDays },
            });
          }
        }

        // If approved, record used balance
        if (leaveStatus === 'APPROVED') {
          const currentYear = new Date(leaveApp.startDate).getFullYear();
          const balance = await prisma.leaveBalance.findUnique({
            where: {
              tenantId_employeeId_leaveTypeId_year: {
                tenantId,
                employeeId: leaveApp.employeeId,
                leaveTypeId: leaveApp.leaveTypeId,
                year: currentYear,
              },
            },
          });

          if (balance) {
            await prisma.leaveBalance.update({
              where: { id: balance.id },
              data: { used: balance.used + leaveApp.totalDays },
            });
          }
        }
      }
    }
  }

  res.json({
    data: updated,
    message: action === 'APPROVED' ? 'Application approved' : 'Application rejected',
  });
}

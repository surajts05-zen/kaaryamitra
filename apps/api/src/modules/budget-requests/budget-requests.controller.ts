import type { Request, Response } from 'express';
import { BudgetRequestsService } from './budget-requests.service.js';
import { budgetRequestSchema, updateBudgetRequestSchema } from './budget-requests.schema.js';
import { processWorkflowAction } from '../workflows/workflow.service.js';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';

export async function listHandler(req: Request, res: Response) {
  const data = await BudgetRequestsService.list(req.tenantId!);
  res.status(200).json({ success: true, data });
}

export async function getHandler(req: Request, res: Response) {
  const data = await BudgetRequestsService.getById(req.tenantId!, req.params.id as string);
  res.status(200).json({ success: true, data });
}

export async function createHandler(req: Request, res: Response) {
  const body = budgetRequestSchema.parse(req.body);
  
  const employee = await prisma.employee.findUnique({ where: { userId: req.auth!.userId } });
  if (!employee) throw AppError.notFound('Employee profile not found');
  
  const data = await BudgetRequestsService.create(req.tenantId!, employee.id, body);
  res.status(201).json({ success: true, data });
}

export async function updateHandler(req: Request, res: Response) {
  const body = updateBudgetRequestSchema.parse(req.body);
  const data = await BudgetRequestsService.update(req.tenantId!, req.params.id as string, req.auth!.userId, body);
  res.status(200).json({ success: true, data });
}

export async function submitHandler(req: Request, res: Response) {
  const data = await BudgetRequestsService.submit(req.tenantId!, req.params.id as string, req.auth!.userId);
  res.status(200).json({ success: true, data });
}

export async function approveHandler(req: Request, res: Response) {
  const { id } = req.params;
  const { comment } = req.body;
  
  const reqInfo = await BudgetRequestsService.getById(req.tenantId!, id as string);
  if (!reqInfo.workflowInstance) {
    throw AppError.badRequest('No workflow instance found for this request');
  }

  await processWorkflowAction(
    req.tenantId!,
    reqInfo.workflowInstance.id,
    req.auth!.userId,
    'APPROVED',
    typeof comment === 'string' ? comment : undefined
  );
  
  res.status(200).json({ success: true, message: 'Request approved successfully' });
}

export async function rejectHandler(req: Request, res: Response) {
  const { id } = req.params;
  const { comment } = req.body;
  
  const reqInfo = await BudgetRequestsService.getById(req.tenantId!, id as string);
  if (!reqInfo.workflowInstance) {
    throw AppError.badRequest('No workflow instance found for this request');
  }

  await processWorkflowAction(
    req.tenantId!,
    reqInfo.workflowInstance.id,
    req.auth!.userId,
    'REJECTED',
    typeof comment === 'string' ? comment : undefined
  );
  
  res.status(200).json({ success: true, message: 'Request rejected successfully' });
}

export async function recallHandler(req: Request, res: Response) {
  const data = await BudgetRequestsService.recall(req.tenantId!, req.params.id as string);
  res.status(200).json({ success: true, message: 'Request recalled to draft', data });
}

export async function returnHandler(req: Request, res: Response) {
  const { id } = req.params;
  const { comment } = req.body;
  
  const reqInfo = await BudgetRequestsService.getById(req.tenantId!, id as string);
  if (reqInfo.workflowInstance) {
    await processWorkflowAction(
      req.tenantId!,
      reqInfo.workflowInstance.id,
      req.auth!.userId,
      'RETURNED',
      typeof comment === 'string' ? comment : undefined
    );
  } else {
    await BudgetRequestsService.returnForRevision(
      req.tenantId!,
      id as string,
      req.auth!.userId,
      typeof comment === 'string' ? comment : undefined
    );
  }
  
  res.status(200).json({ success: true, message: 'Request sent back for revision successfully' });
}

export async function archiveHandler(req: Request, res: Response) {
  const data = await BudgetRequestsService.archive(req.tenantId!, req.params.id as string);
  res.status(200).json({ success: true, data });
}

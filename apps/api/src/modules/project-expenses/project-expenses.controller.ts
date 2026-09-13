import type { Request, Response } from 'express';
import { ProjectExpensesService } from './project-expenses.service.js';
import { projectExpenseSchema } from './project-expenses.schema.js';

import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';

export async function listHandler(req: Request, res: Response) {
  const data = await ProjectExpensesService.list(req.tenantId!, req.query);
  res.status(200).json({ success: true, data });
}

export async function getHandler(req: Request, res: Response) {
  const data = await ProjectExpensesService.getById(req.tenantId!, req.params.id as string);
  res.status(200).json({ success: true, data });
}

export async function submitHandler(req: Request, res: Response) {
  const body = projectExpenseSchema.parse(req.body);

  const employee = await prisma.employee.findUnique({ where: { userId: req.auth!.userId } });
  if (!employee) throw AppError.notFound('Employee profile not found');

  const data = await ProjectExpensesService.submit(req.tenantId!, employee.id, body);
  res.status(201).json({ success: true, data });
}

export async function approveHandler(req: Request, res: Response) {
  const data = await ProjectExpensesService.approve(req.tenantId!, req.params.id as string, req.auth!.userId);
  res.status(200).json({ success: true, data });
}

export async function rejectHandler(req: Request, res: Response) {
  const data = await ProjectExpensesService.reject(req.tenantId!, req.params.id as string);
  res.status(200).json({ success: true, data });
}

import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import { startWorkflow } from '../workflows/workflow.service.js';

export async function requestSwapHandler(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  const userId = req.auth!.userId;

  const employee = await prisma.employee.findUnique({ where: { userId } });
  if (!employee) throw AppError.notFound('Employee profile not found');

  const schema = z.object({
    targetEmployeeId: z.string(),
    date: z.string(),
    reason: z.string().optional()
  });

  const { targetEmployeeId, date, reason } = schema.parse(req.body);

  const swap = await prisma.shiftSwapRequest.create({
    data: {
      tenantId,
      requestingEmployeeId: employee.id,
      targetEmployeeId,
      date: new Date(date),
      reason: reason || null,
      status: 'PENDING'
    }
  });

  // Trigger SHIFT_SWAP_REQUEST workflow
  const workflowId = await startWorkflow(tenantId, 'SHIFT_SWAP_REQUEST', 'ShiftSwapRequest', swap.id);
  // trigger handles update

  res.status(201).json({ success: true, data: swap });
}

export async function getSwapRequestsHandler(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  const userId = req.auth!.userId;

  const employee = await prisma.employee.findUnique({ where: { userId } });
  if (!employee) throw AppError.notFound('Employee profile not found');

  const requests = await prisma.shiftSwapRequest.findMany({
    where: {
      tenantId,
      OR: [
        { requestingEmployeeId: employee.id },
        { targetEmployeeId: employee.id }
      ]
    },
    include: {
      requestingEmployee: { include: { user: true } },
      targetEmployee: { include: { user: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({ success: true, data: requests });
}

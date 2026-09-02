import { Request, Response } from 'express';
import { ResignationsService } from './resignations.service.js';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';

export const submitResignationHandler = async (req: Request, res: Response) => {
  const tenantId = req.tenantId!;
  
  const employee = await prisma.employee.findUnique({
    where: { userId: req.auth!.userId }
  });
  if (!employee) throw AppError.notFound('Employee');
  const employeeId = employee.id;
  
  const resignation = await ResignationsService.submitResignation(tenantId, employeeId, req.body);
  res.json({ success: true, data: resignation });
};

export const getMyResignationHandler = async (req: Request, res: Response) => {
  const tenantId = req.tenantId!;
  const employee = await prisma.employee.findUnique({
    where: { userId: req.auth!.userId }
  });
  if (!employee) throw AppError.notFound('Employee');
  const employeeId = employee.id;
  
  const resignation = await ResignationsService.getMyResignation(tenantId, employeeId);
  res.json({ success: true, data: resignation });
};

export const listResignationsHandler = async (req: Request, res: Response) => {
  const tenantId = req.tenantId!;
  const resignations = await ResignationsService.listResignations(tenantId);
  res.json({ success: true, data: resignations });
};

export const updateResignationStatusHandler = async (req: Request, res: Response) => {
  const tenantId = req.tenantId!;
  const { id } = req.params as { id: string };
  const resignation = await ResignationsService.updateResignationStatus(tenantId, id, req.body);
  res.json({ success: true, data: resignation });
};

export const updateClearanceHandler = async (req: Request, res: Response) => {
  const tenantId = req.tenantId!;
  const { id } = req.params as { id: string };
  const { isClearanceCompleted } = req.body;
  const resignation = await ResignationsService.updateClearance(tenantId, id, isClearanceCompleted);
  res.json({ success: true, data: resignation });
};

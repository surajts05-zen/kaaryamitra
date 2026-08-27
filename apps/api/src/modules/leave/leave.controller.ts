import { Request, Response } from 'express';
import { 
  getLeaveTypes, 
  createLeaveType, 
  updateLeaveType,
  getMyLeaveBalances,
  getMyLeaveApplications,
  applyForLeave,
  getPendingApprovals,
  reviewLeaveApplication
} from './leave.service.js';
import { 
  CreateLeaveTypeSchema, 
  UpdateLeaveTypeSchema, 
  CreateLeaveApplicationSchema,
  ReviewLeaveApplicationSchema
} from './leave.schema.js';
import { AppError } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';

export async function listLeaveTypesHandler(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  const types = await getLeaveTypes(tenantId);
  res.json({ data: types });
}

export async function createLeaveTypeHandler(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  const data = CreateLeaveTypeSchema.parse(req.body);
  const leaveType = await createLeaveType(tenantId, data);
  res.status(201).json({ data: leaveType });
}

export async function updateLeaveTypeHandler(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  const id = req.params['id'] as string;
  const data = UpdateLeaveTypeSchema.parse(req.body);
  const leaveType = await updateLeaveType(tenantId, id, data);
  res.json({ data: leaveType });
}

export async function listMyLeaveBalancesHandler(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  const userId = req.auth!.userId;
  
  const employee = await prisma.employee.findUnique({ where: { userId } });
  if (!employee) throw new AppError(404, 'NOT_FOUND', 'Employee profile not found');

  const balances = await getMyLeaveBalances(tenantId, employee.id);
  res.json({ data: balances });
}

export async function listMyLeaveApplicationsHandler(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  const userId = req.auth!.userId;
  
  const employee = await prisma.employee.findUnique({ where: { userId } });
  if (!employee) throw new AppError(404, 'NOT_FOUND', 'Employee profile not found');

  const applications = await getMyLeaveApplications(tenantId, employee.id);
  res.json({ data: applications });
}

export async function applyLeaveHandler(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  const userId = req.auth!.userId;
  const data = CreateLeaveApplicationSchema.parse(req.body);
  
  const employee = await prisma.employee.findUnique({ where: { userId } });
  if (!employee) throw new AppError(404, 'NOT_FOUND', 'Employee profile not found');

  const application = await applyForLeave(tenantId, employee.id, data);
  res.status(201).json({ data: application, message: 'Leave application submitted successfully' });
}

export async function listPendingApprovalsHandler(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  const userId = req.auth!.userId;
  
  const employee = await prisma.employee.findUnique({ where: { userId } });
  if (!employee) throw new AppError(404, 'NOT_FOUND', 'Employee profile not found');

  const applications = await getPendingApprovals(tenantId, employee.id);
  res.json({ data: applications });
}

export async function reviewLeaveApplicationHandler(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  const userId = req.auth!.userId;
  const applicationId = req.params['id'] as string;
  const data = ReviewLeaveApplicationSchema.parse(req.body);
  
  const employee = await prisma.employee.findUnique({ where: { userId } });
  if (!employee) throw new AppError(404, 'NOT_FOUND', 'Employee profile not found');

  const application = await reviewLeaveApplication(tenantId, employee.id, applicationId, data);
  res.json({ data: application, message: `Leave application ${data.status.toLowerCase()}` });
}

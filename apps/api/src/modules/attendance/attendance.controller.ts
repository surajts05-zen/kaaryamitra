import type { Request, Response } from 'express';
import * as attendanceService from './attendance.service.js';
import type { z } from 'zod';
import { CheckInSchema, RegularizationSchema, StartBreakSchema } from './attendance.schema.js';
import { AppError } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';

async function getEmployeeId(tenantId: string, userId: string) {
  const employee = await prisma.employee.findUnique({
    where: { userId },
  });
  if (!employee || employee.tenantId !== tenantId) {
    throw AppError.forbidden('Must be an employee');
  }
  return employee.id;
}

function getAuthContext(req: Request) {
  if (!req.auth?.userId || !req.auth?.tenantId) {
    throw AppError.unauthorized('Authentication required');
  }
  return { tenantId: req.auth.tenantId, userId: req.auth.userId };
}

export async function checkInHandler(req: Request, res: Response) {
  const { tenantId, userId } = getAuthContext(req);
  const employeeId = await getEmployeeId(tenantId, userId);
  
  const { body } = CheckInSchema.parse({ body: req.body });
  const record = await attendanceService.checkIn(tenantId, employeeId, body);
  res.status(200).json({ success: true, data: record });
}

export async function checkOutHandler(req: Request, res: Response) {
  const { tenantId, userId } = getAuthContext(req);
  const employeeId = await getEmployeeId(tenantId, userId);
  
  const { body } = CheckInSchema.parse({ body: req.body });
  const record = await attendanceService.checkOut(tenantId, employeeId, body);
  res.status(200).json({ success: true, data: record });
}

export async function startBreakHandler(req: Request, res: Response) {
  const { tenantId, userId } = getAuthContext(req);
  const employeeId = await getEmployeeId(tenantId, userId);
  
  const { body } = StartBreakSchema.parse({ body: req.body });
  const breakRecord = await attendanceService.startBreak(tenantId, employeeId, body.type);
  res.status(200).json({ success: true, data: breakRecord });
}

export async function endBreakHandler(req: Request, res: Response) {
  const { tenantId, userId } = getAuthContext(req);
  const employeeId = await getEmployeeId(tenantId, userId);
  
  const breakRecord = await attendanceService.endBreak(tenantId, employeeId);
  res.status(200).json({ success: true, data: breakRecord });
}

export async function getMyAttendanceHandler(req: Request, res: Response) {
  const { tenantId, userId } = getAuthContext(req);
  const employeeId = await getEmployeeId(tenantId, userId);
  
  const dateStr = req.query['date'] as string | undefined;
  const records = await attendanceService.getMyAttendance(tenantId, employeeId, dateStr);
  res.status(200).json({ success: true, data: records });
}

export async function requestRegularizationHandler(req: Request, res: Response) {
  const { tenantId, userId } = getAuthContext(req);
  const employeeId = await getEmployeeId(tenantId, userId);
  
  const { body } = RegularizationSchema.parse({ body: req.body });
  const correction = await attendanceService.requestRegularization(tenantId, employeeId, userId, body);
  res.status(201).json({ success: true, data: correction });
}

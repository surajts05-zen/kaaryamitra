import type { Request, Response } from 'express';
import * as attendanceService from './attendance.service.js';
import { CheckInSchema, RegularizationSchema, StartBreakSchema } from './attendance.schema.js';
import { AppError } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function getEmployeeId(tenantId: string, userId: string) {
  const employee = await prisma.employee.findUnique({ where: { userId } });
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

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'] as string | undefined;
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? req.ip ?? '';
  return req.ip ?? req.socket?.remoteAddress ?? '';
}

// ─────────────────────────────────────────────────────────────────────────────
// ESS Handlers
// ─────────────────────────────────────────────────────────────────────────────

export async function checkInHandler(req: Request, res: Response) {
  const { tenantId, userId } = getAuthContext(req);
  const employeeId = await getEmployeeId(tenantId, userId);

  const { body } = CheckInSchema.parse({ body: req.body });

  const payload = {
    ...body,
    ipAddress: getClientIp(req),
  } as any;
  const record = await attendanceService.checkIn(tenantId, employeeId, payload);

  res.status(200).json({ success: true, data: record });
}

export async function checkOutHandler(req: Request, res: Response) {
  const { tenantId, userId } = getAuthContext(req);
  const employeeId = await getEmployeeId(tenantId, userId);

  const { body } = CheckInSchema.parse({ body: req.body });

  const payload = {
    ...body,
    ipAddress: getClientIp(req),
  } as any;
  const record = await attendanceService.checkOut(tenantId, employeeId, payload);

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
  const result = await attendanceService.getMyAttendance(tenantId, employeeId, dateStr);
  res.status(200).json({ success: true, data: result.records, stats: result.stats });
}

export async function getTodayStatusHandler(req: Request, res: Response) {
  const { tenantId, userId } = getAuthContext(req);
  const employeeId = await getEmployeeId(tenantId, userId);

  const result = await attendanceService.getTodayStatus(tenantId, employeeId);
  res.status(200).json({ success: true, data: result });
}

export async function requestRegularizationHandler(req: Request, res: Response) {
  const { tenantId, userId } = getAuthContext(req);
  const employeeId = await getEmployeeId(tenantId, userId);

  const { body } = RegularizationSchema.parse({ body: req.body });
  const correction = await attendanceService.requestRegularization(tenantId, employeeId, userId, body as any);
  res.status(201).json({ success: true, data: correction });
}

export async function bulkCreateAttendanceHandler(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  const { items } = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({ success: false, error: { message: 'Items must be an array' } });
  }
  const data = await attendanceService.bulkCreateAttendanceRecords(tenantId, items);
  res.status(201).json({ success: true, count: data.length, data });
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin Handlers
// ─────────────────────────────────────────────────────────────────────────────

export async function getAttendanceRecordsHandler(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  const { date, startDate, endDate, employeeId, status, isLate, page, pageSize } = req.query as any;

  const result = await attendanceService.getAttendanceRecords(tenantId, {
    date,
    startDate,
    endDate,
    employeeId,
    status,
    isLate: isLate === 'true' ? true : isLate === 'false' ? false : undefined,
    page: page ? parseInt(page) : undefined,
    pageSize: pageSize ? parseInt(pageSize) : undefined,
  } as any);

  res.status(200).json({ success: true, ...result });
}

export async function getTodayOverviewHandler(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  const result = await attendanceService.getTodayOverview(tenantId);
  res.status(200).json({ success: true, data: result });
}

export async function getPendingCorrectionsHandler(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  const corrections = await attendanceService.getPendingCorrections(tenantId);
  res.status(200).json({ success: true, data: corrections });
}

export async function approveCorrectionHandler(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  const id = req.params.id as string;
  const { comment } = req.body;
  const approverId = req.auth!.userId;

  const result = await attendanceService.approveCorrection(tenantId, id, approverId, comment);
  res.status(200).json({ success: true, data: result });
}

export async function rejectCorrectionHandler(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  const id = req.params.id as string;
  const { comment } = req.body;
  const rejectorId = req.auth!.userId;

  const result = await attendanceService.rejectCorrection(tenantId, id, rejectorId, comment);
  res.status(200).json({ success: true, data: result });
}

// ─────────────────────────────────────────────────────────────────────────────
// Trusted Networks Handlers
// ─────────────────────────────────────────────────────────────────────────────

export async function getTrustedNetworksHandler(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  const networks = await attendanceService.getTrustedNetworks(tenantId);
  res.status(200).json({ success: true, data: networks });
}

export async function createTrustedNetworkHandler(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  const { name, cidr, description } = req.body;
  if (!name || !cidr) {
    return res.status(400).json({ success: false, error: { message: 'name and cidr are required' } });
  }
  const network = await attendanceService.createTrustedNetwork(tenantId, { name, cidr, description });
  res.status(201).json({ success: true, data: network });
}

export async function updateTrustedNetworkHandler(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  const id = req.params.id as string;
  const network = await attendanceService.updateTrustedNetwork(tenantId, id, req.body);
  res.status(200).json({ success: true, data: network });
}

export async function deleteTrustedNetworkHandler(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  const id = req.params.id as string;
  await attendanceService.deleteTrustedNetwork(tenantId, id);
  res.status(204).send();
}

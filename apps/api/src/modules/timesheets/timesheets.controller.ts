import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import { startWorkflow } from '../workflows/workflow.service.js';

// ── Timesheet Generation & Management ─────────────────────────────────────────

export async function generateTimesheetHandler(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  const userId = req.auth!.userId;

  const schema = z.object({
    periodStartDate: z.string(), // ISO date
    periodEndDate: z.string()
  });

  const { periodStartDate, periodEndDate } = schema.parse(req.body);
  const start = new Date(periodStartDate);
  const end = new Date(periodEndDate);

  const employee = await prisma.employee.findUnique({ where: { userId } });
  if (!employee) throw AppError.notFound('Employee profile not found');

  // Check if timesheet already exists
  let timesheet = await prisma.timesheet.findUnique({
    where: {
      tenantId_employeeId_periodStartDate_periodEndDate: {
        tenantId,
        employeeId: employee.id,
        periodStartDate: start,
        periodEndDate: end
      }
    },
    include: { entries: true }
  });

  if (!timesheet) {
    // Generate from attendance records
    const attendances = await prisma.attendanceRecord.findMany({
      where: {
        tenantId,
        employeeId: employee.id,
        date: { gte: start, lte: end }
      }
    });

    // Create timesheet
    timesheet = await prisma.timesheet.create({
      data: {
        tenantId,
        employeeId: employee.id,
        periodStartDate: start,
        periodEndDate: end,
        status: 'DRAFT',
        entries: {
          create: attendances.map(a => ({
            date: a.date,
            hours: (a.totalMinutes || 0) / 60,
            overtimeHours: 0 // Will implement logic for this later
          }))
        }
      },
      include: { entries: true }
    });
  }

  res.status(201).json({ success: true, data: timesheet });
}

export async function getTimesheetHandler(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  const id = req.params['id'];

  const timesheet = await prisma.timesheet.findUnique({
    where: { id: id as string, tenantId },
    include: { entries: true }
  });

  if (!timesheet) throw AppError.notFound('Timesheet not found');

  res.json({ success: true, data: timesheet });
}

export async function submitTimesheetHandler(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  const id = req.params['id'];
  const userId = req.auth!.userId;

  const employee = await prisma.employee.findUnique({ where: { userId } });
  if (!employee) throw AppError.notFound('Employee profile not found');

  const timesheet = await prisma.timesheet.findUnique({
    where: { id: id as string, tenantId }
  });

  if (!timesheet || timesheet.employeeId !== employee.id) {
    throw AppError.forbidden('Cannot submit this timesheet');
  }

  const schema = z.object({
    entries: z.array(z.object({
      id: z.string(),
      hours: z.number().min(0),
      overtimeHours: z.number().min(0),
      description: z.string().optional()
    }))
  });

  const { entries } = schema.parse(req.body);

  // Update entries
  await prisma.$transaction(
    entries.map(e => prisma.timesheetEntry.update({
      where: { id: e.id },
      data: { hours: e.hours, overtimeHours: e.overtimeHours, description: e.description || null }
    }))
  );

  // Mark as submitted
  const updated = await prisma.timesheet.update({
    where: { id: id as string },
    data: { status: 'SUBMITTED', submittedAt: new Date() }
  });

  const workflowId = await startWorkflow(tenantId, 'TIMESHEET_APPROVAL', 'Timesheet', updated.id);
  // workflow creates its own instance

  res.json({ success: true, data: updated });
}

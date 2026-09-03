import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

// ── CRUD for Shift Templates ──────────────────────────────────────────────────

export async function createShiftHandler(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  
  const schema = z.object({
    name: z.string().min(1),
    startTime: z.string(),
    endTime: z.string(),
    type: z.enum(['FIXED', 'FLEXIBLE', 'ROTATING']).optional().default('FIXED'),
    gracePeriodMinutes: z.number().int().min(0).optional().default(15),
    color: z.string().optional()
  });

  const data = schema.parse(req.body);

  const shift = await prisma.shift.create({
    data: { tenantId, ...data, color: data.color || null }
  });

  res.status(201).json({ success: true, data: shift });
}

export async function getShiftsHandler(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  const shifts = await prisma.shift.findMany({ where: { tenantId } });
  res.json({ success: true, data: shifts });
}

export async function bulkCreateShiftsHandler(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  const { items } = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({ success: false, error: { message: 'Items must be an array' } });
  }
  
  const created: any[] = [];
  for (const item of items) {
    if (!item.name || !item.startTime || !item.endTime) continue;
    try {
      const shift = await prisma.shift.create({
        data: {
          tenantId,
          name: item.name.trim(),
          startTime: item.startTime.trim(),
          endTime: item.endTime.trim(),
          type: (item.type ? item.type.toUpperCase() : 'FIXED') as any,
          gracePeriodMinutes: item.gracePeriodMinutes ? parseInt(item.gracePeriodMinutes) || 15 : 15,
        }
      });
      created.push(shift);
    } catch (err) {
      console.error(`Failed to bulk create shift ${item.name}:`, err);
    }
  }
  
  res.status(201).json({ success: true, count: created.length, data: created });
}

export async function updateShiftHandler(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  const id = req.params['id'] as string;

  const schema = z.object({
    name: z.string().min(1).optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    type: z.enum(['FIXED', 'FLEXIBLE', 'ROTATING']).optional(),
    gracePeriodMinutes: z.number().int().min(0).optional(),
    color: z.string().optional(),
    isActive: z.boolean().optional()
  });

  const data = schema.parse(req.body);

  const updateData: any = { ...data };
  if (data.color === undefined) delete updateData.color;
  else if (data.color === null) updateData.color = null;

  const shift = await prisma.shift.update({
    where: { id, tenantId },
    data: updateData
  });

  res.json({ success: true, data: shift });
}

export async function deleteShiftHandler(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  const id = req.params['id'] as string;

  await prisma.shift.delete({
    where: { id, tenantId }
  });

  res.json({ success: true, data: null });
}

// ── Shift Assignment ─────────────────────────────────────────────────────────

export async function assignShiftHandler(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  const schema = z.object({
    employeeIds: z.array(z.string()).min(1),
    shiftId: z.string(),
    effectiveFrom: z.string(),
    effectiveTo: z.string().optional()
  });

  const { employeeIds, shiftId, effectiveFrom, effectiveTo } = schema.parse(req.body);

  const assignments = await Promise.all(employeeIds.map(employeeId => {
    return prisma.employeeShift.create({
      data: {
        tenantId,
        employeeId,
        shiftId,
        effectiveFrom: new Date(effectiveFrom),
        effectiveTo: effectiveTo ? new Date(effectiveTo) : null
      }
    });
  }));

  res.status(201).json({ success: true, data: assignments });
}

export async function getEmployeeShiftsHandler(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  const employeeId = req.params['employeeId'] as string;

  const shifts = await prisma.employeeShift.findMany({
    where: { tenantId, employeeId },
    include: { shift: true },
    orderBy: { effectiveFrom: 'desc' }
  });

  res.json({ success: true, data: shifts });
}

export async function getDailyScheduleHandler(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  const dateStr = req.query['date'] as string;
  
  if (!dateStr) {
    return res.status(400).json({ success: false, error: { message: 'Date is required' } });
  }

  const targetDate = new Date(dateStr);

  const schedules = await prisma.employeeShift.findMany({
    where: {
      tenantId,
      effectiveFrom: { lte: targetDate },
      OR: [
        { effectiveTo: null },
        { effectiveTo: { gte: targetDate } }
      ]
    },
    include: {
      shift: true,
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeCode: true
        }
      }
    }
  });

  res.json({ success: true, data: schedules });
}

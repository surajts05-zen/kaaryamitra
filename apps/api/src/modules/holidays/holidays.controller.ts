import { Request, Response } from 'express';
import { HolidaysService, createHolidaySchema, updateHolidaySchema } from './holidays.service.js';

export const listHolidaysHandler = async (req: Request, res: Response) => {
  const tenantId = req.tenantId!;
  const holidays = await HolidaysService.listHolidays(tenantId);
  res.json({ success: true, data: holidays });
};

export const createHolidayHandler = async (req: Request, res: Response) => {
  const tenantId = req.tenantId!;
  const parsed = createHolidaySchema.parse(req.body);
  const holiday = await HolidaysService.createHoliday(tenantId, parsed);
  res.status(201).json({ success: true, data: holiday });
};

export const updateHolidayHandler = async (req: Request, res: Response) => {
  const tenantId = req.tenantId!;
  const id = req.params['id'] as string;
  const parsed = updateHolidaySchema.parse(req.body);
  const holiday = await HolidaysService.updateHoliday(tenantId, id, parsed);
  res.json({ success: true, data: holiday });
};

export const deleteHolidayHandler = async (req: Request, res: Response) => {
  const tenantId = req.tenantId!;
  const id = req.params['id'] as string;
  await HolidaysService.deleteHoliday(tenantId, id);
  res.json({ success: true });
};

export const bulkCreateHolidaysHandler = async (req: Request, res: Response) => {
  const tenantId = req.tenantId!;
  const { items } = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({ success: false, error: { message: 'Items must be an array' } });
  }
  const created = await HolidaysService.bulkCreateHolidays(tenantId, items);
  res.json({ success: true, count: created.length, data: created });
};

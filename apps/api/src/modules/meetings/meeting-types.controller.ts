import type { Request, Response } from 'express';
import { MeetingTypesService } from './meeting-types.service.js';
import { z } from 'zod';

const meetingTypeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  isActive: z.boolean().default(true)
});

export async function listHandler(req: Request, res: Response) {
  const data = await MeetingTypesService.list(req.tenantId!);
  res.status(200).json({ success: true, data });
}

export async function createHandler(req: Request, res: Response) {
  const body = meetingTypeSchema.parse(req.body);
  const data = await MeetingTypesService.create(req.tenantId!, body);
  res.status(201).json({ success: true, data });
}

export async function updateHandler(req: Request, res: Response) {
  const body = meetingTypeSchema.partial().parse(req.body);
  const data = await MeetingTypesService.update(req.tenantId!, req.params.id as string, body);
  res.status(200).json({ success: true, data });
}

export async function seedDefaultsHandler(req: Request, res: Response) {
  const result = await MeetingTypesService.seedDefaults(req.tenantId!);
  res.status(200).json({ success: true, data: result });
}

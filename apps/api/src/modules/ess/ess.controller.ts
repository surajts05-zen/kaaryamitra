import type { Request, Response } from 'express';
import { EssService } from './ess.service.js';
import { updateEssProfileSchema } from './ess.schema.js';

export async function getMyProfileHandler(req: Request, res: Response) {
  const data = await EssService.getMyProfile(req.tenantId!, req.auth!.userId);
  res.status(200).json({ success: true, data });
}

export async function updateMyProfileHandler(req: Request, res: Response) {
  const { body } = updateEssProfileSchema.parse({ body: req.body });
  const data = await EssService.updateMyProfile(req.tenantId!, req.auth!.userId, body);
  res.status(200).json({ success: true, data });
}

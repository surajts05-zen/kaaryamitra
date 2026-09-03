import type { Request, Response } from 'express';
import { AdminService } from './admin.service.js';
import { createTenantSchema, updateTenantSchema, updatePlatformSettingsSchema } from './admin.schema.js';

export async function listTenantsHandler(_req: Request, res: Response) {
  const tenants = await AdminService.listTenants();
  res.status(200).json({ success: true, data: tenants });
}

export async function getTenantStatsHandler(_req: Request, res: Response) {
  const stats = await AdminService.getTenantStats();
  res.status(200).json({ success: true, data: stats });
}

export async function createTenantHandler(req: Request, res: Response) {
  const { body } = createTenantSchema.parse({ body: req.body });
  const result = await AdminService.createTenant(body);
  res.status(201).json({ success: true, data: result });
}

export async function updateTenantHandler(req: Request, res: Response) {
  const { params, body } = updateTenantSchema.parse({ params: req.params, body: req.body });
  const tenant = await AdminService.updateTenant(params.id, body);
  res.status(200).json({ success: true, data: tenant });
}

export async function resetTenantAdminPasswordHandler(req: Request, res: Response) {
  const result = await AdminService.resetTenantAdminPassword(req.params['id'] as string);
  res.status(200).json({ success: true, data: result });
}

export async function getPlatformSettingsHandler(_req: Request, res: Response) {
  const settings = await AdminService.getPlatformSettings();
  res.status(200).json({ success: true, data: settings });
}

export async function updatePlatformSettingsHandler(req: Request, res: Response) {
  const { body } = updatePlatformSettingsSchema.parse({ body: req.body });
  const settings = await AdminService.updatePlatformSettings(body);
  res.status(200).json({ success: true, data: settings });
}

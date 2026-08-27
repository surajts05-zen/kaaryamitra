import type { Request, Response } from 'express';
import { OrgService } from './org.service.js';
import {
  createDepartmentSchema,
  createLocationSchema,
  createDesignationSchema,
  createJobLevelSchema,
  createHolidaySchema,
  updateCompanySettingsSchema,
} from './org.schema.js';

export async function listDepartmentsHandler(req: Request, res: Response) {
  const data = await OrgService.listDepartments(req.tenantId!);
  res.status(200).json({ success: true, data });
}

export async function createDepartmentHandler(req: Request, res: Response) {
  const { body } = createDepartmentSchema.parse({ body: req.body });
  const data = await OrgService.createDepartment(req.tenantId!, body);
  res.status(201).json({ success: true, data });
}

export async function listLocationsHandler(req: Request, res: Response) {
  const data = await OrgService.listLocations(req.tenantId!);
  res.status(200).json({ success: true, data });
}

export async function createLocationHandler(req: Request, res: Response) {
  const { body } = createLocationSchema.parse({ body: req.body });
  const data = await OrgService.createLocation(req.tenantId!, body);
  res.status(201).json({ success: true, data });
}

export async function listDesignationsHandler(req: Request, res: Response) {
  const data = await OrgService.listDesignations(req.tenantId!);
  res.status(200).json({ success: true, data });
}

export async function createDesignationHandler(req: Request, res: Response) {
  const { body } = createDesignationSchema.parse({ body: req.body });
  const data = await OrgService.createDesignation(req.tenantId!, body);
  res.status(201).json({ success: true, data });
}

export async function listJobLevelsHandler(req: Request, res: Response) {
  const data = await OrgService.listJobLevels(req.tenantId!);
  res.status(200).json({ success: true, data });
}

export async function createJobLevelHandler(req: Request, res: Response) {
  const { body } = createJobLevelSchema.parse({ body: req.body });
  const data = await OrgService.createJobLevel(req.tenantId!, body);
  res.status(201).json({ success: true, data });
}

export async function getCompanySettingsHandler(req: Request, res: Response) {
  const data = await OrgService.getCompanySettings(req.tenantId!);
  res.status(200).json({ success: true, data });
}

export async function updateCompanySettingsHandler(req: Request, res: Response) {
  const { body } = updateCompanySettingsSchema.parse({ body: req.body });
  const data = await OrgService.updateCompanySettings(req.tenantId!, body);
  res.status(200).json({ success: true, data });
}

export async function listHolidaysHandler(req: Request, res: Response) {
  const data = await OrgService.listHolidays(req.tenantId!);
  res.status(200).json({ success: true, data });
}

export async function createHolidayHandler(req: Request, res: Response) {
  const { body } = createHolidaySchema.parse({ body: req.body });
  const data = await OrgService.createHoliday(req.tenantId!, body);
  res.status(201).json({ success: true, data });
}

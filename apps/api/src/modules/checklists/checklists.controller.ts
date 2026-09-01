import { Request, Response } from 'express';
import { ChecklistsService } from './checklists.service.js';
import { TaskStatus } from '@prisma/client';

export const listTemplatesHandler = async (req: Request, res: Response) => {
  const tenantId = req.tenantId!;
  const templates = await ChecklistsService.listTemplates(tenantId);
  res.json({ success: true, data: templates });
};

export const createTemplateHandler = async (req: Request, res: Response) => {
  const tenantId = req.tenantId!;
  const template = await ChecklistsService.createTemplate(tenantId, req.body);
  res.json({ success: true, data: template });
};

export const updateTemplateHandler = async (req: Request, res: Response) => {
  const tenantId = req.tenantId!;
  const { id } = req.params;
  const template = await ChecklistsService.updateTemplate(tenantId, id, req.body);
  res.json({ success: true, data: template });
};

export const deleteTemplateHandler = async (req: Request, res: Response) => {
  const tenantId = req.tenantId!;
  const { id } = req.params;
  await ChecklistsService.deleteTemplate(tenantId, id);
  res.json({ success: true });
};

export const listEmployeeChecklistsHandler = async (req: Request, res: Response) => {
  const tenantId = req.tenantId!;
  const { employeeId } = req.params;
  const checklists = await ChecklistsService.listEmployeeChecklists(tenantId, employeeId);
  res.json({ success: true, data: checklists });
};

export const assignChecklistHandler = async (req: Request, res: Response) => {
  const tenantId = req.tenantId!;
  const { employeeId } = req.params;
  const { templateId } = req.body;
  const checklist = await ChecklistsService.assignChecklist(tenantId, employeeId, templateId);
  res.json({ success: true, data: checklist });
};

export const updateTaskStatusHandler = async (req: Request, res: Response) => {
  const tenantId = req.tenantId!;
  const { taskId } = req.params;
  const { status } = req.body as { status: TaskStatus };
  
  // Note: in a real system we'd verify the user has permission to update this specific task
  // For now, we assume they have the right permission if they reached this handler.
  const task = await ChecklistsService.updateTaskStatus(tenantId, taskId, status);
  res.json({ success: true, data: task });
};

import type { Request, Response } from 'express';
import { MilestonesService } from './milestones.service.js';
import { milestoneSchema, updateMilestoneSchema } from './milestones.schema.js';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';

async function verifyProjectAccess(tenantId: string, projectId: string) {
  const project = await prisma.project.findFirst({ where: { id: projectId, tenantId } });
  if (!project) throw AppError.notFound('Project');
  return project;
}

export async function listHandler(req: Request, res: Response) {
  await verifyProjectAccess(req.tenantId!, req.params.projectId as string);
  const data = await MilestonesService.list(req.params.projectId as string);
  res.status(200).json({ success: true, data });
}

export async function getHandler(req: Request, res: Response) {
  await verifyProjectAccess(req.tenantId!, req.params.projectId as string);
  const data = await MilestonesService.getById(req.params.projectId as string, req.params.id as string);
  res.status(200).json({ success: true, data });
}

export async function createHandler(req: Request, res: Response) {
  await verifyProjectAccess(req.tenantId!, req.params.projectId as string);
  const body = milestoneSchema.parse(req.body);
  const data = await MilestonesService.create(req.params.projectId as string, body);
  res.status(201).json({ success: true, data });
}

export async function updateHandler(req: Request, res: Response) {
  await verifyProjectAccess(req.tenantId!, req.params.projectId as string);
  const body = updateMilestoneSchema.parse(req.body);
  const data = await MilestonesService.update(req.params.projectId as string, req.params.id as string, body);
  res.status(200).json({ success: true, data });
}

export async function deleteHandler(req: Request, res: Response) {
  await verifyProjectAccess(req.tenantId!, req.params.projectId as string);
  await MilestonesService.delete(req.params.projectId as string, req.params.id as string);
  res.status(200).json({ success: true, message: 'Milestone deleted' });
}

import type { Request, Response } from 'express';
import { ProjectsService } from './projects.service.js';
import { projectSchema, updateProjectSchema, projectMemberSchema } from './projects.schema.js';

export async function listHandler(req: Request, res: Response) {
  const data = await ProjectsService.list(req.tenantId!);
  res.status(200).json({ success: true, data });
}

export async function getHandler(req: Request, res: Response) {
  const data = await ProjectsService.getById(req.tenantId!, req.params.id as string);
  res.status(200).json({ success: true, data });
}

export async function createHandler(req: Request, res: Response) {
  const body = projectSchema.parse(req.body);
  const data = await ProjectsService.create(req.tenantId!, body);
  res.status(201).json({ success: true, data });
}

export async function bulkCreateHandler(req: Request, res: Response) {
  const data = await ProjectsService.bulkCreate(req.tenantId!, req.body);
  res.status(201).json({ success: true, data });
}

export async function updateHandler(req: Request, res: Response) {
  const body = updateProjectSchema.parse(req.body);
  const data = await ProjectsService.update(req.tenantId!, req.params.id as string, body);
  res.status(200).json({ success: true, data });
}

export async function addMemberHandler(req: Request, res: Response) {
  const body = projectMemberSchema.parse(req.body);
  const data = await ProjectsService.addMember(req.tenantId!, req.params.id as string, body);
  res.status(201).json({ success: true, data });
}

export async function removeMemberHandler(req: Request, res: Response) {
  await ProjectsService.removeMember(req.tenantId!, req.params.id as string, req.params.memberId as string);
  res.status(200).json({ success: true, message: 'Member removed' });
}

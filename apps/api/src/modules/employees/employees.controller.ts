import type { Request, Response } from 'express';
import { EmployeesService } from './employees.service.js';
import { createEmployeeSchema, updateEmployeeSchema } from './employees.schema.js';

export async function listEmployeesHandler(req: Request, res: Response) {
  const data = await EmployeesService.listEmployees(req.tenantId!);
  res.status(200).json({ success: true, data });
}

export async function getEmployeeHandler(req: Request, res: Response) {
  const data = await EmployeesService.getEmployee(req.tenantId!, req.params.id as string);
  res.status(200).json({ success: true, data });
}

export async function createEmployeeHandler(req: Request, res: Response) {
  const { body } = createEmployeeSchema.parse({ body: req.body });
  const data = await EmployeesService.createEmployee(req.tenantId!, body);
  res.status(201).json({ success: true, data });
}

export async function updateEmployeeHandler(req: Request, res: Response) {
  const { body, params } = updateEmployeeSchema.parse({
    body: req.body,
    params: req.params,
  });
  const data = await EmployeesService.updateEmployee(req.tenantId!, params.id, body);
  res.status(200).json({ success: true, data });
}

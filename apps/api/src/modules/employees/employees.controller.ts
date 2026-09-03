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

export async function resetPasswordHandler(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  const employeeId = req.params.id as string;
  const { sendToAlternate } = req.body;

  const employee = await EmployeesService.getEmployee(tenantId, employeeId);
  
  if (!employee) {
    return res.status(404).json({ success: false, error: { message: 'Employee not found' } });
  }

  // Generate a random token
  const crypto = await import('crypto');
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Save the token to the user
  const { prisma } = await import('../../lib/prisma.js');
  await prisma.user.update({
    where: { id: employee.userId },
    data: {
      passwordResetToken: resetToken,
      passwordResetExpiresAt: resetExpiresAt
    }
  });

  const targetEmail = sendToAlternate && (employee as any).personalEmail ? (employee as any).personalEmail : employee.workEmail;

  // Mock sending email
  console.log(`[Email Service Mock] Password reset link sent to: ${targetEmail}`);
  console.log(`[Email Service Mock] Reset Token: ${resetToken}`);

  res.status(200).json({ 
    success: true, 
    message: `Password reset link has been sent to ${targetEmail}.` 
  });
}

export async function bulkCreateEmployeesHandler(req: Request, res: Response) {
  const { items } = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({ success: false, error: { message: 'Items must be an array' } });
  }
  const data = await EmployeesService.bulkCreateEmployees(req.tenantId!, items);
  res.status(201).json({ success: true, count: data.length, data });
}

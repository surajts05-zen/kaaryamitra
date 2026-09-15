import type { Request, Response } from 'express';
import { EmployeesService } from './employees.service.js';
import { createEmployeeSchema, updateEmployeeSchema } from './employees.schema.js';
import { NotificationService } from '../../lib/notifications.js';

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

  const appUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const resetLink = `${appUrl}/reset-password?token=${resetToken}`;

  await NotificationService.sendSystemEmail(
    targetEmail,
    'Password Reset Request - KaaryaMitra',
    `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Password Reset</h2>
        <p>You requested to reset your password. Click the link below to set a new one:</p>
        <p><a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>This link expires in 24 hours.</p>
      </div>
    `
  );

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

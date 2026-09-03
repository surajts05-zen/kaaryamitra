import { Request, Response } from 'express';
import { PayrollService } from './payroll.service.js';
import { createPayrollRunSchema, updatePayrollRunStatusSchema, createStatutoryRuleSchema, updateStatutoryRuleSchema } from './payroll.schema.js';
import { prisma } from '../../lib/prisma.js';

export class PayrollController {
  
  static async getRuns(req: Request, res: Response) {
    const runs = await PayrollService.getRuns(req.tenantId!);
    res.json(runs);
  }

  static async getRunDetails(req: Request, res: Response) {
    const run = await PayrollService.getRunDetails(req.tenantId!, req.params.id as string);
    res.json(run);
  }

  static async createRun(req: Request, res: Response) {
    const data = createPayrollRunSchema.parse(req.body);
    const run = await PayrollService.createRun(req.tenantId!, req.auth!.userId, data);
    res.status(201).json(run);
  }

  static async updateRunStatus(req: Request, res: Response) {
    const data = updatePayrollRunStatusSchema.parse(req.body);
    const run = await PayrollService.updateRunStatus(req.tenantId!, req.params.id as string, data);
    res.json(run);
  }

  static async uploadCsv(req: Request, res: Response) {
    if (!req.file) {
      return res.status(400).json({ message: 'No CSV file uploaded' });
    }
    const result = await PayrollService.uploadCsvForRun(req.tenantId!, req.params.id as string, req.file.buffer);
    res.json(result);
  }

  // ESS Ends
  static async getMyPayslips(req: Request, res: Response) {
    const me = await prisma.employee.findUnique({ where: { userId: req.auth!.userId } });
    if (!me) return res.status(404).json({ message: 'Employee record not found' });
    const payslips = await PayrollService.getEmployeePayslips(req.tenantId!, me.id);
    res.json(payslips);
  }

  static async getMyPayslipDetails(req: Request, res: Response) {
    const me = await prisma.employee.findUnique({ where: { userId: req.auth!.userId } });
    if (!me) return res.status(404).json({ message: 'Employee record not found' });
    const payslip = await PayrollService.getEmployeePayslipDetails(req.tenantId!, me.id, req.params.id as string);
    res.json(payslip);
  }

  static async getStatutoryRules(req: Request, res: Response) {
    const rules = await PayrollService.getStatutoryRules(req.tenantId!);
    res.json(rules);
  }

  static async createStatutoryRule(req: Request, res: Response) {
    const data = createStatutoryRuleSchema.parse(req.body);
    const rule = await PayrollService.createStatutoryRule(req.tenantId!, data);
    res.status(201).json(rule);
  }

  static async updateStatutoryRule(req: Request, res: Response) {
    const data = updateStatutoryRuleSchema.parse(req.body);
    const rule = await PayrollService.updateStatutoryRule(req.tenantId!, req.params.id as string, data);
    res.json(rule);
  }

}

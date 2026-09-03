import { Request, Response } from 'express';
import { CompensationService } from './compensation.service.js';
import { 
  createSalaryComponentSchema, 
  updateSalaryComponentSchema, 
  createSalaryStructureSchema,
  updateSalaryStructureSchema,
  reviseCompensationSchema
} from './compensation.schema.js';
import { prisma } from '../../lib/prisma.js';

export class CompensationController {
  
  static async getComponents(req: Request, res: Response) {
    const components = await CompensationService.getComponents(req.tenantId!);
    res.json(components);
  }

  static async seedDefaultComponents(req: Request, res: Response) {
    const seeded = await CompensationService.seedDefaultComponents(req.tenantId!);
    res.status(201).json({ message: `Seeded ${seeded.length} standard Indian components`, data: seeded });
  }

  static async createComponent(req: Request, res: Response) {
    const data = createSalaryComponentSchema.parse(req.body);
    const component = await CompensationService.createComponent(req.tenantId!, data);
    res.status(201).json(component);
  }

  static async updateComponent(req: Request, res: Response) {
    const data = updateSalaryComponentSchema.parse(req.body);
    const component = await CompensationService.updateComponent(req.tenantId!, req.params.id as string, data);
    res.json(component);
  }

  static async getStructures(req: Request, res: Response) {
    const structures = await CompensationService.getStructures(req.tenantId!);
    res.json(structures);
  }

  static async createStructure(req: Request, res: Response) {
    const data = createSalaryStructureSchema.parse(req.body);
    const structure = await CompensationService.createStructure(req.tenantId!, data);
    res.status(201).json(structure);
  }

  static async updateStructure(req: Request, res: Response) {
    const data = updateSalaryStructureSchema.parse(req.body);
    const structure = await CompensationService.updateStructure(req.tenantId!, req.params.id as string, data);
    res.json(structure);
  }

  static async getEmployeeCompensation(req: Request, res: Response) {
    const profile = await CompensationService.getEmployeeCompensation(req.tenantId!, req.params.empId as string);
    res.json(profile || null);
  }

  static async reviseEmployeeCompensation(req: Request, res: Response) {
    const data = reviseCompensationSchema.parse(req.body);
    const profile = await CompensationService.reviseEmployeeCompensation(
      req.tenantId!, 
      req.params.empId as string, 
      req.auth!.userId,
      data
    );
    res.status(201).json(profile);
  }

  static async getEmployeeCompensationHistory(req: Request, res: Response) {
    const history = await CompensationService.getEmployeeCompensationHistory(req.tenantId!, req.params.empId as string);
    res.json(history);
  }

  // ESS Endpoints
  static async getMyCompensation(req: Request, res: Response) {
    const me = await prisma.employee.findUnique({ where: { userId: req.auth!.userId } });
    if (!me) {
      return res.status(404).json({ message: 'Employee record not found' });
    }
    const profile = await CompensationService.getEmployeeCompensation(req.tenantId!, me.id);
    res.json(profile || null);
  }

  static async getMyCompensationHistory(req: Request, res: Response) {
    const me = await prisma.employee.findUnique({ where: { userId: req.auth!.userId } });
    if (!me) {
      return res.status(404).json({ message: 'Employee record not found' });
    }
    const history = await CompensationService.getEmployeeCompensationHistory(req.tenantId!, me.id);
    res.json(history);
  }
}

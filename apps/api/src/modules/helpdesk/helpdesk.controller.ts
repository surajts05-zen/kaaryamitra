import { Request, Response } from 'express';
import { HelpdeskService } from './helpdesk.service.js';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';

export class HelpdeskController {
  // ─── Categories ────────────────────────────────────────────────────────────
  
  static async getCategories(req: Request, res: Response) {
    const categories = await HelpdeskService.getCategories(req.tenantId!);
    res.json({ data: categories });
  }

  static async createCategory(req: Request, res: Response) {
    const category = await HelpdeskService.createCategory(req.tenantId!, req.body);
    res.status(201).json({ data: category });
  }

  static async updateCategory(req: Request, res: Response) {
    const category = await HelpdeskService.updateCategory(req.tenantId!, req.params.id as string, req.body);
    res.json({ data: category });
  }

  static async deleteCategory(req: Request, res: Response) {
    await HelpdeskService.deleteCategory(req.tenantId!, req.params.id as string);
    res.status(204).send();
  }

  // ─── HR/Admin Tickets ──────────────────────────────────────────────────────
  
  static async getAllTickets(req: Request, res: Response) {
    const tickets = await HelpdeskService.getTickets(req.tenantId!, req.query);
    res.json({ data: tickets });
  }

  static async getTicketById(req: Request, res: Response) {
    // HR sees internal comments
    const ticket = await HelpdeskService.getTicketById(req.tenantId!, req.params.id as string, true);
    res.json({ data: ticket });
  }

  static async updateTicket(req: Request, res: Response) {
    const ticket = await HelpdeskService.updateTicket(req.tenantId!, req.params.id as string, req.body);
    res.json({ data: ticket });
  }

  static async addAdminComment(req: Request, res: Response) {
    const employee = await prisma.employee.findUnique({ where: { userId: req.auth!.userId } });
    if (!employee) throw AppError.notFound('Employee');
    const comment = await HelpdeskService.addComment(req.tenantId!, req.params.id as string, employee.id, req.body);
    res.status(201).json({ data: comment });
  }

  // ─── ESS (My) Tickets ──────────────────────────────────────────────────────

  static async getMyTickets(req: Request, res: Response) {
    const employee = await prisma.employee.findUnique({ where: { userId: req.auth!.userId } });
    if (!employee) throw AppError.notFound('Employee');
    const tickets = await HelpdeskService.getTickets(req.tenantId!, { employeeId: employee.id });
    res.json({ data: tickets });
  }

  static async getMyTicketById(req: Request, res: Response) {
    const employee = await prisma.employee.findUnique({ where: { userId: req.auth!.userId } });
    if (!employee) throw AppError.notFound('Employee');

    // ESS user DOES NOT see internal comments
    const ticket = await HelpdeskService.getTicketById(req.tenantId!, req.params.id as string, false);
    
    // Ensure the ticket actually belongs to the requesting employee
    if (ticket.employeeId !== employee.id) {
      return res.status(403).json({ error: { message: 'Access denied to this ticket' } });
    }
    
    res.json({ data: ticket });
  }

  static async createTicket(req: Request, res: Response) {
    const employee = await prisma.employee.findUnique({ where: { userId: req.auth!.userId } });
    if (!employee) throw AppError.notFound('Employee');
    const ticket = await HelpdeskService.createTicket(req.tenantId!, employee.id, req.body);
    res.status(201).json({ data: ticket });
  }

  static async addEmployeeComment(req: Request, res: Response) {
    const employee = await prisma.employee.findUnique({ where: { userId: req.auth!.userId } });
    if (!employee) throw AppError.notFound('Employee');
    
    // Employee comments are never internal
    const data = { ...req.body, isInternal: false };
    const comment = await HelpdeskService.addComment(req.tenantId!, req.params.id as string, employee.id, data);
    res.status(201).json({ data: comment });
  }
}

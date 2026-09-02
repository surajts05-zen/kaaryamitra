import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import { TicketStatus, TicketPriority } from '@prisma/client';

export class HelpdeskService {
  // ─── Categories ────────────────────────────────────────────────────────────

  static async getCategories(tenantId: string) {
    return prisma.helpdeskCategory.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  static async createCategory(tenantId: string, data: any) {
    return prisma.helpdeskCategory.create({
      data: {
        tenantId,
        ...data,
      },
    });
  }

  static async updateCategory(tenantId: string, id: string, data: any) {
    return prisma.helpdeskCategory.update({
      where: { id, tenantId },
      data,
    });
  }

  static async deleteCategory(tenantId: string, id: string) {
    const tickets = await prisma.helpdeskTicket.count({ where: { categoryId: id } });
    if (tickets > 0) {
      throw AppError.badRequest('Cannot delete category because it is used in tickets.');
    }
    return prisma.helpdeskCategory.delete({
      where: { id, tenantId },
    });
  }

  // ─── Tickets ─────────────────────────────────────────────────────────────

  static async getTickets(tenantId: string, filters: any) {
    const where: any = { tenantId };
    
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.assignedToId) where.assignedToId = filters.assignedToId;
    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.categoryId) where.categoryId = filters.categoryId;

    return prisma.helpdeskTicket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        category: true,
        _count: { select: { comments: true } }
      },
    });
  }

  static async getTicketById(tenantId: string, id: string, includeInternal = true) {
    const ticket = await prisma.helpdeskTicket.findFirst({
      where: { id, tenantId },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        category: true,
        comments: {
          ...(includeInternal ? {} : { where: { isInternal: false } }),
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { id: true, firstName: true, lastName: true, userId: true } },
          },
        },
      },
    });

    if (!ticket) throw AppError.notFound('Ticket');
    return ticket;
  }

  static async createTicket(tenantId: string, employeeId: string, data: any) {
    // Determine SLA
    const category = await prisma.helpdeskCategory.findUnique({ where: { id: data.categoryId } });
    if (!category) throw AppError.notFound('Category');

    let slaHours = category.slaMediumHours;
    if (data.priority === 'LOW') slaHours = category.slaLowHours;
    if (data.priority === 'HIGH') slaHours = category.slaHighHours;
    if (data.priority === 'URGENT') slaHours = category.slaUrgentHours;

    const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000);

    return prisma.helpdeskTicket.create({
      data: {
        tenantId,
        employeeId,
        subject: data.subject,
        description: data.description,
        categoryId: data.categoryId,
        priority: data.priority || 'MEDIUM',
        attachments: data.attachments || '[]',
        slaDeadline,
      },
    });
  }

  static async updateTicket(tenantId: string, id: string, data: any) {
    if (data.status === 'RESOLVED' || data.status === 'CLOSED') {
      data.resolvedAt = new Date();
    }
    if (data.status === 'OPEN' || data.status === 'IN_PROGRESS') {
      data.resolvedAt = null;
    }

    return prisma.helpdeskTicket.update({
      where: { id, tenantId },
      data,
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        category: true,
      }
    });
  }

  // ─── Comments ────────────────────────────────────────────────────────────

  static async addComment(tenantId: string, ticketId: string, authorId: string, data: any) {
    // verify ticket exists
    const ticket = await prisma.helpdeskTicket.findFirst({
      where: { id: ticketId, tenantId },
    });
    if (!ticket) throw AppError.notFound('Ticket');

    return prisma.helpdeskComment.create({
      data: {
        ticketId,
        authorId,
        content: data.content,
        attachments: data.attachments || '[]',
        isInternal: data.isInternal || false,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
      }
    });
  }
}

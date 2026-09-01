import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import { TaskType, TaskStatus } from '@prisma/client';

export class ChecklistsService {
  // Templates
  static async listTemplates(tenantId: string) {
    return prisma.checklistTemplate.findMany({
      where: { tenantId },
      include: { tasks: true },
      orderBy: { name: 'asc' },
    });
  }

  static async createTemplate(tenantId: string, data: any) {
    return prisma.checklistTemplate.create({
      data: {
        tenantId,
        name: data.name,
        type: data.type,
        description: data.description,
        tasks: {
          create: data.tasks.map((t: any) => ({
            title: t.title,
            description: t.description,
            assigneeRole: t.assigneeRole,
          })),
        },
      },
      include: { tasks: true },
    });
  }

  static async updateTemplate(tenantId: string, id: string, data: any) {
    // Basic implementation: delete old tasks, create new ones
    await prisma.checklistTaskTemplate.deleteMany({
      where: { templateId: id },
    });
    
    return prisma.checklistTemplate.update({
      where: { id, tenantId },
      data: {
        name: data.name,
        type: data.type,
        description: data.description,
        tasks: {
          create: data.tasks.map((t: any) => ({
            title: t.title,
            description: t.description,
            assigneeRole: t.assigneeRole,
          })),
        },
      },
      include: { tasks: true },
    });
  }

  static async deleteTemplate(tenantId: string, id: string) {
    return prisma.checklistTemplate.delete({
      where: { id, tenantId },
    });
  }

  // Employee Checklists
  static async listEmployeeChecklists(tenantId: string, employeeId: string) {
    return prisma.employeeChecklist.findMany({
      where: { tenantId, employeeId },
      include: { tasks: true },
      orderBy: { id: 'desc' },
    });
  }

  static async assignChecklist(tenantId: string, employeeId: string, templateId: string) {
    const template = await prisma.checklistTemplate.findUnique({
      where: { id: templateId, tenantId },
      include: { tasks: true },
    });
    
    if (!template) throw AppError.notFound('ChecklistTemplate');

    return prisma.employeeChecklist.create({
      data: {
        tenantId,
        employeeId,
        type: template.type,
        tasks: {
          create: template.tasks.map(t => ({
            title: t.title,
            description: t.description,
            assigneeRole: t.assigneeRole,
          })),
        },
      },
      include: { tasks: true },
    });
  }

  static async updateTaskStatus(tenantId: string, taskId: string, status: TaskStatus) {
    const task = await prisma.employeeChecklistTask.update({
      where: { id: taskId },
      data: { 
        status,
        completedAt: status === 'COMPLETED' ? new Date() : null,
      },
      include: { checklist: true },
    });
    
    // Check if all tasks in this checklist are done
    const checklist = await prisma.employeeChecklist.findUnique({
      where: { id: task.checklistId },
      include: { tasks: true },
    });
    
    if (checklist) {
      const allDone = checklist.tasks.every(t => t.status === 'COMPLETED' || t.status === 'NOT_APPLICABLE');
      if (allDone && checklist.status !== 'COMPLETED') {
        await prisma.employeeChecklist.update({
          where: { id: checklist.id },
          data: { status: 'COMPLETED' },
        });
      } else if (!allDone && checklist.status === 'COMPLETED') {
        await prisma.employeeChecklist.update({
          where: { id: checklist.id },
          data: { status: 'PENDING' },
        });
      }
    }
    
    return task;
  }
}

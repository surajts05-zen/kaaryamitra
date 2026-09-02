import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import type { WorkflowStepDef } from './workflow.schema.js';
import type { z } from 'zod';
import type { CreateWorkflowTemplateSchema, UpdateWorkflowTemplateSchema } from './workflow.schema.js';
import { createNotification } from '../notifications/notification.service.js';

// ─── Template Management ───────────────────────────────────────────────────────

export async function listWorkflowTemplates(tenantId: string) {
  return prisma.workflowTemplate.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getWorkflowTemplate(tenantId: string, id: string) {
  const template = await prisma.workflowTemplate.findFirst({ where: { id, tenantId } });
  if (!template) throw AppError.notFound('Workflow template');
  return template;
}

export async function getTemplateByTrigger(tenantId: string, triggerType: string) {
  return prisma.workflowTemplate.findUnique({
    where: {
      tenantId_triggerType: {
        tenantId,
        triggerType: triggerType as any,
      },
    },
  });
}

export async function createWorkflowTemplate(
  tenantId: string,
  data: z.infer<typeof CreateWorkflowTemplateSchema>,
) {
  // Ensure no duplicate triggerType for this tenant
  const existing = await prisma.workflowTemplate.findUnique({
    where: {
      tenantId_triggerType: {
        tenantId,
        triggerType: data.triggerType as any,
      },
    },
  });

  if (existing) {
    throw AppError.badRequest(
      `A workflow for trigger type "${data.triggerType}" already exists. Please edit the existing one or disable it first.`,
    );
  }

  return prisma.workflowTemplate.create({
    data: {
      tenantId,
      name: data.name,
      description: data.description ?? null,
      triggerType: data.triggerType as any,
      entityType: triggerTypeToEntityType(data.triggerType),
      steps: data.steps,
      isActive: true,
    },
  });
}

export async function updateWorkflowTemplate(
  tenantId: string,
  id: string,
  data: z.infer<typeof UpdateWorkflowTemplateSchema>,
) {
  const existing = await prisma.workflowTemplate.findFirst({ where: { id, tenantId } });
  if (!existing) throw AppError.notFound('Workflow template');

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.steps !== undefined) updateData.steps = data.steps;

  return prisma.workflowTemplate.update({
    where: { id },
    data: updateData,
  });
}

// ─── Workflow Engine — Execution ───────────────────────────────────────────────

/**
 * Start a new workflow instance for a given trigger + target entity.
 * Returns null if no active workflow is configured for the trigger.
 */
export async function startWorkflow(
  tenantId: string,
  triggerType: string,
  entityType: string,
  entityId: string,
): Promise<string | null> {
  const template = await getTemplateByTrigger(tenantId, triggerType);
  if (!template || !template.isActive) return null;

  const instance = await prisma.workflowInstance.create({
    data: {
      tenantId,
      templateId: template.id,
      entityType,
      entityId,
      status: 'IN_PROGRESS',
      currentStepIndex: 0,
      leaveApplicationId: entityType === 'LeaveApplication' ? entityId : null,
      attendanceCorrectionId: entityType === 'AttendanceCorrection' ? entityId : null,
      shiftSwapRequestId: entityType === 'ShiftSwapRequest' ? entityId : null,
      timesheetId: entityType === 'Timesheet' ? entityId : null,
    },
  });

  return instance.id;
}

/**
 * Get the current pending step for an instance.
 */
export async function getCurrentStep(instanceId: string): Promise<WorkflowStepDef | null> {
  const instance = await prisma.workflowInstance.findUnique({
    where: { id: instanceId },
    include: { template: true },
  });

  if (!instance || instance.status !== 'IN_PROGRESS') return null;

  const steps = instance.template.steps as WorkflowStepDef[];
  return steps[instance.currentStepIndex] ?? null;
}

/**
 * Check whether a specific user is authorized to action the given workflow step.
 */
export async function isUserStepApprover(
  step: WorkflowStepDef,
  employeeId: string,
  userId: string,
  tenantId: string,
): Promise<boolean> {
  // Company Admin can approve anything
  const isAdmin = await prisma.userRole.findFirst({
    where: {
      userId,
      role: {
        tenantId,
        name: 'Company Admin',
      },
    },
  });
  if (isAdmin) return true;

  if (step.assigneeType === 'SPECIFIC_USER') {
    return step.assigneeId === userId;
  }

  if (step.assigneeType === 'ROLE') {
    if (!step.assigneeId) return false;
    const userRole = await prisma.userRole.findFirst({
      where: {
        userId,
        roleId: step.assigneeId,
      },
    });
    return userRole !== null;
  }

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      manager: true,
      department: { include: { head: true } },
    },
  });

  if (!employee) return false;

  if (step.assigneeType === 'MANAGER') {
    return employee.manager?.userId === userId;
  }

  if (step.assigneeType === 'DEPARTMENT_HEAD') {
    return employee.department?.head?.userId === userId;
  }

  if (step.assigneeType === 'HR') {
    const hrRole = await prisma.userRole.findFirst({
      where: {
        userId,
        role: {
          tenantId,
          name: { in: ['HR Manager', 'Company Admin'] },
        },
      },
    });
    return hrRole !== null;
  }

  return false;
}


/**
 * Process an action (APPROVED / REJECTED) on the current step.
 * Returns the updated instance.
 */
export async function processWorkflowAction(
  tenantId: string,
  instanceId: string,
  actorUserId: string,
  action: 'APPROVED' | 'REJECTED',
  comment?: string,
) {
  const instance = await prisma.workflowInstance.findUnique({
    where: { id: instanceId },
    include: { template: true },
  });

  if (!instance) throw AppError.notFound('Workflow instance');
  if (instance.tenantId !== tenantId) throw AppError.forbidden('Access denied');
  if (instance.status !== 'IN_PROGRESS') {
    throw AppError.badRequest(`Workflow is already ${instance.status}`);
  }

  const steps = instance.template.steps as WorkflowStepDef[];

  // Record the action
  await prisma.workflowAction.create({
    data: {
      instanceId,
      stepIndex: instance.currentStepIndex,
      actorId: actorUserId,
      action: action.toLowerCase(),
      comment: comment ?? null,
    },
  });

  if (action === 'REJECTED') {
    // Reject terminates the entire workflow
    const rejected = await prisma.workflowInstance.update({
      where: { id: instanceId },
      data: { status: 'REJECTED', completedAt: new Date() },
    });

    // Notify initiating employee
    if (instance.leaveApplicationId) {
      const app = await prisma.leaveApplication.findUnique({
        where: { id: instance.leaveApplicationId },
        include: { employee: { include: { user: true } } },
      });
      if (app?.employee?.user) {
        const tenantSlug = (await prisma.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } }))?.slug;
        createNotification({
          tenantId,
          userId: app.employee.user.id,
          type: 'workflow.rejected',
          title: 'Your request has been Rejected ❌',
          body: `Your leave request was rejected${comment ? `: "${comment}"` : '.'}`,
          link: tenantSlug ? `/t/${tenantSlug}/me/leave` : undefined,
          email: app.employee.user.email,
        }).catch(() => {});
      }
    } else if (instance.attendanceCorrectionId) {
      const correction = await prisma.attendanceCorrection.update({
        where: { id: instance.attendanceCorrectionId },
        data: { status: 'REJECTED' },
        include: { record: { include: { employee: { include: { user: true } } } } }
      });
      if (correction?.record?.employee?.user) {
        const tenantSlug = (await prisma.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } }))?.slug;
        createNotification({
          tenantId,
          userId: correction.record.employee.user.id,
          type: 'workflow.rejected',
          title: 'Attendance Correction Rejected ❌',
          body: `Your attendance regularization request was rejected${comment ? `: "${comment}"` : '.'}`,
          link: tenantSlug ? `/t/${tenantSlug}/me/attendance` : undefined,
          email: correction.record.employee.user.email,
        }).catch(() => {});
      }
    } else if (instance.timesheetId) {
      const ts = await prisma.timesheet.update({
        where: { id: instance.timesheetId },
        data: { status: 'REJECTED' },
        include: { employee: { include: { user: true } } }
      });
      if (ts?.employee?.user) {
        const tenantSlug = (await prisma.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } }))?.slug;
        createNotification({
          tenantId,
          userId: ts.employee.user.id,
          type: 'workflow.rejected',
          title: 'Timesheet Rejected ❌',
          body: `Your timesheet was rejected${comment ? `: "${comment}"` : '.'}`,
          link: tenantSlug ? `/t/${tenantSlug}/me/timesheets` : undefined,
          email: ts.employee.user.email,
        }).catch(() => {});
      }
    } else if (instance.shiftSwapRequestId) {
      const swap = await prisma.shiftSwapRequest.update({
        where: { id: instance.shiftSwapRequestId },
        data: { status: 'REJECTED' },
        include: { requestingEmployee: { include: { user: true } } }
      });
      if (swap?.requestingEmployee?.user) {
        const tenantSlug = (await prisma.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } }))?.slug;
        createNotification({
          tenantId,
          userId: swap.requestingEmployee.user.id,
          type: 'workflow.rejected',
          title: 'Shift Swap Rejected ❌',
          body: `Your shift swap request was rejected${comment ? `: "${comment}"` : '.'}`,
          email: swap.requestingEmployee.user.email,
        }).catch(() => {});
      }
    }

    return rejected;
  }

  // APPROVED — advance to next step
  const nextStepIndex = instance.currentStepIndex + 1;
  const isComplete = nextStepIndex >= steps.length;

  const updated = await prisma.workflowInstance.update({
    where: { id: instanceId },
    data: {
      currentStepIndex: isComplete ? instance.currentStepIndex : nextStepIndex,
      status: isComplete ? 'COMPLETED' : 'IN_PROGRESS',
      completedAt: isComplete ? new Date() : null,
    },
  });

  const tenantSlug = (await prisma.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } }))?.slug;

  if (isComplete && instance.leaveApplicationId) {
    // Notify employee that their request completed
    const app = await prisma.leaveApplication.findUnique({
      where: { id: instance.leaveApplicationId },
      include: { employee: { include: { user: true } } },
    });
    if (app?.employee?.user) {
      createNotification({
        tenantId,
        userId: app.employee.user.id,
        type: 'workflow.completed',
        title: 'Your Leave Request is Approved ✅',
        body: 'All approval steps have been completed. Your leave is confirmed.',
        link: tenantSlug ? `/t/${tenantSlug}/me/leave` : undefined,
        email: app.employee.user.email,
      }).catch(() => {});
    }
  } else if (isComplete && instance.attendanceCorrectionId) {
    const correction = await prisma.attendanceCorrection.update({
      where: { id: instance.attendanceCorrectionId },
      data: { status: 'APPROVED' },
      include: { record: { include: { employee: { include: { user: true } } } } }
    });
    
    // Apply the correction to the AttendanceRecord
    const updateData: any = {};
    if (correction.requestedCheckIn) updateData.punchInTime = correction.requestedCheckIn;
    if (correction.requestedCheckOut) updateData.punchOutTime = correction.requestedCheckOut;
    
    // Recalculate total minutes if both exist
    const finalIn = correction.requestedCheckIn || correction.record.punchInTime;
    const finalOut = correction.requestedCheckOut || correction.record.punchOutTime;
    if (finalIn && finalOut) {
      updateData.totalMinutes = Math.floor((finalOut.getTime() - finalIn.getTime()) / 60000) - correction.record.totalBreakMinutes;
    }

    updateData.status = 'PRESENT';

    await prisma.attendanceRecord.update({
      where: { id: correction.attendanceRecordId },
      data: updateData
    });

    if (correction?.record?.employee?.user) {
      createNotification({
        tenantId,
        userId: correction.record.employee.user.id,
        type: 'workflow.completed',
        title: 'Attendance Correction Approved ✅',
        body: 'Your attendance regularization request has been approved.',
        link: tenantSlug ? `/t/${tenantSlug}/me/attendance` : undefined,
        email: correction.record.employee.user.email,
      }).catch(() => {});
    }
  } else if (isComplete && instance.timesheetId) {
    const ts = await prisma.timesheet.update({
      where: { id: instance.timesheetId },
      data: { status: 'APPROVED', approverNote: comment || null },
      include: { employee: { include: { user: true } } }
    });
    
    if (ts?.employee?.user) {
      createNotification({
        tenantId,
        userId: ts.employee.user.id,
        type: 'workflow.completed',
        title: 'Timesheet Approved ✅',
        body: 'Your submitted timesheet has been approved.',
        link: tenantSlug ? `/t/${tenantSlug}/me/timesheets` : undefined,
        email: ts.employee.user.email,
      }).catch(() => {});
    }
  } else if (isComplete && instance.shiftSwapRequestId) {
    const swap = await prisma.shiftSwapRequest.update({
      where: { id: instance.shiftSwapRequestId },
      data: { status: 'APPROVED' },
      include: { 
        requestingEmployee: { include: { user: true } },
        targetEmployee: { include: { user: true } }
      }
    });

    // Notify both employees
    if (swap?.requestingEmployee?.user) {
      createNotification({
        tenantId,
        userId: swap.requestingEmployee.user.id,
        type: 'workflow.completed',
        title: 'Shift Swap Approved ✅',
        body: 'Your shift swap request has been approved by management.',
        email: swap.requestingEmployee.user.email,
      }).catch(() => {});
    }
    if (swap?.targetEmployee?.user) {
      createNotification({
        tenantId,
        userId: swap.targetEmployee.user.id,
        type: 'workflow.completed',
        title: 'Shift Swap Confirmed ✅',
        body: `You are confirmed to swap shifts with ${swap.requestingEmployee.firstName} ${swap.requestingEmployee.lastName}.`,
        email: swap.targetEmployee.user.email,
      }).catch(() => {});
    }
  }

  return updated;
}

/**
 * Get all workflow instances where the given user is the current approver.
 */
export async function getPendingActionsForUser(tenantId: string, userId: string) {
  const instances = await prisma.workflowInstance.findMany({
    where: {
      tenantId,
      status: 'IN_PROGRESS',
    },
    include: {
      template: true,
      leaveApplication: {
        include: {
          employee: { include: { user: true, department: true, designation: true } },
          leaveType: true,
        },
      },
      attendanceCorrection: {
        include: {
          record: {
            include: {
              employee: { include: { user: true, department: true, designation: true } },
            },
          },
        },
      },
      timesheet: {
        include: { employee: { include: { user: true, department: true, designation: true } } }
      },
      shiftSwapRequest: {
        include: { requestingEmployee: { include: { user: true, department: true, designation: true } } }
      },
    },
  });

  // Filter to only the ones where this user is the current approver
  const pending = [];
  for (const instance of instances) {
    const steps = instance.template.steps as WorkflowStepDef[];
    const currentStep = steps[instance.currentStepIndex];
    if (!currentStep) continue;

    const employeeId = instance.leaveApplication?.employeeId || 
                       instance.attendanceCorrection?.record.employeeId ||
                       instance.timesheet?.employeeId ||
                       instance.shiftSwapRequest?.requestingEmployeeId;
    if (!employeeId) continue;

    const isApprover = await isUserStepApprover(
      currentStep,
      employeeId,
      userId,
      tenantId,
    );

    if (isApprover) {
      pending.push({ instance, currentStep });
    }
  }

  return pending;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function triggerTypeToEntityType(triggerType: string): string {
  const map: Record<string, string> = {
    LEAVE_REQUEST: 'LeaveApplication',
    EXPENSE_REQUEST: 'ExpenseRequest',
    OFFBOARDING_REQUEST: 'OffboardingRequest',
    DOCUMENT_REQUEST: 'DocumentRequest',
    ATTENDANCE_REGULARIZATION: 'AttendanceCorrection',
    TIMESHEET_APPROVAL: 'Timesheet',
    SHIFT_SWAP_REQUEST: 'ShiftSwapRequest',
    CUSTOM: 'Custom',
  };
  return map[triggerType] ?? 'Custom';
}

export async function seedStandardWorkflows(tenantId: string) {
  const standardTemplates = [
    {
      name: 'Standard Leave Approval',
      description: 'Requires reporting manager approval for all leave requests.',
      triggerType: 'LEAVE_REQUEST',
      entityType: 'LeaveApplication',
      isActive: true,
      steps: [
        {
          stepOrder: 1,
          assigneeType: 'MANAGER',
          label: 'Reporting Manager Review',
        }
      ]
    },
    {
      name: 'Attendance Regularization',
      description: 'Manager approval for attendance corrections.',
      triggerType: 'ATTENDANCE_REGULARIZATION',
      entityType: 'AttendanceCorrection',
      isActive: true,
      steps: [
        {
          stepOrder: 1,
          assigneeType: 'MANAGER',
          label: 'Reporting Manager Review',
        }
      ]
    },
    {
      name: 'Timesheet Approval',
      description: 'Timesheets must be approved by the reporting manager.',
      triggerType: 'TIMESHEET_APPROVAL',
      entityType: 'Timesheet',
      isActive: true,
      steps: [
        {
          stepOrder: 1,
          assigneeType: 'MANAGER',
          label: 'Reporting Manager Review',
        }
      ]
    },
    {
      name: 'Standard Offboarding',
      description: 'HR and Manager reviews for offboarding requests.',
      triggerType: 'OFFBOARDING_REQUEST',
      entityType: 'OffboardingRequest',
      isActive: true,
      steps: [
        {
          stepOrder: 1,
          assigneeType: 'MANAGER',
          label: 'Reporting Manager Review',
        },
        {
          stepOrder: 2,
          assigneeType: 'HR',
          label: 'HR Clearance',
        }
      ]
    }
  ];

  const results = [];

  for (const tpl of standardTemplates) {
    const existing = await prisma.workflowTemplate.findUnique({
      where: {
        tenantId_triggerType: {
          tenantId,
          triggerType: tpl.triggerType as any,
        }
      }
    });

    if (!existing) {
      const created = await prisma.workflowTemplate.create({
        data: {
          ...tpl,
          tenantId,
          triggerType: tpl.triggerType as any,
        }
      });
      results.push(created);
    }
  }

  // Seed Helpdesk Categories
  const standardHelpdeskCategories = [
    { name: 'IT Support', description: 'Hardware, Software, and Network issues', slaLowHours: 72, slaMediumHours: 48, slaHighHours: 24, slaUrgentHours: 4 },
    { name: 'HR Queries', description: 'Payroll, Benefits, and Policy queries', slaLowHours: 120, slaMediumHours: 72, slaHighHours: 48, slaUrgentHours: 24 },
    { name: 'Facilities', description: 'Office maintenance and supplies', slaLowHours: 120, slaMediumHours: 72, slaHighHours: 48, slaUrgentHours: 24 },
  ];

  for (const cat of standardHelpdeskCategories) {
    await prisma.helpdeskCategory.upsert({
      where: { tenantId_name: { tenantId, name: cat.name } },
      update: {}, // Don't override if user edited them
      create: { tenantId, ...cat }
    });
  }

  return { seeded: results.length, total: standardTemplates.length, helpdeskCategoriesSeeded: standardHelpdeskCategories.length };
}

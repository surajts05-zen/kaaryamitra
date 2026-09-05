import { PrismaClient } from '@prisma/client';
import { AppError } from '../../lib/errors.js';

const prisma = new PrismaClient();

// Define dataset schemas for the frontend
const DATASETS = {
  EMPLOYEES: {
    label: 'Employees',
    fields: [
      { name: 'id', label: 'ID', type: 'string' },
      { name: 'firstName', label: 'First Name', type: 'string' },
      { name: 'lastName', label: 'Last Name', type: 'string' },
      { name: 'email', label: 'Email', type: 'string' },
      { name: 'status', label: 'Status', type: 'string' },
      { name: 'gender', label: 'Gender', type: 'string' },
      { name: 'department.name', label: 'Department', type: 'string' },
      { name: 'designation.title', label: 'Designation', type: 'string' },
      { name: 'location.name', label: 'Location', type: 'string' },
    ]
  },
  POLICY_ACKNOWLEDGEMENTS: {
    label: 'Policy Acknowledgements',
    fields: [
      { name: 'id', label: 'Ack ID', type: 'string' },
      { name: 'employee.firstName', label: 'First Name', type: 'string' },
      { name: 'employee.lastName', label: 'Last Name', type: 'string' },
      { name: 'employee.department.name', label: 'Department', type: 'string' },
      { name: 'policyVersion.policy.title', label: 'Policy Title', type: 'string' },
      { name: 'status', label: 'Status', type: 'string' }, // PENDING, ACKNOWLEDGED
      { name: 'acknowledgedAt', label: 'Acknowledged At', type: 'date' }
    ]
  },
  CHECKLISTS: {
    label: 'Employee Checklists',
    fields: [
      { name: 'id', label: 'Checklist ID', type: 'string' },
      { name: 'employee.firstName', label: 'First Name', type: 'string' },
      { name: 'employee.lastName', label: 'Last Name', type: 'string' },
      { name: 'type', label: 'Type (Onboarding/Offboarding)', type: 'string' },
      { name: 'status', label: 'Status', type: 'string' },
      { name: 'progress', label: 'Progress (%)', type: 'number' }
    ]
  },
  LEAVES: {
    label: 'Leave Applications',
    fields: [
      { name: 'id', label: 'Leave ID', type: 'string' },
      { name: 'employee.firstName', label: 'First Name', type: 'string' },
      { name: 'employee.lastName', label: 'Last Name', type: 'string' },
      { name: 'leaveType.name', label: 'Leave Type', type: 'string' },
      { name: 'status', label: 'Status', type: 'string' },
      { name: 'startDate', label: 'Start Date', type: 'date' },
      { name: 'endDate', label: 'End Date', type: 'date' },
      { name: 'totalDays', label: 'Total Days', type: 'number' },
      { name: 'reason', label: 'Reason', type: 'string' }
    ]
  },
  ATTENDANCE: {
    label: 'Attendance Records',
    fields: [
      { name: 'id', label: 'Attendance ID', type: 'string' },
      { name: 'employee.firstName', label: 'First Name', type: 'string' },
      { name: 'employee.lastName', label: 'Last Name', type: 'string' },
      { name: 'date', label: 'Date', type: 'date' },
      { name: 'status', label: 'Status', type: 'string' },
      { name: 'totalHours', label: 'Total Hours', type: 'number' }
    ]
  },
  ASSETS: {
    label: 'Asset Assignments',
    fields: [
      { name: 'id', label: 'Assignment ID', type: 'string' },
      { name: 'asset.name', label: 'Asset Name', type: 'string' },
      { name: 'asset.assetTag', label: 'Asset Tag', type: 'string' },
      { name: 'employee.firstName', label: 'First Name', type: 'string' },
      { name: 'employee.lastName', label: 'Last Name', type: 'string' },
      { name: 'status', label: 'Status', type: 'string' },
      { name: 'assignedAt', label: 'Assigned At', type: 'date' },
      { name: 'returnedAt', label: 'Returned At', type: 'date' }
    ]
  },
  PAYROLL: {
    label: 'Payroll Entries',
    fields: [
      { name: 'id', label: 'Entry ID', type: 'string' },
      { name: 'payrollRun.name', label: 'Run Name', type: 'string' },
      { name: 'employee.firstName', label: 'First Name', type: 'string' },
      { name: 'employee.lastName', label: 'Last Name', type: 'string' },
      { name: 'grossEarnings', label: 'Gross Earnings', type: 'number' },
      { name: 'totalDeductions', label: 'Total Deductions', type: 'number' },
      { name: 'netPay', label: 'Net Pay', type: 'number' },
      { name: 'workingDays', label: 'Working Days', type: 'number' },
      { name: 'lopDays', label: 'LOP Days', type: 'number' }
    ]
  },
  HELPDESK: {
    label: 'Helpdesk Tickets',
    fields: [
      { name: 'id', label: 'Ticket ID', type: 'string' },
      { name: 'subject', label: 'Subject', type: 'string' },
      { name: 'status', label: 'Status', type: 'string' },
      { name: 'priority', label: 'Priority', type: 'string' },
      { name: 'employee.firstName', label: 'Requester First Name', type: 'string' },
      { name: 'employee.lastName', label: 'Requester Last Name', type: 'string' },
      { name: 'assignedTo.firstName', label: 'Assignee First Name', type: 'string' },
      { name: 'createdAt', label: 'Created At', type: 'date' },
      { name: 'resolvedAt', label: 'Resolved At', type: 'date' }
    ]
  },
  RESIGNATIONS: {
    label: 'Resignations',
    fields: [
      { name: 'id', label: 'Resignation ID', type: 'string' },
      { name: 'employee.firstName', label: 'First Name', type: 'string' },
      { name: 'employee.lastName', label: 'Last Name', type: 'string' },
      { name: 'status', label: 'Status', type: 'string' },
      { name: 'reason', label: 'Reason', type: 'string' },
      { name: 'lastWorkingDay', label: 'Last Working Day', type: 'date' },
      { name: 'createdAt', label: 'Created At', type: 'date' }
    ]
  }
};

// Helper to resolve nested object values (e.g. "department.name")
function resolvePath(obj: any, path: string) {
  return path.split('.').reduce((prev, curr) => prev ? prev[curr] : null, obj);
}

export class ReportsService {
  static async getMeta() {
    return DATASETS;
  }

  static async executeQuery(tenantId: string, dataset: string, config: any) {
    let rawData: any[] = [];

    // 1. Fetch raw data based on dataset (including relations needed)
    switch (dataset) {
      case 'EMPLOYEES':
        rawData = await prisma.employee.findMany({
          where: { tenantId },
          include: { department: true, designation: true, location: true }
        });
        break;
      case 'POLICY_ACKNOWLEDGEMENTS':
        rawData = await prisma.policyAcknowledgement.findMany({
          where: { tenantId },
          include: {
            employee: { include: { department: true } },
            policyVersion: { include: { policy: true } }
          }
        });
        break;
      case 'CHECKLISTS':
        rawData = await prisma.employeeChecklist.findMany({
          where: { tenantId },
          include: {
            employee: true,
            tasks: true
          }
        });
        break;
      case 'LEAVES':
        rawData = await prisma.leaveApplication.findMany({
          where: { employee: { tenantId } },
          include: { employee: true, leaveType: true }
        });
        break;
      case 'ATTENDANCE':
        rawData = await prisma.attendanceRecord.findMany({
          where: { employee: { tenantId } },
          include: { employee: true }
        });
        break;
      case 'ASSETS':
        rawData = await prisma.assetAssignment.findMany({
          where: { employee: { tenantId } },
          include: { employee: true, asset: true }
        });
        break;
      case 'PAYROLL':
        rawData = await prisma.payrollEntry.findMany({
          where: { tenantId },
          include: { employee: true, payrollRun: true }
        });
        break;
      case 'HELPDESK':
        rawData = await prisma.helpdeskTicket.findMany({
          where: { tenantId },
          include: { employee: true, assignedTo: true }
        });
        break;
      case 'RESIGNATIONS':
        rawData = await prisma.resignation.findMany({
          where: { tenantId },
          include: { employee: true }
        });
        break;
      default:
        throw AppError.badRequest('Invalid dataset selected.');
    }

    // 2. Flatten and filter data
    let processed = rawData.map(item => {
      const flat: any = {};
      const fields = DATASETS[dataset as keyof typeof DATASETS]?.fields || [];
      for (const f of fields) {
        flat[f.name] = resolvePath(item, f.name);
      }
      
      // Custom computed fields
      if (dataset === 'CHECKLISTS' && item.tasks) {
        const total = item.tasks.length;
        const completed = item.tasks.filter((t: any) => t.status === 'COMPLETED').length;
        flat['progress'] = total > 0 ? Math.round((completed / total) * 100) : 0;
      }
      
      return flat;
    });

    // 3. Apply Filters (JS level, for simplicity with complex relations)
    if (config.filters && config.filters.length > 0) {
      processed = processed.filter(row => {
        return config.filters.every((f: any) => {
          const val = row[f.field];
          switch (f.operator) {
            case 'equals': return val === f.value;
            case 'notEquals': return val !== f.value;
            case 'contains': return String(val).toLowerCase().includes(String(f.value).toLowerCase());
            case 'gt': return val > f.value;
            case 'lt': return val < f.value;
            case 'gte': return val >= f.value;
            case 'lte': return val <= f.value;
            case 'in': return Array.isArray(f.value) && f.value.includes(val);
            case 'notIn': return Array.isArray(f.value) && !f.value.includes(val);
            default: return true;
          }
        });
      });
    }

    // 4. Grouping & Aggregation
    if (config.groupBys && config.groupBys.length > 0) {
      const groupField = config.groupBys[0]; // currently supporting 1 level of grouping for charts
      const grouped = processed.reduce((acc, row) => {
        const key = row[groupField] || 'Unknown';
        if (!acc[key]) {
          acc[key] = { [groupField]: key, _count: 0 };
        }
        acc[key]._count++;
        return acc;
      }, {} as Record<string, any>);
      
      processed = Object.values(grouped);
    }

    // 5. Sorting
    if (config.sortBys && config.sortBys.length > 0) {
      const { field, order } = config.sortBys[0];
      processed.sort((a, b) => {
        if (a[field] < b[field]) return order === 'asc' ? -1 : 1;
        if (a[field] > b[field]) return order === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // 6. Select only requested fields (if no grouping applied that overwrites structure)
    if (!config.groupBys || config.groupBys.length === 0) {
      if (config.fields && config.fields.length > 0) {
        processed = processed.map(row => {
          const out: any = {};
          config.fields.forEach((f: string) => out[f] = row[f]);
          return out;
        });
      }
    }

    return processed;
  }

  // CRUD for Saved Reports
  static async saveReport(tenantId: string, userId: string, data: any) {
    return prisma.savedReport.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
        dataset: data.dataset,
        config: data.config,
        isScheduled: data.isScheduled || false,
        cronSchedule: data.cronSchedule,
        emails: data.emails,
        createdBy: userId
      }
    });
  }

  static async getSavedReports(tenantId: string) {
    return prisma.savedReport.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getSavedReport(tenantId: string, id: string) {
    const report = await prisma.savedReport.findFirst({
      where: { id, tenantId }
    });
    if (!report) throw AppError.notFound('Report');
    return report;
  }

  static async updateSavedReport(tenantId: string, id: string, data: any) {
    const report = await this.getSavedReport(tenantId, id);
    return prisma.savedReport.update({
      where: { id: report.id },
      data: {
        name: data.name,
        description: data.description,
        dataset: data.dataset,
        config: data.config,
        isScheduled: data.isScheduled,
        cronSchedule: data.cronSchedule,
        emails: data.emails
      }
    });
  }

  static async deleteSavedReport(tenantId: string, id: string) {
    const report = await this.getSavedReport(tenantId, id);
    await prisma.savedReport.delete({ where: { id: report.id } });
    return { success: true };
  }
}

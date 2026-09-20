import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';

export const DEFAULT_MEETING_TYPES = [
  { name: '1-on-1',             color: '#3b82f6', icon: 'Users',         description: 'Private one-on-one check-in between manager and team member', isDefault: true  },
  { name: 'Team Sync',          color: '#10b981', icon: 'UsersRound',    description: 'Regular team stand-up or weekly sync meeting'                                   },
  { name: 'All Hands',          color: '#f59e0b', icon: 'Megaphone',     description: 'Company-wide all-hands or town hall meeting'                                    },
  { name: 'Interview',          color: '#8b5cf6', icon: 'ClipboardList', description: 'Candidate interview — technical, cultural, or HR round'                         },
  { name: 'Performance Review', color: '#ec4899', icon: 'BarChart2',     description: 'Quarterly or annual employee performance appraisal'                             },
  { name: 'Project Kickoff',    color: '#06b6d4', icon: 'Rocket',        description: 'Project initiation meeting to align scope, goals, and team'                     },
  { name: 'Sprint Planning',    color: '#6366f1', icon: 'CalendarDays',  description: 'Agile sprint planning session to assign tasks and set goals'                    },
  { name: 'Retrospective',      color: '#14b8a6', icon: 'RefreshCw',     description: 'End-of-sprint or project retrospective to discuss improvements'                 },
  { name: 'Client Call',        color: '#f97316', icon: 'PhoneCall',     description: 'External client or stakeholder meeting / status update'                         },
  { name: 'Training',           color: '#a855f7', icon: 'GraduationCap', description: 'Internal training session, workshop, or knowledge sharing'                      },
  { name: 'Board Meeting',      color: '#dc2626', icon: 'Briefcase',     description: 'Board of directors or executive leadership meeting'                              },
  { name: 'Workshop',           color: '#84cc16', icon: 'Wrench',        description: 'Collaborative working session or brainstorming workshop'                         },
];

export class MeetingTypesService {
  static async list(tenantId: string) {
    return prisma.meetingType.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' }
    });
  }

  static async create(tenantId: string, data: any) {
    return prisma.meetingType.create({
      data: { ...data, tenantId }
    });
  }

  static async update(tenantId: string, id: string, data: any) {
    const mt = await prisma.meetingType.findFirst({ where: { id, tenantId } });
    if (!mt) throw AppError.notFound('Meeting type not found');

    return prisma.meetingType.update({
      where: { id },
      data
    });
  }

  /**
   * Backfill default meeting types for an existing tenant.
   * Only creates types that don't already exist by name (idempotent).
   */
  static async seedDefaults(tenantId: string) {
    const existing = await prisma.meetingType.findMany({
      where: { tenantId },
      select: { name: true }
    });
    const existingNames = new Set(existing.map((t) => t.name));

    const toCreate = DEFAULT_MEETING_TYPES.filter((t) => !existingNames.has(t.name));

    if (toCreate.length === 0) return { created: 0, message: 'All default meeting types already exist' };

    await prisma.meetingType.createMany({
      data: toCreate.map((t) => ({ ...t, tenantId })),
    });

    return { created: toCreate.length, message: `Created ${toCreate.length} meeting type(s)` };
  }
}

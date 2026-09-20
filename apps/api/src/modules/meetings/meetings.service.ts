import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import { MeetingStatus } from '@prisma/client';

export class MeetingsService {
  static async list(tenantId: string, filters: any = {}) {
    const meetings = await prisma.meeting.findMany({
      where: { tenantId, ...filters },
      include: {
        meetingType: true,
        room: true,
        organizer: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        participants: {
          include: {
            employee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } }
          }
        }
      },
      orderBy: { startTime: 'asc' }
    });
    return meetings;
  }

  static async getById(tenantId: string, id: string) {
    const meeting = await prisma.meeting.findFirst({
      where: { id, tenantId },
      include: {
        meetingType: true,
        room: true,
        organizer: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        participants: {
          include: {
            employee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } }
          }
        },
        agendaItems: { orderBy: { order: 'asc' } },
        notes: true,
        decisions: true,
        actionItems: true,
        minutes: true,
        attachments: true
      }
    });
    if (!meeting) throw AppError.notFound('Meeting not found');
    return meeting;
  }

  static async create(tenantId: string, userId: string, data: any) {
    const organizer = await prisma.employee.findFirst({ where: { tenantId, userId } });
    if (!organizer) throw AppError.badRequest('Organizer employee record not found');

    const { participants, ...meetingData } = data;

    // Default organizer is participant
    const organizerParticipant = {
      employeeId: organizer.id,
      role: 'ORGANIZER',
      responseStatus: 'ACCEPTED'
    };

    const finalParticipants = [...(participants || [])];
    if (!finalParticipants.some(p => p.employeeId === organizer.id)) {
      finalParticipants.push(organizerParticipant);
    }

    const meeting = await prisma.meeting.create({
      data: {
        ...meetingData,
        tenantId,
        organizedById: organizer.id,
        participants: {
          create: finalParticipants
        }
      },
      include: {
        participants: true
      }
    });

    // Send invitations if not skipped
    // await NotificationService.createInAppNotification(...) // In real world we iterate participants

    return meeting;
  }

  static async update(tenantId: string, id: string, userId: string, data: any) {
    const meeting = await prisma.meeting.findFirst({ where: { id, tenantId } });
    if (!meeting) throw AppError.notFound('Meeting not found');
    
    const updated = await prisma.meeting.update({
      where: { id },
      data
    });
    return updated;
  }

  static async cancel(tenantId: string, id: string, userId: string, reason: string) {
    const meeting = await prisma.meeting.findFirst({ where: { id, tenantId } });
    if (!meeting) throw AppError.notFound('Meeting not found');

    const cancelled = await prisma.meeting.update({
      where: { id },
      data: {
        status: MeetingStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelReason: reason
      }
    });

    return cancelled;
  }
}

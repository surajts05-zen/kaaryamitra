import { prisma } from '../../lib/prisma.js';
import rruleModule from 'rrule';
const { rrulestr } = rruleModule;

export class AvailabilityService {
  /**
   * Find overlapping meetings for given participants within a time range.
   */
  static async checkCollisions(tenantId: string, participantIds: string[], startTime: Date, endTime: Date) {
    const overlapping = await prisma.meeting.findMany({
      where: {
        tenantId,
        status: { notIn: ['CANCELLED', 'CLOSED'] },
        OR: [
          { startTime: { lt: endTime }, endTime: { gt: startTime } },
        ],
        participants: {
          some: { employeeId: { in: participantIds } }
        }
      },
      include: {
        participants: {
          where: { employeeId: { in: participantIds } }
        }
      }
    });

    return overlapping;
  }

  static async checkRoomCollision(tenantId: string, roomId: string, startTime: Date, endTime: Date) {
    const overlapping = await prisma.meeting.findFirst({
      where: {
        tenantId,
        roomId,
        status: { notIn: ['CANCELLED', 'CLOSED'] },
        startTime: { lt: endTime },
        endTime: { gt: startTime }
      }
    });

    return overlapping !== null;
  }

  static async findMutualAvailability(tenantId: string, participantIds: string[], startDate: Date, endDate: Date, durationMin: number) {
    const busyMeetings = await prisma.meeting.findMany({
      where: {
        tenantId,
        status: { notIn: ['CANCELLED'] },
        startTime: { gte: startDate },
        endTime: { lte: endDate },
        participants: { some: { employeeId: { in: participantIds } } }
      }
    });

    const busySlots = busyMeetings.map(m => ({ start: m.startTime.getTime(), end: m.endTime.getTime() }));
    busySlots.sort((a, b) => a.start - b.start);

    const mergedBusy: Array<{start: number, end: number}> = [];
    if (busySlots.length > 0) {
      let current = busySlots[0]!;
      for (let i = 1; i < busySlots.length; i++) {
        const slot = busySlots[i]!;
        if (slot.start <= current.end) {
          current.end = Math.max(current.end, slot.end);
        } else {
          mergedBusy.push(current);
          current = slot;
        }
      }
      mergedBusy.push(current);
    }

    const freeSlots = [];
    let currentStart = startDate.getTime();
    const endWindow = endDate.getTime();
    const msDuration = durationMin * 60 * 1000;

    while (currentStart + msDuration <= endWindow) {
      const curDate = new Date(currentStart);
      const hour = curDate.getUTCHours();
      if (hour >= 9 && (hour + durationMin / 60) <= 17) {
        const overlaps = mergedBusy.some(b => currentStart < b.end && (currentStart + msDuration) > b.start);
        if (!overlaps) {
          freeSlots.push({
            start: new Date(currentStart),
            end: new Date(currentStart + msDuration)
          });
        }
      }
      currentStart += 30 * 60 * 1000;
    }

    return freeSlots;
  }

  static generateOccurrences(rruleString: string, startDate: Date, until: Date) {
    const rule = rrulestr(rruleString);
    return rule.between(startDate, until, true);
  }
}

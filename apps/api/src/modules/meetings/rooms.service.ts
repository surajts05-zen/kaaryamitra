import { MeetingRoom } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

export class RoomsService {
  async getRooms(tenantId: string): Promise<MeetingRoom[]> {
    return prisma.meetingRoom.findMany({
      where: {
        tenantId,
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async getRoomById(tenantId: string, roomId: string): Promise<MeetingRoom | null> {
    return prisma.meetingRoom.findFirst({
      where: {
        id: roomId,
        tenantId,
      },
    });
  }

  async createRoom(tenantId: string, data: any): Promise<MeetingRoom> {
    return prisma.meetingRoom.create({
      data: {
        tenantId,
        name: data.name,
        capacity: data.capacity,
        location: data.location,
        equipment: data.equipment || [],
        isActive: true,
      },
    });
  }

  async updateRoom(tenantId: string, roomId: string, data: any): Promise<MeetingRoom> {
    const existing = await prisma.meetingRoom.findFirst({ where: { id: roomId, tenantId } });
    if (!existing) throw new Error('Room not found');

    return prisma.meetingRoom.update({
      where: { id: roomId },
      data: {
        name: data.name !== undefined ? data.name : undefined,
        capacity: data.capacity !== undefined ? data.capacity : undefined,
        location: data.location !== undefined ? data.location : undefined,
        equipment: data.equipment !== undefined ? data.equipment : undefined,
        isActive: data.isActive !== undefined ? data.isActive : undefined,
      },
    });
  }

  async deleteRoom(tenantId: string, roomId: string): Promise<void> {
    const existing = await prisma.meetingRoom.findFirst({ where: { id: roomId, tenantId } });
    if (!existing) throw new Error('Room not found');

    await prisma.meetingRoom.delete({
      where: { id: roomId },
    });
  }
}

export const roomsService = new RoomsService();

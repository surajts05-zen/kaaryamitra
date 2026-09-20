import { Request, Response } from 'express';
import { roomsService } from './rooms.service.js';
import { z } from 'zod';

const createRoomSchema = z.object({
  name: z.string().min(1),
  capacity: z.number().min(1),
  location: z.string().optional(),
  equipment: z.array(z.string()).optional(),
});

const updateRoomSchema = createRoomSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export class RoomsController {
  async getRooms(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const rooms = await roomsService.getRooms(tenantId);
      res.json(rooms);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch meeting rooms' });
    }
  }

  async getRoomById(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params as { id: string };
      const room = await roomsService.getRoomById(tenantId, id);
      if (!room) return res.status(404).json({ error: 'Room not found' });
      res.json(room);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch meeting room' });
    }
  }

  async createRoom(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const data = createRoomSchema.parse(req.body);
      const room = await roomsService.createRoom(tenantId, data);
      res.status(201).json(room);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateRoom(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params as { id: string };
      const data = updateRoomSchema.parse(req.body);
      const room = await roomsService.updateRoom(tenantId, id, data);
      res.json(room);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteRoom(req: Request, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params as { id: string };
      await roomsService.deleteRoom(tenantId, id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete meeting room' });
    }
  }
}

export const roomsController = new RoomsController();

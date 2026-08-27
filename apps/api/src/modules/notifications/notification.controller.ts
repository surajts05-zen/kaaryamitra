import type { Request, Response } from 'express';
import {
  listNotifications,
  countUnread,
  markRead,
  markAllRead,
} from './notification.service.js';

export async function listNotificationsHandler(req: Request, res: Response) {
  const userId = req.auth!.userId;
  const [notifications, unreadCount] = await Promise.all([
    listNotifications(userId),
    countUnread(userId),
  ]);
  res.json({ success: true, data: { notifications, unreadCount } });
}

export async function markReadHandler(req: Request, res: Response) {
  const userId = req.auth!.userId;
  const id = req.params['id'] as string;
  await markRead(userId, id);
  res.json({ success: true, data: null });
}

export async function markAllReadHandler(req: Request, res: Response) {
  const userId = req.auth!.userId;
  await markAllRead(userId);
  res.json({ success: true, data: null });
}

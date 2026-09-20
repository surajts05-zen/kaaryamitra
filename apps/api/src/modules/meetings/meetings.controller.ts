import type { Request, Response } from 'express';
import { MeetingsService } from './meetings.service.js';
import { AvailabilityService } from './availability.service.js';
import { GoogleCalendarService } from './calendar.service.js';
import { meetingSchema, updateMeetingSchema, cancelMeetingSchema } from './meetings.schema.js';

export async function listHandler(req: Request, res: Response) {
  const data = await MeetingsService.list(req.tenantId!, req.query);
  res.status(200).json({ success: true, data });
}

export async function getHandler(req: Request, res: Response) {
  const data = await MeetingsService.getById(req.tenantId!, req.params.id as string);
  res.status(200).json({ success: true, data });
}

export async function createHandler(req: Request, res: Response) {
  const body = meetingSchema.parse(req.body);
  const data = await MeetingsService.create(req.tenantId!, req.auth!.userId, body);
  res.status(201).json({ success: true, data });
}

export async function updateHandler(req: Request, res: Response) {
  const body = updateMeetingSchema.parse(req.body);
  const data = await MeetingsService.update(req.tenantId!, req.params.id as string, req.auth!.userId, body);
  res.status(200).json({ success: true, data });
}

export async function cancelHandler(req: Request, res: Response) {
  const body = cancelMeetingSchema.parse(req.body);
  const data = await MeetingsService.cancel(req.tenantId!, req.params.id as string, req.auth!.userId, body.cancelReason);
  res.status(200).json({ success: true, data });
}

export async function getAvailabilityHandler(req: Request, res: Response) {
  const { participantIds, startDate, endDate, durationMin } = req.body;
  if (!participantIds || !Array.isArray(participantIds) || !startDate || !endDate) {
    return res.status(400).json({ success: false, error: { message: 'Missing required fields' } });
  }
  const slots = await AvailabilityService.findMutualAvailability(
    req.tenantId!, 
    participantIds, 
    new Date(startDate as string), 
    new Date(endDate as string), 
    durationMin ? Number(durationMin) : 30
  );
  res.status(200).json({ success: true, data: slots });
}

export async function getGoogleAuthUrlHandler(req: Request, res: Response) {
  const url = GoogleCalendarService.getAuthUrl(req.tenantId!, req.auth!.userId);
  res.status(200).json({ success: true, data: { url } });
}

export async function googleAuthCallbackHandler(req: Request, res: Response) {
  const { code, state } = req.query;
  if (!code || !state) {
    return res.status(400).json({ success: false, error: { message: 'Missing code or state' } });
  }
  await GoogleCalendarService.handleCallback(code as string, state as string);
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  res.redirect(`${frontendUrl}/meetings?calendar_connected=true`);
}

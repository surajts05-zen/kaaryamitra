import { z } from 'zod';
import { MeetingStatus, MeetingVisibility, ParticipantRole, InviteResponse } from '@prisma/client';

export const meetingParticipantSchema = z.object({
  employeeId: z.string().optional(),
  externalEmail: z.string().email().optional(),
  externalName: z.string().optional(),
  role: z.nativeEnum(ParticipantRole).default(ParticipantRole.REQUIRED),
}).refine(data => data.employeeId || data.externalEmail, {
  message: "Either employeeId or externalEmail must be provided",
});

export const meetingSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  meetingTypeId: z.string().min(1, 'Meeting type is required'),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  timezone: z.string().default('UTC'),
  location: z.string().optional(),
  meetingLink: z.string().url().optional(),
  visibility: z.nativeEnum(MeetingVisibility).default(MeetingVisibility.ALL_PARTICIPANTS),
  isRecurring: z.boolean().default(false),
  recurrenceRule: z.record(z.any()).optional(),
  projectId: z.string().optional(),
  departmentId: z.string().optional(),
  employeeId: z.string().optional(),
  roomId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  participants: z.array(meetingParticipantSchema).default([]),
});

export const updateMeetingSchema = meetingSchema.partial().extend({
  status: z.nativeEnum(MeetingStatus).optional(),
  agendaContent: z.string().optional(),
  momContent: z.string().optional(),
  notesContent: z.string().optional(),
});

export const meetingAgendaItemSchema = z.object({
  order: z.number().int().min(0),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  presenterId: z.string().optional(),
  durationMin: z.number().int().min(1).optional(),
});

export const cancelMeetingSchema = z.object({
  cancelReason: z.string().min(1, 'Cancellation reason is required'),
});

export const meetingNoteSchema = z.object({
  content: z.record(z.any()),
  visibility: z.enum(['SHARED', 'ORGANIZER_ONLY', 'PRIVATE', 'HR_CONFIDENTIAL']).default('SHARED'),
  agendaItemId: z.string().optional(),
});

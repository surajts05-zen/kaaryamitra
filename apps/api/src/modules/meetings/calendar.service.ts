import { google } from 'googleapis';
import { prisma } from '../../lib/prisma.js';
import crypto from 'node:crypto';
import { env } from '../../config/env.js';

export class GoogleCalendarService {
  private static get calendarCallbackUrl() {
    return (
      process.env.GOOGLE_CALENDAR_CALLBACK_URL ||
      'http://localhost:3000/api/v1/meetings/calendar/callback'
    );
  }

  private static get oauth2Client() {
    return new google.auth.OAuth2(
      env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET,
      this.calendarCallbackUrl
    );
  }

  private static ENCRYPTION_KEY = crypto.scryptSync(env.COOKIE_SECRET, 'salt', 32);

  private static encryptTokens(tokens: any) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.ENCRYPTION_KEY, iv);
    const encrypted = Buffer.concat([cipher.update(JSON.stringify(tokens), 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return {
      iv: iv.toString('hex'),
      data: encrypted.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  private static decryptTokens(encrypted: any) {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      this.ENCRYPTION_KEY,
      Buffer.from(encrypted.iv, 'hex')
    );
    decipher.setAuthTag(Buffer.from(encrypted.authTag, 'hex'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encrypted.data, 'hex')),
      decipher.final()
    ]);
    return JSON.parse(decrypted.toString('utf8'));
  }

  static getAuthUrl(tenantId: string, userId: string) {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar.events', 'https://www.googleapis.com/auth/userinfo.email'],
      state: Buffer.from(JSON.stringify({ tenantId, userId })).toString('base64'),
      prompt: 'consent'
    });
  }

  static async handleCallback(code: string, stateBase64: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);
    
    const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const email = userInfo.data.email;

    const { tenantId, userId } = JSON.parse(Buffer.from(stateBase64, 'base64').toString('ascii'));

    if (!email) throw new Error('Email not found in Google profile');

    const encryptedTokens = this.encryptTokens(tokens);

    await prisma.calendarConnection.upsert({
      where: {
        id: 'google-' + userId, // temp composite key alternative
      },
      create: {
        tenantId,
        userId,
        provider: 'google',
        email,
        scopes: ['calendar.events'],
        encryptedTokens: encryptedTokens as any
      },
      update: {
        encryptedTokens: encryptedTokens as any,
        email,
        isActive: true,
        revokedAt: null
      }
    });

    return { tenantId, email };
  }

  static async syncMeetingToGoogle(tenantId: string, meetingId: string) {
    const meeting = await prisma.meeting.findFirst({
      where: { id: meetingId, tenantId },
      include: {
        organizer: true,
        participants: { include: { employee: true } }
      }
    });

    if (!meeting) return;

    // Find if the organizer has a connected calendar
    const conn = await prisma.calendarConnection.findFirst({
      where: { tenantId, userId: meeting.organizer.userId, provider: 'google', isActive: true }
    });

    if (!conn) return;

    const tokens = this.decryptTokens(conn.encryptedTokens);
    const client = new google.auth.OAuth2();
    client.setCredentials(tokens);

    const calendar = google.calendar({ version: 'v3', auth: client });

    const attendees = meeting.participants.map(p => ({
      email: p.employee?.workEmail || p.externalEmail || ''
    })).filter(a => a.email);

    const event = {
      summary: meeting.title,
      description: meeting.description || '',
      start: {
        dateTime: meeting.startTime.toISOString(),
        timeZone: meeting.timezone,
      },
      end: {
        dateTime: meeting.endTime.toISOString(),
        timeZone: meeting.timezone,
      },
      attendees,
    };

    const mapping = await prisma.calendarEventMapping.findFirst({
      where: { meetingId, connectionId: conn.id }
    });

    if (mapping) {
      await calendar.events.update({
        calendarId: 'primary',
        eventId: mapping.externalEventId,
        requestBody: event
      });
    } else {
      const res = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event
      });

      if (res.data.id) {
        await prisma.calendarEventMapping.create({
          data: {
            meetingId,
            connectionId: conn.id,
            externalEventId: res.data.id,
            externalCalendarId: 'primary'
          }
        });
      }
    }
  }
}

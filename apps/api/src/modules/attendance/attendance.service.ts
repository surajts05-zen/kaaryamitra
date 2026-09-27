import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import { differenceInMinutes, startOfDay, endOfDay } from 'date-fns';
import { startWorkflow } from '../workflows/workflow.service.js';
import {
  getEmployeeShiftForDate,
  checkNetworkTrust,
  validatePunchWindow,
  validatePunchOutTiming,
  calculateWorkMetrics,
  dateToMinutesSinceMidnight,
} from './attendance-shift.service.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function getCompanySettings(tenantId: string) {
  const settings = await prisma.companySettings.findUnique({ where: { tenantId } });
  if (!settings) throw AppError.internal('Company settings not found');
  return settings;
}

function extractClientIp(ipString?: string): string {
  if (!ipString) return '0.0.0.0';
  // Handle comma-separated IPs from X-Forwarded-For
  return ipString.split(',')[0]?.trim() ?? '0.0.0.0';
}

// ─────────────────────────────────────────────────────────────────────────────
// PUNCH IN
// ─────────────────────────────────────────────────────────────────────────────

export interface PunchInData {
  ipAddress?: string;
  latitude?: number;
  longitude?: number;
  locationAccuracy?: number;
  clientTimestamp?: string;
  channel?: string;
  deviceId?: string;
  platform?: string;
  transactionId?: string;
}

export async function checkIn(tenantId: string, employeeId: string, data: PunchInData) {
  const settings = await getCompanySettings(tenantId);

  if (!settings.isAttendanceEnabled) {
    throw AppError.badRequest('Attendance tracking is disabled for this organization');
  }

  // Server timestamp is authoritative
  const serverNow = new Date();
  const today = startOfDay(serverNow);

  // ── Idempotency: prevent duplicate on retry ─────────────────────────────
  if (data.transactionId) {
    const existing = await prisma.attendanceRecord.findFirst({
      where: { tenantId, punchInTransactionId: data.transactionId },
    });
    if (existing) return existing; // Already processed — return same result
  }

  // ── Prevent duplicate punch-in ──────────────────────────────────────────
  const existingRecord = await prisma.attendanceRecord.findUnique({
    where: { tenantId_employeeId_date: { tenantId, employeeId, date: today } },
  });

  if (existingRecord?.punchInTime) {
    throw AppError.badRequest('Already checked in for today');
  }

  // ── Resolve shift ───────────────────────────────────────────────────────
  const shift = await getEmployeeShiftForDate(employeeId, serverNow);

  // ── Validate punch window (if shift exists) ─────────────────────────────
  const exceptions: string[] = [];
  let isLate = false;
  let lateMinutes = 0;
  let trustLevel = 'VERIFIED';

  if (shift) {
    const punchMinutes = dateToMinutesSinceMidnight(serverNow);
    const punchWindow = validatePunchWindow(
      shift,
      punchMinutes,
      settings.attendancePunchWindowBefore,
      settings.attendancePunchWindowAfter
    );

    if (punchWindow.isEarlyPunch) {
      exceptions.push('EARLY_PUNCH');
      trustLevel = 'FLAGGED';
    }
    if (punchWindow.isLatePunch) {
      exceptions.push('LATE_PUNCH');
    }
    if (punchWindow.isLate) {
      isLate = true;
      lateMinutes = punchWindow.minutesLate;
    }
  } else {
    // No shift assigned — check against company-wide work hours
    const [startHour, startMin] = settings.workHoursStart.split(':').map(Number);
    const expectedStart = new Date(serverNow);
    expectedStart.setHours(startHour ?? 9, startMin ?? 0, 0, 0);
    const gracePeriodEnd = new Date(expectedStart.getTime() + (15 * 60 * 1000)); // 15 min grace default
    if (serverNow > gracePeriodEnd) {
      isLate = true;
      lateMinutes = Math.floor((serverNow.getTime() - expectedStart.getTime()) / 60000);
    }
  }

  // ── Network trust check ─────────────────────────────────────────────────
  const clientIp = extractClientIp(data.ipAddress);
  let networkStatus = 'NO_POLICY';

  if (settings.attendanceTrustedNetworkEnabled && clientIp !== '0.0.0.0') {
    const networkTrust = await checkNetworkTrust(tenantId, clientIp);
    networkStatus = networkTrust;

    if (networkTrust === 'UNTRUSTED') {
      if (settings.attendanceTrustedNetworkPolicy === 'REQUIRE') {
        throw AppError.badRequest(
          'Attendance from an untrusted network is not permitted by your organization policy'
        );
      }
      if (settings.attendanceTrustedNetworkPolicy === 'WARN') {
        exceptions.push('OUTSIDE_TRUSTED_NETWORK');
        if (trustLevel === 'VERIFIED') trustLevel = 'ACCEPTED';
      }
    }
  }

  // ── Client time discrepancy detection ──────────────────────────────────
  if (data.clientTimestamp) {
    const clientTime = new Date(data.clientTimestamp);
    const diffMinutes = Math.abs(differenceInMinutes(serverNow, clientTime));
    if (diffMinutes > 10) {
      exceptions.push('CLIENT_SERVER_TIME_MISMATCH');
      if (trustLevel === 'VERIFIED') trustLevel = 'ACCEPTED';
    }
  }

  // ── Geolocation enforcement (legacy) ───────────────────────────────────
  if (settings.isGeolocationEnforced && (!data.latitude || !data.longitude)) {
    throw AppError.badRequest('Geolocation is required to punch in');
  }

  // ── Determine overall trust level ──────────────────────────────────────
  if (exceptions.length > 0 && trustLevel === 'VERIFIED') {
    trustLevel = 'ACCEPTED';
  }

  // ── Determine channel ──────────────────────────────────────────────────
  const channel = (data.channel === 'MOBILE' ? 'MOBILE' : 'DESKTOP') as any;

  // ── Create or update attendance record ─────────────────────────────────
  const recordData = {
    punchInTime: serverNow,
    punchInServerTime: serverNow,
    punchInClientTime: data.clientTimestamp ? new Date(data.clientTimestamp) : null,
    punchInIp: clientIp,
    punchInLat: data.latitude ?? null,
    punchInLon: data.longitude ?? null,
    punchInLocationAccuracy: data.locationAccuracy ?? null,
    punchInChannel: channel,
    punchInDeviceId: data.deviceId ?? null,
    punchInPlatform: data.platform ?? null,
    punchInNetworkStatus: networkStatus,
    punchInTransactionId: data.transactionId ?? null,
    punchInTrustLevel: trustLevel as any,
    shiftId: shift?.shiftId ?? null,
    isLate,
    lateMinutes,
    exceptions: exceptions.length > 0 ? exceptions : undefined,
    overallTrustLevel: trustLevel as any,
    status: 'PRESENT' as any,
  };

  let record;
  if (existingRecord) {
    record = await prisma.attendanceRecord.update({
      where: { id: existingRecord.id },
      data: recordData as any,
      include: { shift: true, breaks: true },
    });
  } else {
    record = await prisma.attendanceRecord.create({
      data: {
        tenantId,
        employeeId,
        date: today,
        ...recordData,
      } as any,
      include: { shift: true, breaks: true },
    });
  }

  return {
    ...record,
    _meta: {
      shift: shift ? { name: shift.name, startTime: shift.startTime, endTime: shift.endTime } : null,
      networkStatus,
      trustLevel,
      exceptions,
      isLate,
      lateMinutes,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PUNCH OUT
// ─────────────────────────────────────────────────────────────────────────────

export interface PunchOutData {
  ipAddress?: string;
  latitude?: number;
  longitude?: number;
  locationAccuracy?: number;
  clientTimestamp?: string;
  channel?: string;
  deviceId?: string;
  platform?: string;
  transactionId?: string;
  reason?: string; // for early departure
}

export async function checkOut(tenantId: string, employeeId: string, data: PunchOutData) {
  const settings = await getCompanySettings(tenantId);

  if (!settings.isAttendanceEnabled) {
    throw AppError.badRequest('Attendance tracking is disabled for this organization');
  }

  const serverNow = new Date();
  const today = startOfDay(serverNow);

  // ── Idempotency ─────────────────────────────────────────────────────────
  if (data.transactionId) {
    const existing = await prisma.attendanceRecord.findFirst({
      where: { tenantId, punchOutTransactionId: data.transactionId },
    });
    if (existing) return existing;
  }

  const record = await prisma.attendanceRecord.findUnique({
    where: { tenantId_employeeId_date: { tenantId, employeeId, date: today } },
    include: { breaks: true, shift: true },
  });

  if (!record || !record.punchInTime) {
    throw AppError.badRequest('Must punch in before punching out');
  }

  if (record.punchOutTime) {
    throw AppError.badRequest('Already punched out for today');
  }

  const activeBreak = record.breaks.find((b: any) => !b.endAt);
  if (activeBreak) {
    throw AppError.badRequest('Cannot punch out while on a break. End your break first.');
  }

  const exceptions: string[] = [...((record.exceptions as string[]) ?? [])];
  let isEarlyExit = false;
  let earlyExitMinutes = 0;

  // ── Shift-based early departure check ──────────────────────────────────
  if (record.shift) {
    const shiftCtx = {
      shiftId: record.shiftId!,
      name: record.shift.name,
      startTime: record.shift.startTime,
      endTime: record.shift.endTime,
      gracePeriodMinutes: record.shift.gracePeriodMinutes,
      startMinutes: 0,
      endMinutes: 0,
    };
    // Recalculate minutes
    const [sh, sm] = record.shift.startTime.split(':').map(Number);
    const [eh, em] = record.shift.endTime.split(':').map(Number);
    shiftCtx.startMinutes = (sh ?? 0) * 60 + (sm ?? 0);
    shiftCtx.endMinutes = (eh ?? 0) * 60 + (em ?? 0);

    const punchOutMinutes = dateToMinutesSinceMidnight(serverNow);
    const earlyCheck = validatePunchOutTiming(shiftCtx, punchOutMinutes, settings.attendanceEarlyDepartureGrace);
    isEarlyExit = earlyCheck.isEarlyDeparture;
    earlyExitMinutes = earlyCheck.earlyExitMinutes;
    if (isEarlyExit) exceptions.push('EARLY_DEPARTURE');
  } else {
    // Fallback: use company work hours
    const [eh, em] = settings.workHoursEnd.split(':').map(Number);
    const expectedEnd = new Date(serverNow);
    expectedEnd.setHours(eh ?? 18, em ?? 0, 0, 0);
    isEarlyExit = serverNow < expectedEnd;
    earlyExitMinutes = isEarlyExit ? Math.floor((expectedEnd.getTime() - serverNow.getTime()) / 60000) : 0;
  }

  // ── Network trust ───────────────────────────────────────────────────────
  const clientIp = extractClientIp(data.ipAddress);
  let networkStatus = 'NO_POLICY';
  if (settings.attendanceTrustedNetworkEnabled && clientIp !== '0.0.0.0') {
    const trust = await checkNetworkTrust(tenantId, clientIp);
    networkStatus = trust;
    if (trust === 'UNTRUSTED') {
      if (settings.attendanceTrustedNetworkPolicy === 'REQUIRE') {
        throw AppError.badRequest('Punch out from untrusted network not permitted');
      }
      exceptions.push('OUTSIDE_TRUSTED_NETWORK');
    }
  }

  // ── Geolocation enforcement ─────────────────────────────────────────────
  if (settings.isGeolocationEnforced && (!data.latitude || !data.longitude)) {
    throw AppError.badRequest('Geolocation is required to punch out');
  }

  // ── Calculate work metrics ──────────────────────────────────────────────
  const metrics = calculateWorkMetrics(
    record.punchInTime!,
    serverNow,
    record.totalBreakMinutes,
    settings.attendanceMinWorkingHours,
    settings.attendanceOvertimeEnabled
  );

  const channel = (data.channel === 'MOBILE' ? 'MOBILE' : 'DESKTOP') as any;

  const updated = await prisma.attendanceRecord.update({
    where: { id: record.id },
    data: {
      punchOutTime: serverNow,
      punchOutServerTime: serverNow,
      punchOutClientTime: data.clientTimestamp ? new Date(data.clientTimestamp) : null,
      punchOutIp: clientIp,
      punchOutLat: data.latitude ?? null,
      punchOutLon: data.longitude ?? null,
      punchOutLocationAccuracy: data.locationAccuracy ?? null,
      punchOutChannel: channel,
      punchOutDeviceId: data.deviceId ?? null,
      punchOutPlatform: data.platform ?? null,
      punchOutNetworkStatus: networkStatus,
      punchOutTransactionId: data.transactionId ?? null,
      punchOutTrustLevel: (exceptions.length > 0 ? 'ACCEPTED' : 'VERIFIED') as any,
      totalMinutes: metrics.totalMinutes,
      regularMinutes: metrics.regularMinutes,
      overtimeMinutes: metrics.overtimeMinutes,
      isEarlyExit,
      earlyExitMinutes,
      isOvertime: metrics.isOvertime,
      exceptions: exceptions.length > 0 ? exceptions : undefined,
      overallTrustLevel: (exceptions.length > 0 ? 'ACCEPTED' : 'VERIFIED') as any,
    } as any,
    include: { shift: true, breaks: true },
  });

  return {
    ...updated,
    _meta: {
      networkStatus,
      exceptions,
      isEarlyExit,
      earlyExitMinutes,
      metrics,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// BREAK MANAGEMENT (unchanged from original, preserved)
// ─────────────────────────────────────────────────────────────────────────────

export async function startBreak(tenantId: string, employeeId: string, type: string = 'BREAK') {
  const today = startOfDay(new Date());
  const record = await prisma.attendanceRecord.findUnique({
    where: { tenantId_employeeId_date: { tenantId, employeeId, date: today } },
    include: { breaks: true },
  });

  if (!record || !record.punchInTime || record.punchOutTime) {
    throw AppError.badRequest('Must be actively checked in to start a break');
  }

  const activeBreak = record.breaks.find((b: any) => !b.endAt);
  if (activeBreak) {
    throw AppError.badRequest('You are already on a break');
  }

  return prisma.attendanceBreak.create({
    data: {
      attendanceRecordId: record.id,
      startAt: new Date(),
      type,
    },
  });
}

export async function endBreak(tenantId: string, employeeId: string) {
  const today = startOfDay(new Date());
  const record = await prisma.attendanceRecord.findUnique({
    where: { tenantId_employeeId_date: { tenantId, employeeId, date: today } },
    include: { breaks: true },
  });

  if (!record) {
    throw AppError.badRequest('No attendance record found for today');
  }

  const activeBreak = record.breaks.find((b: any) => !b.endAt);
  if (!activeBreak) {
    throw AppError.badRequest('You are not currently on a break');
  }

  const endAt = new Date();
  const durationMinutes = differenceInMinutes(endAt, activeBreak.startAt);

  const updatedBreak = await prisma.attendanceBreak.update({
    where: { id: activeBreak.id },
    data: { endAt, durationMinutes },
  });

  await prisma.attendanceRecord.update({
    where: { id: record.id },
    data: { totalBreakMinutes: { increment: durationMinutes } },
  });

  return updatedBreak;
}

// ─────────────────────────────────────────────────────────────────────────────
// MY ATTENDANCE QUERY
// ─────────────────────────────────────────────────────────────────────────────

export async function getMyAttendance(tenantId: string, employeeId: string, dateStr?: string) {
  let startDate, endDate;

  if (dateStr) {
    startDate = startOfDay(new Date(dateStr));
    endDate = endOfDay(new Date(dateStr));
  } else {
    const now = new Date();
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  const records = await prisma.attendanceRecord.findMany({
    where: {
      tenantId,
      employeeId,
      date: { gte: startDate, lte: endDate },
    },
    include: {
      breaks: true,
      corrections: true,
      shift: { select: { name: true, startTime: true, endTime: true } },
    },
    orderBy: { date: 'desc' },
  });

  // Compute summary stats
  const stats = {
    presentDays: records.filter((r: any) => r.punchInTime && r.punchOutTime).length,
    lateDays: records.filter((r: any) => r.isLate).length,
    absentDays: records.filter((r: any) => r.status === 'ABSENT').length,
    totalHours: records.reduce((sum: number, r: any) => sum + (r.totalMinutes ?? 0), 0) / 60,
    missingPunchDays: records.filter((r: any) => r.punchInTime && !r.punchOutTime).length,
  };

  return { records, stats };
}

// ─────────────────────────────────────────────────────────────────────────────
// TODAY'S STATUS (for widget)
// ─────────────────────────────────────────────────────────────────────────────

export async function getTodayStatus(tenantId: string, employeeId: string) {
  const today = startOfDay(new Date());

  const record = await prisma.attendanceRecord.findUnique({
    where: { tenantId_employeeId_date: { tenantId, employeeId, date: today } },
    include: {
      breaks: true,
      shift: { select: { id: true, name: true, startTime: true, endTime: true, gracePeriodMinutes: true } },
    },
  });

  // Resolve current shift even if no record
  const shift = record?.shift ?? await getEmployeeShiftForDate(employeeId, today).then(s =>
    s ? { id: s.shiftId, name: s.name, startTime: s.startTime, endTime: s.endTime, gracePeriodMinutes: s.gracePeriodMinutes } : null
  );

  return {
    record,
    shift,
    serverTime: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: GET ATTENDANCE RECORDS
// ─────────────────────────────────────────────────────────────────────────────

export async function getAttendanceRecords(
  tenantId: string,
  filters: {
    date?: string;
    startDate?: string;
    endDate?: string;
    employeeId?: string;
    status?: string;
    isLate?: boolean;
    page?: number;
    pageSize?: number;
  }
) {
  const page = filters.page ?? 1;
  const pageSize = Math.min(filters.pageSize ?? 50, 200);
  const skip = (page - 1) * pageSize;

  let dateFilter: any = {};
  if (filters.date) {
    const d = startOfDay(new Date(filters.date));
    dateFilter = { gte: d, lte: endOfDay(d) };
  } else if (filters.startDate || filters.endDate) {
    if (filters.startDate) dateFilter.gte = startOfDay(new Date(filters.startDate));
    if (filters.endDate) dateFilter.lte = endOfDay(new Date(filters.endDate));
  } else {
    // Default to today
    const now = new Date();
    dateFilter = { gte: startOfDay(now), lte: endOfDay(now) };
  }

  const where: any = {
    tenantId,
    date: dateFilter,
    ...(filters.employeeId && { employeeId: filters.employeeId }),
    ...(filters.status && { status: filters.status }),
    ...(filters.isLate !== undefined && { isLate: filters.isLate }),
  };

  const [records, total] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            workEmail: true,
            employeeCode: true,
            department: { select: { name: true } },
          },
        },
        shift: { select: { name: true, startTime: true, endTime: true } },
        breaks: true,
        corrections: { where: { status: 'PENDING' }, select: { id: true, status: true } },
      },
      orderBy: [{ date: 'desc' }, { employee: { firstName: 'asc' } }],
      skip,
      take: pageSize,
    }),
    prisma.attendanceRecord.count({ where }),
  ]);

  return { records, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: TODAY'S ATTENDANCE OVERVIEW
// ─────────────────────────────────────────────────────────────────────────────

export async function getTodayOverview(tenantId: string) {
  const today = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const [totalEmployees, records] = await Promise.all([
    prisma.employee.count({
      where: { tenantId, employmentStatus: { not: 'OFFBOARDED' } },
    }),
    prisma.attendanceRecord.findMany({
      where: { tenantId, date: { gte: today, lte: todayEnd } },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            workEmail: true,
            employeeCode: true,
            avatarUrl: true,
          },
        },
        breaks: true,
      },
    }),
  ]);

  const presentRecords = records.filter((r: any) => r.punchInTime);
  const punchedOut = records.filter((r: any) => r.punchOutTime);
  const lateRecords = records.filter((r: any) => r.isLate && r.punchInTime);
  const onBreak = records.filter((r: any) => r.breaks?.some((b: any) => !b.endAt));
  const absent = totalEmployees - presentRecords.length;

  return {
    date: today.toISOString(),
    totalEmployees,
    present: presentRecords.length,
    absent: Math.max(0, absent),
    late: lateRecords.length,
    onBreak: onBreak.length,
    checkedOut: punchedOut.length,
    currentlyIn: presentRecords.length - punchedOut.length,
    records: records.slice(0, 100), // limit for overview
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: CORRECTIONS (PENDING)
// ─────────────────────────────────────────────────────────────────────────────

export async function getPendingCorrections(tenantId: string) {
  return prisma.attendanceCorrection.findMany({
    where: {
      status: 'PENDING',
      record: { tenantId },
    },
    include: {
      record: {
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              workEmail: true,
              employeeCode: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function approveCorrection(
  tenantId: string,
  correctionId: string,
  approverId: string,
  comment?: string
) {
  const correction = await prisma.attendanceCorrection.findUnique({
    where: { id: correctionId },
    include: { record: true },
  });

  if (!correction || correction.record.tenantId !== tenantId) {
    throw AppError.notFound('Correction request not found');
  }

  if (correction.status !== 'PENDING') {
    throw AppError.badRequest('Correction is not in pending state');
  }

  // Apply the correction to the attendance record
  const updateData: any = {};
  if (correction.requestedCheckIn) {
    updateData.punchInTime = correction.requestedCheckIn;
    updateData.punchInServerTime = correction.requestedCheckIn;
  }
  if (correction.requestedCheckOut) {
    updateData.punchOutTime = correction.requestedCheckOut;
    updateData.punchOutServerTime = correction.requestedCheckOut;
  }

  // Recalculate totalMinutes if both times are set
  if (correction.requestedCheckIn && correction.requestedCheckOut) {
    const diff = differenceInMinutes(
      new Date(correction.requestedCheckOut),
      new Date(correction.requestedCheckIn)
    );
    updateData.totalMinutes = Math.max(0, diff - correction.record.totalBreakMinutes);
    updateData.status = 'PRESENT';
    updateData.isMissingPunch = false;
  }

  // Mark as manual correction
  const existingExceptions: string[] = (correction.record.exceptions as string[]) ?? [];
  if (!existingExceptions.includes('MANUAL_CORRECTION')) {
    updateData.exceptions = [...existingExceptions, 'MANUAL_CORRECTION'];
  }

  await prisma.$transaction([
    prisma.attendanceRecord.update({
      where: { id: correction.attendanceRecordId },
      data: updateData,
    }),
    prisma.attendanceCorrection.update({
      where: { id: correctionId },
      data: {
        status: 'APPROVED',
      },
    }),
  ]);

  return { success: true };
}

export async function rejectCorrection(
  tenantId: string,
  correctionId: string,
  rejectorId: string,
  comment?: string
) {
  const correction = await prisma.attendanceCorrection.findUnique({
    where: { id: correctionId },
    include: { record: true },
  });

  if (!correction || correction.record.tenantId !== tenantId) {
    throw AppError.notFound('Correction request not found');
  }

  if (correction.status !== 'PENDING') {
    throw AppError.badRequest('Correction is not in pending state');
  }

  await prisma.attendanceCorrection.update({
    where: { id: correctionId },
    data: { status: 'REJECTED' },
  });

  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// REGULARIZATION REQUEST (ESS)
// ─────────────────────────────────────────────────────────────────────────────

export async function requestRegularization(
  tenantId: string,
  employeeId: string,
  userId: string,
  data: { date: string; requestedCheckIn?: string; requestedCheckOut?: string; reason: string }
) {
  const targetDate = startOfDay(new Date(data.date));

  let record = await prisma.attendanceRecord.findUnique({
    where: { tenantId_employeeId_date: { tenantId, employeeId, date: targetDate } },
  });

  if (!record) {
    record = await prisma.attendanceRecord.create({
      data: {
        tenantId,
        employeeId,
        date: targetDate,
        status: 'ABSENT',
        isMissingPunch: true,
      },
    });
  }

  const existingPending = await prisma.attendanceCorrection.findFirst({
    where: { attendanceRecordId: record.id, status: 'PENDING' },
  });

  if (existingPending) {
    throw AppError.badRequest('There is already a pending regularization request for this date');
  }

  const correction = await prisma.attendanceCorrection.create({
    data: {
      attendanceRecordId: record.id,
      requestedCheckIn: data.requestedCheckIn ? new Date(data.requestedCheckIn) : null,
      requestedCheckOut: data.requestedCheckOut ? new Date(data.requestedCheckOut) : null,
      reason: data.reason,
      status: 'PENDING',
    },
  });

  try {
    const workflowId = await startWorkflow(tenantId, 'ATTENDANCE_REGULARIZATION', 'AttendanceCorrection', correction.id);
    if (workflowId) {
      await prisma.attendanceCorrection.update({
        where: { id: correction.id },
        data: { workflowInstanceId: workflowId },
      });
    }
  } catch (error) {
    // Non-fatal: correction still exists even without workflow
  }

  return correction;
}

// ─────────────────────────────────────────────────────────────────────────────
// BULK CREATE (Admin CSV import)
// ─────────────────────────────────────────────────────────────────────────────

export async function bulkCreateAttendanceRecords(
  tenantId: string,
  items: Array<{ workEmail: string; date: string; punchInTime?: string; punchOutTime?: string; status?: string }>
) {
  const created: any[] = [];

  for (const item of items) {
    if (!item.workEmail || !item.date) continue;
    try {
      const emp = await prisma.employee.findFirst({
        where: { tenantId, workEmail: item.workEmail.trim().toLowerCase() },
      });
      if (!emp) continue;

      const dateObj = startOfDay(new Date(item.date));
      if (isNaN(dateObj.getTime())) continue;

      let punchIn: Date | null = null;
      let punchOut: Date | null = null;

      if (item.punchInTime) {
        const [h, m] = item.punchInTime.split(':').map(Number);
        punchIn = new Date(dateObj);
        punchIn.setHours(h || 9, m || 0, 0, 0);
      }
      if (item.punchOutTime) {
        const [h, m] = item.punchOutTime.split(':').map(Number);
        punchOut = new Date(dateObj);
        punchOut.setHours(h || 18, m || 0, 0, 0);
      }

      const totalMinutes = punchIn && punchOut ? Math.max(0, differenceInMinutes(punchOut, punchIn)) : null;

      const record = await prisma.attendanceRecord.upsert({
        where: { tenantId_employeeId_date: { tenantId, employeeId: emp.id, date: dateObj } },
        create: {
          tenantId,
          employeeId: emp.id,
          date: dateObj,
          punchInTime: punchIn,
          punchOutTime: punchOut,
          totalMinutes,
          status: (item.status ? item.status.toUpperCase() : 'PRESENT') as any,
        },
        update: {
          ...(punchIn ? { punchInTime: punchIn } : {}),
          ...(punchOut ? { punchOutTime: punchOut } : {}),
          ...(totalMinutes !== null ? { totalMinutes } : {}),
          status: (item.status ? item.status.toUpperCase() : 'PRESENT') as any,
        },
      });
      created.push(record);
    } catch (err) {
      console.error(`Failed to bulk create attendance record for ${item.workEmail}:`, err);
    }
  }

  return created;
}

// ─────────────────────────────────────────────────────────────────────────────
// TRUSTED NETWORKS CRUD
// ─────────────────────────────────────────────────────────────────────────────

export async function getTrustedNetworks(tenantId: string) {
  return prisma.trustedNetwork.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'asc' },
  });
}

export async function createTrustedNetwork(
  tenantId: string,
  data: { name: string; cidr: string; description?: string }
) {
  // Basic CIDR format validation
  const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
  if (!cidrRegex.test(data.cidr)) {
    throw AppError.badRequest('Invalid CIDR format. Example: 203.0.113.0/24');
  }

  return prisma.trustedNetwork.create({
    data: { tenantId, ...data },
  });
}

export async function updateTrustedNetwork(
  tenantId: string,
  id: string,
  data: { name?: string; cidr?: string; description?: string; isActive?: boolean }
) {
  const network = await prisma.trustedNetwork.findUnique({ where: { id } });
  if (!network || network.tenantId !== tenantId) throw AppError.notFound('Network not found');

  if (data.cidr) {
    const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
    if (!cidrRegex.test(data.cidr)) {
      throw AppError.badRequest('Invalid CIDR format. Example: 203.0.113.0/24');
    }
  }

  return prisma.trustedNetwork.update({ where: { id }, data });
}

export async function deleteTrustedNetwork(tenantId: string, id: string) {
  const network = await prisma.trustedNetwork.findUnique({ where: { id } });
  if (!network || network.tenantId !== tenantId) throw AppError.notFound('Network not found');
  return prisma.trustedNetwork.delete({ where: { id } });
}

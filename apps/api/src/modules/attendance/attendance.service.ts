import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import { differenceInMinutes, startOfDay, endOfDay, isBefore } from 'date-fns';
import { startWorkflow } from '../workflows/workflow.service.js';

async function getCompanySettings(tenantId: string) {
  const settings = await prisma.companySettings.findUnique({
    where: { tenantId },
  });
  if (!settings) {
    throw AppError.internal('Company settings not found');
  }
  return settings;
}

export async function checkIn(tenantId: string, employeeId: string, locationData: { ipAddress?: string | undefined; latitude?: number | undefined; longitude?: number | undefined }) {
  const settings = await getCompanySettings(tenantId);
  
  if (!settings.isAttendanceEnabled) {
    throw AppError.badRequest('Attendance tracking is disabled for this organization');
  }

  if (settings.isGeolocationEnforced) {
    if (!locationData.latitude || !locationData.longitude) {
      throw AppError.badRequest('Geolocation is required to clock in');
    }
  }

  const today = startOfDay(new Date());

  const existingRecord = await prisma.attendanceRecord.findUnique({
    where: {
      tenantId_employeeId_date: {
        tenantId,
        employeeId,
        date: today,
      },
    },
  });

  if (existingRecord?.punchInTime) {
    throw AppError.badRequest('Already checked in for today');
  }

  // Parse workHoursStart "09:00" to check if late
  const [startHour, startMin] = settings.workHoursStart.split(':').map(Number);
  const expectedStartTime = new Date();
  expectedStartTime.setHours(startHour ?? 9, startMin ?? 0, 0, 0);

  const isLate = isBefore(expectedStartTime, new Date());

  if (existingRecord) {
    return prisma.attendanceRecord.update({
      where: { id: existingRecord.id },
      data: {
        punchInTime: new Date(),
        punchInIp: locationData.ipAddress ?? null,
        punchInLat: locationData.latitude ?? null,
        punchInLon: locationData.longitude ?? null,
        isLate,
      }
    });
  }

  return prisma.attendanceRecord.create({
    data: {
      tenantId,
      employeeId,
      date: today,
      punchInTime: new Date(),
      punchInIp: locationData.ipAddress ?? null,
      punchInLat: locationData.latitude ?? null,
      punchInLon: locationData.longitude ?? null,
      status: 'PRESENT',
      isLate,
    }
  });
}

export async function checkOut(tenantId: string, employeeId: string, locationData: { ipAddress?: string | undefined; latitude?: number | undefined; longitude?: number | undefined }) {
  const settings = await getCompanySettings(tenantId);
  
  if (!settings.isAttendanceEnabled) {
    throw AppError.badRequest('Attendance tracking is disabled for this organization');
  }

  if (settings.isGeolocationEnforced) {
    if (!locationData.latitude || !locationData.longitude) {
      throw AppError.badRequest('Geolocation is required to clock out');
    }
  }

  const today = startOfDay(new Date());

  const record = await prisma.attendanceRecord.findUnique({
    where: {
      tenantId_employeeId_date: {
        tenantId,
        employeeId,
        date: today,
      },
    },
    include: { breaks: true }
  });

  if (!record || !record.punchInTime) {
    throw AppError.badRequest('Must check in before checking out');
  }

  if (record.punchOutTime) {
    throw AppError.badRequest('Already checked out for today');
  }

  // Ensure no active breaks
  const activeBreak = record.breaks.find(b => !b.endAt);
  if (activeBreak) {
    throw AppError.badRequest('Cannot check out while on a break');
  }

  const checkOutTime = new Date();
  
  const [endHour, endMin] = settings.workHoursEnd.split(':').map(Number);
  const expectedEndTime = new Date();
  expectedEndTime.setHours(endHour ?? 18, endMin ?? 0, 0, 0);

  const isEarlyDeparture = isBefore(checkOutTime, expectedEndTime);

  const grossWorkMinutes = differenceInMinutes(checkOutTime, record.punchInTime!);
  const totalWorkMinutes = grossWorkMinutes - record.totalBreakMinutes;

  return prisma.attendanceRecord.update({
    where: { id: record.id },
    data: {
      punchOutTime: checkOutTime,
      punchOutIp: locationData.ipAddress ?? null,
      punchOutLat: locationData.latitude ?? null,
      punchOutLon: locationData.longitude ?? null,
      totalMinutes: totalWorkMinutes,
      isEarlyExit: isEarlyDeparture,
    }
  });
}

export async function startBreak(tenantId: string, employeeId: string, type: string = 'BREAK') {
  const today = startOfDay(new Date());
  const record = await prisma.attendanceRecord.findUnique({
    where: { tenantId_employeeId_date: { tenantId, employeeId, date: today } },
    include: { breaks: true }
  });

  if (!record || !record.punchInTime || record.punchOutTime) {
    throw AppError.badRequest('Must be actively checked in to start a break');
  }

  const activeBreak = record.breaks.find(b => !b.endAt);
  if (activeBreak) {
    throw AppError.badRequest('You are already on a break');
  }

  return prisma.attendanceBreak.create({
    data: {
      attendanceRecordId: record.id,
      startAt: new Date(),
      type
    }
  });
}

export async function endBreak(tenantId: string, employeeId: string) {
  const today = startOfDay(new Date());
  const record = await prisma.attendanceRecord.findUnique({
    where: { tenantId_employeeId_date: { tenantId, employeeId, date: today } },
    include: { breaks: true }
  });

  if (!record) {
    throw AppError.badRequest('No attendance record found for today');
  }

  const activeBreak = record.breaks.find(b => !b.endAt);
  if (!activeBreak) {
    throw AppError.badRequest('You are not currently on a break');
  }

  const endAt = new Date();
  const durationMinutes = differenceInMinutes(endAt, activeBreak.startAt);

  const updatedBreak = await prisma.attendanceBreak.update({
    where: { id: activeBreak.id },
    data: {
      endAt,
      durationMinutes
    }
  });

  // Update total break minutes on the parent record
  await prisma.attendanceRecord.update({
    where: { id: record.id },
    data: {
      totalBreakMinutes: { increment: durationMinutes }
    }
  });

  return updatedBreak;
}

export async function getMyAttendance(tenantId: string, employeeId: string, dateStr?: string) {
  let startDate, endDate;
  
  if (dateStr) {
    startDate = startOfDay(new Date(dateStr));
    endDate = endOfDay(new Date(dateStr));
  } else {
    // default to current month
    const now = new Date();
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  return prisma.attendanceRecord.findMany({
    where: {
      tenantId,
      employeeId,
      date: {
        gte: startDate,
        lte: endDate,
      }
    },
    include: { breaks: true, corrections: true },
    orderBy: { date: 'desc' }
  });
}

export async function requestRegularization(
  tenantId: string,
  employeeId: string,
  userId: string,
  data: { date: string; requestedCheckIn?: string | undefined; requestedCheckOut?: string | undefined; reason: string }
) {
  const targetDate = startOfDay(new Date(data.date));

  // Get or create empty record for that date
  let record = await prisma.attendanceRecord.findUnique({
    where: { tenantId_employeeId_date: { tenantId, employeeId, date: targetDate } }
  });

  if (!record) {
    record = await prisma.attendanceRecord.create({
      data: {
        tenantId,
        employeeId,
        date: targetDate,
        status: 'ABSENT'
      }
    });
  }

  const existingPending = await prisma.attendanceCorrection.findFirst({
    where: {
      attendanceRecordId: record.id,
      status: 'PENDING'
    }
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
      status: 'PENDING'
    }
  });

  try {
    // Attempt to start workflow
    const workflowId = await startWorkflow(tenantId, 'ATTENDANCE_REGULARIZATION', 'AttendanceCorrection', correction.id);
    if (workflowId) {
      await prisma.attendanceCorrection.update({
        where: { id: correction.id },
        data: { workflowInstanceId: workflowId }
      });
    }
  } catch (error) {
    // If workflow template doesn't exist, it will throw an error or return null.
    // In MVP, we might auto-approve if no workflow exists, or we leave it pending for admin manual approval.
    // For now we just let the error propagate if it's an AppError, or log it.
    // We'll throw to ensure the user knows it failed.
    throw error;
  }

  return correction;
}

export async function bulkCreateAttendanceRecords(
  tenantId: string,
  items: Array<{ workEmail: string; date: string; punchInTime?: string; punchOutTime?: string; status?: string }>
) {
  const created: any[] = [];
  
  for (const item of items) {
    if (!item.workEmail || !item.date) continue;
    try {
      const emp = await prisma.employee.findFirst({
        where: { tenantId, workEmail: item.workEmail.trim().toLowerCase() }
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

      const totalMinutes = (punchIn && punchOut) ? Math.max(0, differenceInMinutes(punchOut, punchIn)) : null;

      const record = await prisma.attendanceRecord.upsert({
        where: {
          tenantId_employeeId_date: {
            tenantId,
            employeeId: emp.id,
            date: dateObj
          }
        },
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
        }
      });
      created.push(record);
    } catch (err) {
      console.error(`Failed to bulk create attendance record for ${item.workEmail}:`, err);
    }
  }

  return created;
}

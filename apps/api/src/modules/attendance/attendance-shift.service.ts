import { prisma } from '../../lib/prisma.js';

// Converts "HH:MM" to total minutes from midnight
export function timeStringToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

// Returns minutes since midnight for a given Date
export function dateToMinutesSinceMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

// Parses CIDR notation and checks if an IP is within the range
export function isIpInCidr(ip: string, cidr: string): boolean {
  try {
    const [cidrIp, prefixStr] = cidr.split('/');
    const prefix = parseInt(prefixStr ?? '32', 10);

    const ipToNum = (ipStr: string): number => {
      const parts = ipStr.split('.').map(Number);
      return (
        ((parts[0] ?? 0) << 24) |
        ((parts[1] ?? 0) << 16) |
        ((parts[2] ?? 0) << 8) |
        (parts[3] ?? 0)
      );
    };

    const ipNum = ipToNum(ip);
    const cidrNum = ipToNum(cidrIp ?? '0.0.0.0');
    const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
    const cidrMasked = (cidrNum & mask) >>> 0;
    const ipMasked = (ipNum & mask) >>> 0;

    return cidrMasked === ipMasked;
  } catch {
    return false;
  }
}

export interface ShiftContext {
  shiftId: string;
  name: string;
  startTime: string;       // "HH:MM"
  endTime: string;         // "HH:MM"
  gracePeriodMinutes: number;
  startMinutes: number;    // minutes since midnight
  endMinutes: number;      // minutes since midnight
}

/**
 * Gets the active shift assigned to an employee for a given date.
 * Returns null if no shift is assigned.
 */
export async function getEmployeeShiftForDate(
  employeeId: string,
  date: Date
): Promise<ShiftContext | null> {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  const assignment = await prisma.employeeShift.findFirst({
    where: {
      employeeId,
      effectiveFrom: { lte: targetDate },
      OR: [
        { effectiveTo: null },
        { effectiveTo: { gte: targetDate } },
      ],
    },
    include: { shift: true },
    orderBy: { effectiveFrom: 'desc' },
  });

  if (!assignment) return null;

  const shift = assignment.shift;
  return {
    shiftId: shift.id,
    name: shift.name,
    startTime: shift.startTime,
    endTime: shift.endTime,
    gracePeriodMinutes: shift.gracePeriodMinutes,
    startMinutes: timeStringToMinutes(shift.startTime),
    endMinutes: timeStringToMinutes(shift.endTime),
  };
}

export interface PunchWindowResult {
  isWithinWindow: boolean;
  isEarlyPunch: boolean;   // punching before window opens
  isLatePunch: boolean;    // punching after window closes
  isLate: boolean;         // punching after grace period (but within window)
  minutesLate: number;
  minutesEarly: number;
  windowOpenMinutes: number;
  windowCloseMinutes: number;
}

/**
 * Validates whether the punch time falls within the allowed punch window.
 */
export function validatePunchWindow(
  shift: ShiftContext,
  punchTimeMinutes: number,
  punchWindowBefore: number,
  punchWindowAfter: number
): PunchWindowResult {
  const windowOpen = shift.startMinutes - punchWindowBefore;
  const windowClose = shift.startMinutes + punchWindowAfter;

  const isEarlyPunch = punchTimeMinutes < windowOpen;
  const isLatePunch = punchTimeMinutes > windowClose;
  const isWithinWindow = !isEarlyPunch && !isLatePunch;

  // Late = punched in after grace period
  const lateThreshold = shift.startMinutes + shift.gracePeriodMinutes;
  const isLate = punchTimeMinutes > lateThreshold;
  const minutesLate = Math.max(0, punchTimeMinutes - shift.startMinutes);
  const minutesEarly = Math.max(0, windowOpen - punchTimeMinutes);

  return {
    isWithinWindow,
    isEarlyPunch,
    isLatePunch,
    isLate,
    minutesLate,
    minutesEarly,
    windowOpenMinutes: windowOpen,
    windowCloseMinutes: windowClose,
  };
}

/**
 * Validates punch out timing and calculates early departure.
 */
export function validatePunchOutTiming(
  shift: ShiftContext,
  punchOutMinutes: number,
  earlyDepartureGrace: number
): { isEarlyDeparture: boolean; earlyExitMinutes: number } {
  const expectedEnd = shift.endMinutes;
  const allowedEarlyOut = expectedEnd - earlyDepartureGrace;
  const isEarlyDeparture = punchOutMinutes < allowedEarlyOut;
  const earlyExitMinutes = Math.max(0, expectedEnd - punchOutMinutes);

  return { isEarlyDeparture, earlyExitMinutes };
}

/**
 * Checks if an IP address falls within any of the tenant's trusted networks.
 * Returns: 'TRUSTED' | 'UNTRUSTED' | 'NO_POLICY'
 */
export async function checkNetworkTrust(
  tenantId: string,
  ip: string
): Promise<'TRUSTED' | 'UNTRUSTED' | 'NO_POLICY'> {
  const networks = await prisma.trustedNetwork.findMany({
    where: { tenantId, isActive: true },
  });

  if (networks.length === 0) return 'NO_POLICY';

  for (const network of networks) {
    if (isIpInCidr(ip, network.cidr)) {
      return 'TRUSTED';
    }
  }

  return 'UNTRUSTED';
}

/**
 * Calculates work metrics from punch in/out times.
 */
export function calculateWorkMetrics(
  punchInTime: Date,
  punchOutTime: Date,
  totalBreakMinutes: number,
  maxRegularMinutes: number,
  overtimeEnabled: boolean
): {
  totalMinutes: number;
  regularMinutes: number;
  overtimeMinutes: number;
  isOvertime: boolean;
} {
  const grossMs = punchOutTime.getTime() - punchInTime.getTime();
  const grossMinutes = Math.floor(grossMs / 60000);
  const totalMinutes = Math.max(0, grossMinutes - totalBreakMinutes);
  const regularMinutes = Math.min(totalMinutes, maxRegularMinutes);
  const overtimeMinutes = overtimeEnabled ? Math.max(0, totalMinutes - maxRegularMinutes) : 0;

  return {
    totalMinutes,
    regularMinutes,
    overtimeMinutes,
    isOvertime: overtimeMinutes > 0,
  };
}

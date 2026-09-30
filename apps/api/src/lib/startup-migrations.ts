/**
 * Startup self-healing migrations.
 * Runs on every server boot. All operations are idempotent (upsert / skip if exists).
 * Ensures the production DB has billing plans seeded and every tenant has a subscription.
 */
import { prisma } from './prisma.js';
import { logger } from './logger.js';

const ALL_MODULES = [
  'core_hr',
  'leave',
  'attendance',
  'ess',
  'helpdesk',
  'assets',
  'performance',
  'payroll',
  'projects',
  'library',
  'reports',
  'ai',
  'developer',
];

const PLAN_DEFINITIONS = [
  {
    name: 'Free',
    slug: 'FREE',
    monthlyPriceInr: 0,
    monthlyPriceUsd: 0,
    maxEmployees: 10,
    maxStorageMb: 500,
    maxApiCallsPerMonth: 1000,
    trialDays: 14,
    modules: ['core_hr', 'leave', 'ess'],
    sortOrder: 0,
    isPublic: true,
  },
  {
    name: 'Starter',
    slug: 'STARTER',
    monthlyPriceInr: 2999,
    monthlyPriceUsd: 35,
    maxEmployees: 50,
    maxStorageMb: 5000,
    maxApiCallsPerMonth: 50000,
    employeeOverageRateInr: 59,
    employeeOverageRateUsd: 0.7,
    trialDays: 0,
    modules: ['core_hr', 'leave', 'attendance', 'ess', 'helpdesk'],
    sortOrder: 1,
    isPublic: true,
  },
  {
    name: 'Growth',
    slug: 'GROWTH',
    monthlyPriceInr: 7999,
    monthlyPriceUsd: 95,
    maxEmployees: 250,
    maxStorageMb: 25000,
    maxApiCallsPerMonth: 500000,
    employeeOverageRateInr: 39,
    employeeOverageRateUsd: 0.5,
    trialDays: 0,
    modules: [
      'core_hr', 'leave', 'attendance', 'ess', 'helpdesk',
      'assets', 'performance', 'projects', 'library', 'reports',
    ],
    sortOrder: 2,
    isPublic: true,
  },
  {
    name: 'Enterprise',
    slug: 'ENTERPRISE',
    monthlyPriceInr: 24999,
    monthlyPriceUsd: 299,
    maxEmployees: null,
    maxStorageMb: null,
    maxApiCallsPerMonth: null,
    trialDays: 30,
    modules: ALL_MODULES,
    sortOrder: 3,
    isPublic: true,
  },
];

async function seedBillingPlans(): Promise<void> {
  for (const plan of PLAN_DEFINITIONS) {
    const { slug, ...rest } = plan;
    await (prisma as any).planDefinition.upsert({
      where: { slug },
      create: { slug, ...rest },
      update: rest,
    });
  }
  logger.info('[startup] Billing plans seeded/verified');
}

async function initializeMissingSubscriptions(): Promise<void> {
  // Find the FREE plan
  const freePlan = await (prisma as any).planDefinition.findUnique({
    where: { slug: 'FREE' },
  });
  if (!freePlan) {
    logger.warn('[startup] FREE plan not found — skipping subscription init');
    return;
  }

  // Get all active tenants
  const tenants = await prisma.tenant.findMany({
    where: { status: { not: 'SUSPENDED' } },
    select: { id: true, featureFlags: true },
  });

  let initialized = 0;
  let flagsFixed = 0;

  for (const tenant of tenants) {
    // Check if subscription exists
    const existingSub = await (prisma as any).tenantSubscription.findUnique({
      where: { tenantId: tenant.id },
    });

    if (!existingSub) {
      // Create subscription
      const now = new Date();
      const trialEnd = new Date(now);
      trialEnd.setDate(trialEnd.getDate() + (freePlan.trialDays ?? 14));

      try {
        await (prisma as any).tenantSubscription.create({
          data: {
            tenantId: tenant.id,
            planId: freePlan.id,
            status: freePlan.trialDays > 0 ? 'TRIALING' : 'ACTIVE',
            billingCycle: 'MONTHLY',
            currency: 'INR',
            currentPeriodStart: now,
            currentPeriodEnd: trialEnd,
            trialStart: freePlan.trialDays > 0 ? now : null,
            trialEnd: freePlan.trialDays > 0 ? trialEnd : null,
          },
        });
        initialized++;
      } catch (err: any) {
        if (err.code !== 'P2002') throw err; // ignore duplicate key
      }
    }

    // Fix empty featureFlags — if {} or null, rebuild them
    const flags = tenant.featureFlags as Record<string, boolean> | null;
    const isEmpty = !flags || Object.keys(flags).length === 0;

    if (isEmpty) {
      // Re-fetch with subscription to build flags
      const sub = await (prisma as any).tenantSubscription.findUnique({
        where: { tenantId: tenant.id },
        include: { plan: true, addons: { include: { addon: true } } },
      });

      const newFlags: Record<string, boolean> = {};

      if (!sub || sub.status === 'TRIALING') {
        ALL_MODULES.forEach((k) => (newFlags[k] = true));
      } else if (sub.status === 'ACTIVE') {
        ALL_MODULES.forEach((k) => (newFlags[k] = false));
        const planModules: string[] = sub.plan?.modules ?? [];
        const addonModules: string[] = sub.addons.map((a: any) => a.addon.key);
        [...planModules, ...addonModules].forEach((k) => (newFlags[k] = true));
      } else {
        ALL_MODULES.forEach((k) => (newFlags[k] = false));
      }

      // Check for BYO Gemini key
      const tenantInfo = await prisma.tenant.findUnique({
        where: { id: tenant.id },
        select: { geminiApiKey: true },
      });
      if (tenantInfo?.geminiApiKey && tenantInfo.geminiApiKey.length > 0) {
        newFlags['ai'] = true;
      }

      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { featureFlags: newFlags },
      });
      flagsFixed++;
    }
  }

  if (initialized > 0 || flagsFixed > 0) {
    logger.info(
      `[startup] Initialized ${initialized} missing subscriptions, fixed ${flagsFixed} empty featureFlags`,
    );
  }
}

export async function runStartupMigrations(): Promise<void> {
  await seedBillingPlans();
  await initializeMissingSubscriptions();
}

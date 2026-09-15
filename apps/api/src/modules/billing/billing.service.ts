/**
 * Billing Service — Core business logic for SaaS billing
 * Handles subscriptions, feature flags, usage metering, invoices, and Razorpay integration.
 */
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import type {
  CreateSubscriptionInput,
  ChangePlanInput,
  ToggleAddonInput,
  MarkInvoicePaidInput,
} from './billing.schema.js';
import {
  createRazorpaySubscription,
  cancelRazorpaySubscription,
  createRazorpayPaymentLink,
} from './razorpay.service.js';

// ── Module registry (must match sidebar nav keys) ────────────────────────────
export const ALL_MODULE_KEYS = [
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
] as const;

export type ModuleKey = (typeof ALL_MODULE_KEYS)[number];

// ── Plan & Addon listing ─────────────────────────────────────────────────────

export class BillingService {
  static async getPlans() {
    const plans = await (prisma as any).planDefinition.findMany({
      where: { isPublic: true },
      orderBy: { sortOrder: 'asc' },
    });
    const addons = await (prisma as any).moduleAddon.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    return { plans, addons };
  }

  // ── Subscription ───────────────────────────────────────────────────────────

  static async getTenantSubscription(tenantId: string) {
    let sub = await (prisma as any).tenantSubscription.findUnique({
      where: { tenantId },
      include: {
        plan: true,
        addons: { include: { addon: true } },
      },
    });

    if (!sub) {
      sub = await BillingService.initializeTenantSubscription(tenantId);
      if (sub) {
        // Re-fetch to include relations
        sub = await (prisma as any).tenantSubscription.findUnique({
          where: { tenantId },
          include: {
            plan: true,
            addons: { include: { addon: true } },
          },
        });
      }
    }

    return sub;
  }

  /**
   * Creates the initial subscription for a new tenant (called from AdminService.createTenant)
   * Defaults to FREE plan + TRIALING status.
   */
  static async initializeTenantSubscription(tenantId: string) {
    const freePlan = await (prisma as any).planDefinition.findUnique({
      where: { slug: 'FREE' },
    });
    if (!freePlan) {
      // Graceful fail — billing not seeded yet
      return null;
    }
    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + (freePlan.trialDays ?? 14));

    const sub = await (prisma as any).tenantSubscription.create({
      data: {
        tenantId,
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

    await BillingService.syncFeatureFlags(tenantId);
    return sub;
  }

  /**
   * Company Admin creates/upgrades subscription — triggers Razorpay checkout for paid plans.
   */
  static async createOrUpgradeSubscription(
    tenantId: string,
    input: CreateSubscriptionInput,
  ) {
    const plan = await (prisma as any).planDefinition.findUnique({
      where: { slug: input.planSlug },
    });
    if (!plan) throw AppError.notFound('Plan');

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw AppError.notFound('Tenant');

    // Resolve addons
    const addonDefs =
      input.addonKeys.length > 0
        ? await (prisma as any).moduleAddon.findMany({
            where: { key: { in: input.addonKeys }, isActive: true },
          })
        : [];

    const now = new Date();
    let periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + (input.billingCycle === 'ANNUAL' ? 12 : 1));

    // Compute price
    const monthlyBase =
      input.currency === 'USD' ? Number(plan.monthlyPriceUsd) : Number(plan.monthlyPriceInr);
    const addonTotal = addonDefs.reduce((sum: number, a: any) => {
      return (
        sum +
        (input.currency === 'USD'
          ? Number(a.monthlyPriceUsd)
          : Number(a.monthlyPriceInr))
      );
    }, 0);

    let total = (monthlyBase + addonTotal);
    if (input.billingCycle === 'ANNUAL') {
      const discount = plan.annualDiscountPct ?? 16;
      total = total * 12 * (1 - discount / 100);
    }

    let razorpaySubscriptionId: string | undefined;
    let razorpayPaymentUrl: string | undefined;

    // Create Razorpay subscription for paid plans
    if (total > 0) {
      const razorpayPlanId =
        input.billingCycle === 'ANNUAL'
          ? plan.razorpayAnnualPlanId
          : plan.razorpayMonthlyPlanId;

      if (razorpayPlanId) {
        try {
          let customerEmail = input.customerEmail;
          if (!customerEmail) {
            // Fallback to Company Admin's email
            const admin = await prisma.user.findFirst({
              where: { tenantId, roles: { has: 'Company Admin' } },
            });
            customerEmail = admin?.email || `${tenant.slug}@kaaryamitra.com`;
          }

          const result = await createRazorpaySubscription({
            planId: razorpayPlanId,
            totalCount: input.billingCycle === 'ANNUAL' ? 1 : 120, // 10 years
            customerEmail,
            notes: { tenantId, planSlug: input.planSlug },
          });
          razorpaySubscriptionId = result.subscriptionId;
          razorpayPaymentUrl = result.shortUrl;
        } catch (err) {
          console.error('[Billing] Failed to create Razorpay subscription:', err);
          // Fall through — subscription is created in DB but Razorpay link is missing
        }
      } else {
        // No Razorpay plan ID configured — create payment link instead
        try {
          const amountInPaise = Math.round(total * 100);
          razorpayPaymentUrl = await createRazorpayPaymentLink({
            amount: amountInPaise,
            currency: input.currency,
            description: `KaaryaMitra ${plan.name} - ${input.billingCycle}`,
            referenceId: tenantId,
          });
        } catch (err) {
          console.error('[Billing] Failed to create Razorpay payment link:', err);
        }
      }
    }

    // Upsert subscription
    const existingSub = await (prisma as any).tenantSubscription.findUnique({
      where: { tenantId },
    });

    let sub;
    if (existingSub) {
      sub = await (prisma as any).tenantSubscription.update({
        where: { tenantId },
        data: {
          planId: plan.id,
          billingCycle: input.billingCycle,
          currency: input.currency,
          status: total === 0 ? 'ACTIVE' : 'PENDING_PAYMENT',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          razorpaySubscriptionId,
          addons: {
            deleteMany: {},
            create: addonDefs.map((a: any) => ({ addonId: a.id })),
          },
        },
      });
    } else {
      sub = await (prisma as any).tenantSubscription.create({
        data: {
          tenantId,
          planId: plan.id,
          billingCycle: input.billingCycle,
          currency: input.currency,
          status: total === 0 ? 'ACTIVE' : 'PENDING_PAYMENT',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          razorpaySubscriptionId,
          addons: {
            create: addonDefs.map((a: any) => ({ addonId: a.id })),
          },
        },
      });
    }

    // Update tenant plan field
    await prisma.tenant.update({ where: { id: tenantId }, data: { plan: input.planSlug } });

    // Sync feature flags
    await BillingService.syncFeatureFlags(tenantId);

    // Generate invoice for paid plans
    if (total > 0) {
      await BillingService.generateInvoice(tenantId, now, periodEnd, {
        planName: plan.name,
        addonNames: addonDefs.map((a: any) => a.name),
        total,
        currency: input.currency,
        razorpayPaymentUrl,
      });
    }

    return { subscription: sub, razorpayPaymentUrl };
  }

  static async changePlan(tenantId: string, input: ChangePlanInput) {
    return BillingService.createOrUpgradeSubscription(tenantId, {
      planSlug: input.planSlug,
      billingCycle: input.billingCycle ?? 'MONTHLY',
      currency: 'INR',
      addonKeys: [],
    });
  }

  static async toggleAddon(tenantId: string, input: ToggleAddonInput) {
    const sub = await (prisma as any).tenantSubscription.findUnique({
      where: { tenantId },
      include: { addons: true },
    });
    if (!sub) throw AppError.notFound('Subscription');

    const addon = await (prisma as any).moduleAddon.findUnique({
      where: { key: input.addonKey },
    });
    if (!addon) throw AppError.notFound('Add-on');

    if (input.enabled) {
      if (Number(addon.monthlyPriceInr) > 0 || Number(addon.monthlyPriceUsd) > 0) {
        throw AppError.badRequest('Paid add-ons must be purchased by modifying your subscription plan on the billing page.');
      }
      // Add addon
      const exists = sub.addons.find((a: any) => a.addonId === addon.id);
      if (!exists) {
        await (prisma as any).tenantSubscriptionAddon.create({
          data: { subscriptionId: sub.id, addonId: addon.id },
        });
      }
    } else {
      // Remove addon
      await (prisma as any).tenantSubscriptionAddon.deleteMany({
        where: { subscriptionId: sub.id, addonId: addon.id },
      });
    }

    await BillingService.syncFeatureFlags(tenantId);
    return { success: true };
  }

  static async cancelSubscription(tenantId: string, atPeriodEnd = true) {
    const sub = await (prisma as any).tenantSubscription.findUnique({
      where: { tenantId },
    });
    if (!sub) throw AppError.notFound('Subscription');

    // Cancel in Razorpay
    if (sub.razorpaySubscriptionId) {
      try {
        await cancelRazorpaySubscription(sub.razorpaySubscriptionId, atPeriodEnd);
      } catch (err) {
        console.error('[Billing] Razorpay cancel error:', err);
      }
    }

    await (prisma as any).tenantSubscription.update({
      where: { tenantId },
      data: {
        cancelAtPeriodEnd: atPeriodEnd,
        status: atPeriodEnd ? 'ACTIVE' : 'CANCELLED',
      },
    });

    return { success: true, cancelAtPeriodEnd: atPeriodEnd };
  }

  // ── Usage Metering ─────────────────────────────────────────────────────────

  static async getUsageSummary(tenantId: string) {
    const sub = await (prisma as any).tenantSubscription.findUnique({
      where: { tenantId },
      include: { plan: true },
    });

    const employeeCount = await prisma.employee.count({
      where: { tenantId, employmentStatus: { not: 'OFFBOARDED' } },
    });

    // Get latest usage records for this billing period
    const periodStart = sub?.currentPeriodStart ?? new Date();
    const periodEnd = sub?.currentPeriodEnd ?? new Date();

    const latestStorageRecord = await (prisma as any).usageRecord.findFirst({
      where: {
        tenantId,
        metric: 'storage_mb',
        recordedAt: { gte: periodStart, lte: periodEnd },
      },
      orderBy: { recordedAt: 'desc' },
    });

    const apiCallsAggregate = await (prisma as any).usageRecord.aggregate({
      where: {
        tenantId,
        metric: 'api_calls',
        recordedAt: { gte: periodStart, lte: periodEnd },
      },
      _sum: { value: true },
    });

    return {
      employees: {
        used: employeeCount,
        limit: sub?.plan?.maxEmployees ?? null,
        percentage:
          sub?.plan?.maxEmployees
            ? Math.min(100, Math.round((employeeCount / sub.plan.maxEmployees) * 100))
            : 0,
      },
      storageMb: {
        used: latestStorageRecord?.value ?? 0,
        limit: sub?.plan?.maxStorageMb ?? null,
        percentage:
          sub?.plan?.maxStorageMb && latestStorageRecord
            ? Math.min(
                100,
                Math.round((latestStorageRecord.value / sub.plan.maxStorageMb) * 100),
              )
            : 0,
      },
      apiCalls: {
        used: apiCallsAggregate._sum?.value ?? 0,
        limit: sub?.plan?.maxApiCallsPerMonth ?? null,
        percentage:
          sub?.plan?.maxApiCallsPerMonth && apiCallsAggregate._sum?.value
            ? Math.min(
                100,
                Math.round(
                  (apiCallsAggregate._sum.value / sub.plan.maxApiCallsPerMonth) * 100,
                ),
              )
            : 0,
      },
      subscription: sub,
    };
  }

  // ── Feature Access ─────────────────────────────────────────────────────────

  /**
   * Check if a tenant has access to a specific module.
   * First reads from featureFlags cache on Tenant, falls back to DB lookup.
   */
  static async checkFeatureAccess(tenantId: string, moduleKey: string): Promise<boolean> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { featureFlags: true, status: true },
    });
    if (!tenant) return false;

    const flags = tenant.featureFlags as Record<string, boolean>;
    // If featureFlags is populated, use it
    if (flags && typeof flags[moduleKey] === 'boolean') {
      return flags[moduleKey];
    }

    // Fallback: check subscription directly
    const sub = await (prisma as any).tenantSubscription.findUnique({
      where: { tenantId },
      include: {
        plan: true,
        addons: { include: { addon: true } },
      },
    });

    if (!sub) return false;

    // During trial, all plan modules + addons are accessible
    if (sub.status === 'TRIALING') {
      return true;
    }

    const planModules: string[] = sub.plan?.modules ?? [];
    const addonModules: string[] = sub.addons.map((a: any) => a.addon.key);
    const allEnabled = [...planModules, ...addonModules];

    return allEnabled.includes(moduleKey);
  }

  /**
   * Rebuilds the featureFlags JSON on the Tenant model from current subscription.
   * Call this after any subscription change.
   */
  static async syncFeatureFlags(tenantId: string) {
    const sub = await (prisma as any).tenantSubscription.findUnique({
      where: { tenantId },
      include: {
        plan: true,
        addons: { include: { addon: true } },
      },
    });

    const tenantInfo = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { geminiApiKey: true },
    });

    const flags: Record<string, boolean> = {};

    if (!sub) {
      // No subscription — grant nothing
      ALL_MODULE_KEYS.forEach((k) => (flags[k] = false));
    } else if (sub.status === 'TRIALING') {
      // Trial: all modules enabled
      ALL_MODULE_KEYS.forEach((k) => (flags[k] = true));
    } else if (sub.status === 'ACTIVE') {
      ALL_MODULE_KEYS.forEach((k) => (flags[k] = false));
      const planModules: string[] = sub.plan?.modules ?? [];
      const addonModules: string[] = sub.addons.map((a: any) => a.addon.key);
      [...planModules, ...addonModules].forEach((k) => {
        if (ALL_MODULE_KEYS.includes(k as ModuleKey)) flags[k] = true;
      });
    } else {
      // PAST_DUE / CANCELLED / PAUSED / PENDING_PAYMENT — downgrade to free plan modules only
      ALL_MODULE_KEYS.forEach((k) => (flags[k] = false));
      const freePlan = await (prisma as any).planDefinition.findUnique({
        where: { slug: 'FREE' },
      });
      const freeModules: string[] = freePlan?.modules ?? [];
      freeModules.forEach((k) => (flags[k] = true));
    }

    // Force enable AI if BYO key is provided
    if (tenantInfo?.geminiApiKey && tenantInfo.geminiApiKey.length > 0) {
      flags['ai'] = true;
    }

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { featureFlags: flags },
    });

    return flags;
  }

  static async enforceEmployeeLimit(tenantId: string) {
    const usage = await BillingService.getUsageSummary(tenantId);
    if (usage.employees.limit !== null && usage.employees.used >= usage.employees.limit) {
      const { limit } = usage.employees;
      throw AppError.forbidden(
        `Employee limit reached (${limit} employees on your current plan). ` +
          `Please upgrade your plan to add more employees.`,
      );
    }
  }

  static async enforceStorageLimit(tenantId: string, fileSizeMb: number = 0) {
    const usage = await BillingService.getUsageSummary(tenantId);
    if (usage.storageMb.limit !== null && (usage.storageMb.used + fileSizeMb) >= usage.storageMb.limit) {
      const { limit } = usage.storageMb;
      throw AppError.forbidden(
        `Storage limit reached (${limit} MB on your current plan). ` +
          `Please upgrade your plan to get more storage space.`,
      );
    }
  }

  // ── Invoices ───────────────────────────────────────────────────────────────

  static async getInvoices(tenantId: string, options?: { page?: number; limit?: number }) {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;

    const [invoices, total] = await Promise.all([
      (prisma as any).invoice.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (prisma as any).invoice.count({ where: { tenantId } }),
    ]);

    return { invoices, total, page, limit };
  }

  static async generateInvoice(
    tenantId: string,
    periodStart: Date,
    periodEnd: Date,
    opts: {
      planName: string;
      addonNames: string[];
      total: number;
      currency: string;
      razorpayPaymentUrl?: string | undefined;
    },
  ) {
    // Generate sequential invoice number
    const count = await (prisma as any).invoice.count({ where: { tenantId } });
    const year = new Date().getFullYear();
    const invoiceNumber = `KM-${year}-${String(count + 1).padStart(4, '0')}`;

    const lineItems: any[] = [
      {
        description: `KaaryaMitra ${opts.planName} Plan`,
        quantity: 1,
        unitPrice: opts.total,
        amount: opts.total,
      },
      ...opts.addonNames.map((name) => ({
        description: `Add-on: ${name}`,
        quantity: 1,
        unitPrice: 0,
        amount: 0,
      })),
    ];

    const dueDate = new Date(periodStart);
    dueDate.setDate(dueDate.getDate() + 7);

    return (prisma as any).invoice.create({
      data: {
        tenantId,
        invoiceNumber,
        status: 'OPEN',
        subtotal: opts.total,
        tax: 0,
        total: opts.total,
        currency: opts.currency,
        periodStart,
        periodEnd,
        dueDate,
        razorpayPaymentUrl: opts.razorpayPaymentUrl,
        lineItems,
      },
    });
  }

  static async markInvoicePaid(invoiceId: string, input: MarkInvoicePaidInput) {
    const invoice = await (prisma as any).invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw AppError.notFound('Invoice');

    return (prisma as any).invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'PAID',
        paidAt: input.paidAt ? new Date(input.paidAt) : new Date(),
        razorpayPaymentId: input.razorpayPaymentId,
      },
    });
  }

  // ── Razorpay Webhook Handler ───────────────────────────────────────────────

  static async handleRazorpayWebhook(event: string, payload: any) {
    switch (event) {
      case 'subscription.activated': {
        const sub = payload?.subscription?.entity;
        if (!sub?.id) break;
        // Find tenant sub by razorpaySubscriptionId
        const tenantSub = await (prisma as any).tenantSubscription.findFirst({
          where: { razorpaySubscriptionId: sub.id },
        });
        if (tenantSub && (tenantSub.status === 'TRIALING' || tenantSub.status === 'PENDING_PAYMENT')) {
          await (prisma as any).tenantSubscription.update({
            where: { id: tenantSub.id },
            data: { status: 'ACTIVE' },
          });
          await BillingService.syncFeatureFlags(tenantSub.tenantId);
        }
        break;
      }

      case 'subscription.charged': {
        const sub = payload?.subscription?.entity;
        const payment = payload?.payment?.entity;
        if (!sub?.id) break;
        const tenantSub = await (prisma as any).tenantSubscription.findFirst({
          where: { razorpaySubscriptionId: sub.id },
        });
        if (tenantSub) {
          // Mark latest open invoice as paid
          const openInvoice = await (prisma as any).invoice.findFirst({
            where: { tenantId: tenantSub.tenantId, status: 'OPEN' },
            orderBy: { createdAt: 'desc' },
          });
          if (openInvoice) {
            await (prisma as any).invoice.update({
              where: { id: openInvoice.id },
              data: {
                status: 'PAID',
                paidAt: new Date(),
                razorpayPaymentId: payment?.id,
              },
            });
          }
          // Extend billing period
          const now = new Date();
          const nextPeriodEnd = new Date(now);
          nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + (tenantSub.billingCycle === 'ANNUAL' ? 12 : 1));
          await (prisma as any).tenantSubscription.update({
            where: { id: tenantSub.id },
            data: {
              status: 'ACTIVE',
              currentPeriodStart: now,
              currentPeriodEnd: nextPeriodEnd,
            },
          });
        }
        break;
      }

      case 'subscription.cancelled':
      case 'subscription.completed': {
        const sub = payload?.subscription?.entity;
        if (!sub?.id) break;
        const tenantSub = await (prisma as any).tenantSubscription.findFirst({
          where: { razorpaySubscriptionId: sub.id },
        });
        if (tenantSub) {
          // Downgrade to FREE
          const freePlan = await (prisma as any).planDefinition.findUnique({
            where: { slug: 'FREE' },
          });
          if (freePlan) {
            await (prisma as any).tenantSubscription.update({
              where: { id: tenantSub.id },
              data: { status: 'CANCELLED', planId: freePlan.id },
            });
            await prisma.tenant.update({
              where: { id: tenantSub.tenantId },
              data: { plan: 'FREE' },
            });
            await BillingService.syncFeatureFlags(tenantSub.tenantId);
          }
        }
        break;
      }

      case 'payment.failed': {
        const sub = payload?.subscription?.entity;
        if (!sub?.id) break;
        const tenantSub = await (prisma as any).tenantSubscription.findFirst({
          where: { razorpaySubscriptionId: sub.id },
        });
        if (tenantSub) {
          await (prisma as any).tenantSubscription.update({
            where: { id: tenantSub.id },
            data: { status: 'PAST_DUE' },
          });
          await BillingService.syncFeatureFlags(tenantSub.tenantId);
        }
        break;
      }
    }
  }
}

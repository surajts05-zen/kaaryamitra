/**
 * Admin Billing Service — Super Admin management of plan definitions, add-ons,
 * platform-wide subscription overview, and Razorpay settings.
 */
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import type { UpdatePlanInput, UpdateAddonInput, UpdateRazorpaySettingsInput } from './billing.schema.js';

export class AdminBillingService {
  // ── Plan Definitions ───────────────────────────────────────────────────────

  static async getAllPlans() {
    return (prisma as any).planDefinition.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { subscriptions: true } },
      },
    });
  }

  static async updatePlan(planId: string, input: UpdatePlanInput) {
    const plan = await (prisma as any).planDefinition.findUnique({ where: { id: planId } });
    if (!plan) throw AppError.notFound('Plan');

    return (prisma as any).planDefinition.update({
      where: { id: planId },
      data: {
        ...input,
        monthlyPriceInr: input.monthlyPriceInr !== undefined ? input.monthlyPriceInr : undefined,
        monthlyPriceUsd: input.monthlyPriceUsd !== undefined ? input.monthlyPriceUsd : undefined,
      },
    });
  }

  // ── Add-on Definitions ────────────────────────────────────────────────────

  static async getAllAddons() {
    return (prisma as any).moduleAddon.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { subscriptionAddons: true } },
      },
    });
  }

  static async updateAddon(addonId: string, input: UpdateAddonInput) {
    const addon = await (prisma as any).moduleAddon.findUnique({ where: { id: addonId } });
    if (!addon) throw AppError.notFound('Add-on');

    return (prisma as any).moduleAddon.update({ where: { id: addonId }, data: input });
  }

  // ── Subscriptions Overview ────────────────────────────────────────────────

  static async getAllSubscriptions(filters?: {
    status?: string;
    planSlug?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 25;
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.planSlug) where.plan = { slug: filters.planSlug };

    const [subscriptions, total] = await Promise.all([
      (prisma as any).tenantSubscription.findMany({
        where,
        include: {
          tenant: { select: { id: true, name: true, slug: true, status: true } },
          plan: true,
          addons: { include: { addon: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (prisma as any).tenantSubscription.count({ where }),
    ]);

    return { subscriptions, total, page, limit };
  }

  static async getTenantSubscriptionDetail(tenantId: string) {
    const [sub, invoices, usage] = await Promise.all([
      (prisma as any).tenantSubscription.findUnique({
        where: { tenantId },
        include: {
          plan: true,
          addons: { include: { addon: true } },
        },
      }),
      (prisma as any).invoice.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 12,
      }),
      (prisma as any).usageRecord.findMany({
        where: { tenantId },
        orderBy: { recordedAt: 'desc' },
        take: 90,
      }),
    ]);

    return { subscription: sub, invoices, usage };
  }

  // ── Admin override: change a tenant's subscription ────────────────────────

  static async adminChangeTenantPlan(
    tenantId: string,
    planSlug: string,
    status?: string,
  ) {
    const plan = await (prisma as any).planDefinition.findUnique({ where: { slug: planSlug } });
    if (!plan) throw AppError.notFound('Plan');

    await (prisma as any).tenantSubscription.update({
      where: { tenantId },
      data: {
        planId: plan.id,
        status: status ?? 'ACTIVE',
      },
    });

    await prisma.tenant.update({ where: { id: tenantId }, data: { plan: planSlug as any } });

    const { BillingService } = await import('./billing.service.js');
    await BillingService.syncFeatureFlags(tenantId);

    return { success: true };
  }

  // ── Invoice overview (all tenants) ────────────────────────────────────────

  static async getAllInvoices(filters?: {
    status?: string;
    tenantId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 25;
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.tenantId) where.tenantId = filters.tenantId;

    const [invoices, total] = await Promise.all([
      (prisma as any).invoice.findMany({
        where,
        include: {
          tenant: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (prisma as any).invoice.count({ where }),
    ]);

    return { invoices, total, page, limit };
  }

  static async adminMarkInvoicePaid(invoiceId: string, razorpayPaymentId?: string) {
    const invoice = await (prisma as any).invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw AppError.notFound('Invoice');

    return (prisma as any).invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        razorpayPaymentId,
      },
    });
  }

  // ── Platform MRR / stats ──────────────────────────────────────────────────

  static async getPlatformBillingStats() {
    const [
      totalSubscriptions,
      activeSubscriptions,
      trialingSubscriptions,
      cancelledSubscriptions,
      pastDueSubscriptions,
      planCounts,
    ] = await Promise.all([
      (prisma as any).tenantSubscription.count(),
      (prisma as any).tenantSubscription.count({ where: { status: 'ACTIVE' } }),
      (prisma as any).tenantSubscription.count({ where: { status: 'TRIALING' } }),
      (prisma as any).tenantSubscription.count({ where: { status: 'CANCELLED' } }),
      (prisma as any).tenantSubscription.count({ where: { status: 'PAST_DUE' } }),
      (prisma as any).tenantSubscription.groupBy({
        by: ['planId'],
        _count: { id: true },
        where: { status: { in: ['ACTIVE', 'TRIALING'] } },
      }),
    ]);

    // Compute approximate MRR (INR)
    const activeSubs = await (prisma as any).tenantSubscription.findMany({
      where: { status: 'ACTIVE' },
      include: {
        plan: true,
        addons: { include: { addon: true } },
      },
    });

    let mrrInr = 0;
    for (const sub of activeSubs) {
      const planPrice = Number(sub.plan?.monthlyPriceInr ?? 0);
      const addonPrice = (sub.addons ?? []).reduce(
        (sum: number, a: any) => sum + Number(a.addon?.monthlyPriceInr ?? 0),
        0,
      );
      mrrInr +=
        sub.billingCycle === 'ANNUAL'
          ? ((planPrice + addonPrice) * 12 * (1 - (sub.plan?.annualDiscountPct ?? 16) / 100)) / 12
          : planPrice + addonPrice;
    }

    return {
      totalSubscriptions,
      activeSubscriptions,
      trialingSubscriptions,
      cancelledSubscriptions,
      pastDueSubscriptions,
      mrrInr: Math.round(mrrInr),
      planCounts,
    };
  }

  // ── Razorpay Settings ─────────────────────────────────────────────────────

  static async getRazorpaySettings() {
    const settings = await (prisma as any).platformSettings.findUnique({
      where: { id: 'global' },
      select: { razorpayKeyId: true, razorpayWebhookSecret: true },
    });
    return settings ?? {};
  }

  static async updateRazorpaySettings(input: UpdateRazorpaySettingsInput) {
    const updated = await (prisma as any).platformSettings.upsert({
      where: { id: 'global' },
      create: { id: 'global', ...input },
      update: input,
    });

    // Reload Razorpay client settings in memory
    const { loadRazorpaySettings } = await import('./razorpay.service.js');
    await loadRazorpaySettings();

    return { success: true, keyId: updated.razorpayKeyId };
  }
}

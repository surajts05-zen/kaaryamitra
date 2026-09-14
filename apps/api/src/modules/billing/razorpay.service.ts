/**
 * Razorpay Service
 * Wraps the Razorpay Node SDK for subscriptions, orders, and payment links.
 */
import Razorpay from 'razorpay';
import crypto from 'node:crypto';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';

function getRazorpayClient(): Razorpay {
  const settings = (global as any).__razorpaySettings;
  if (!settings?.razorpayKeyId || !settings?.razorpayKeySecret) {
    throw AppError.badRequest('Razorpay is not configured. Please add API keys in Platform Settings.');
  }
  return new Razorpay({
    key_id: settings.razorpayKeyId,
    key_secret: settings.razorpayKeySecret,
  });
}

export async function loadRazorpaySettings() {
  const settings = await (prisma as any).platformSettings.findUnique({
    where: { id: 'global' },
    select: { razorpayKeyId: true, razorpayKeySecret: true, razorpayWebhookSecret: true },
  });
  (global as any).__razorpaySettings = settings ?? {};
}

export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string,
): boolean {
  const settings = (global as any).__razorpaySettings;
  if (!settings?.razorpayWebhookSecret) return false;
  const expected = crypto
    .createHmac('sha256', settings.razorpayWebhookSecret)
    .update(rawBody)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

// ── Razorpay Plan (recurring billing plan) ───────────────────────────────────

export async function createRazorpayPlan(params: {
  name: string;
  amount: number; // in paise (INR) or cents (USD)
  currency: string;
  interval: 'monthly' | 'yearly';
}): Promise<string> {
  const rz = getRazorpayClient();
  const plan = await (rz as any).plans.create({
    period: params.interval === 'monthly' ? 'monthly' : 'yearly',
    interval: 1,
    item: {
      name: params.name,
      amount: params.amount,
      currency: params.currency,
      description: params.name,
    },
  });
  return plan.id as string;
}

// ── Razorpay Subscription ────────────────────────────────────────────────────

export async function createRazorpaySubscription(params: {
  planId: string;
  totalCount: number; // number of billing cycles (e.g. 12 for annual)
  customerEmail?: string;
  customerName?: string;
  notes?: Record<string, string>;
}): Promise<{ subscriptionId: string; shortUrl: string }> {
  const rz = getRazorpayClient();
  const sub = await (rz as any).subscriptions.create({
    plan_id: params.planId,
    total_count: params.totalCount,
    notify_info: params.customerEmail
      ? { notify_phone: null, notify_email: params.customerEmail }
      : undefined,
    notes: params.notes ?? {},
  });
  return { subscriptionId: sub.id as string, shortUrl: sub.short_url as string ?? '' };
}

export async function cancelRazorpaySubscription(
  subscriptionId: string,
  cancelAtCycleEnd = true,
): Promise<void> {
  const rz = getRazorpayClient();
  await (rz as any).subscriptions.cancel(subscriptionId, cancelAtCycleEnd);
}

// ── Razorpay Order (one-time payment) ────────────────────────────────────────

export async function createRazorpayOrder(params: {
  amount: number; // in paise
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<{ orderId: string; amount: number; currency: string }> {
  const rz = getRazorpayClient();
  const order = await (rz as any).orders.create({
    amount: params.amount,
    currency: params.currency,
    receipt: params.receipt,
    notes: params.notes ?? {},
  });
  return {
    orderId: order.id as string,
    amount: order.amount as number,
    currency: order.currency as string,
  };
}

// ── Razorpay Payment Link ────────────────────────────────────────────────────

export async function createRazorpayPaymentLink(params: {
  amount: number;
  currency: string;
  description: string;
  customerEmail?: string;
  customerName?: string;
  referenceId?: string;
}): Promise<string> {
  const rz = getRazorpayClient();
  const link = await (rz as any).paymentLink.create({
    amount: params.amount,
    currency: params.currency,
    description: params.description,
    customer: params.customerEmail
      ? { email: params.customerEmail, name: params.customerName }
      : undefined,
    reference_id: params.referenceId,
    notify: { email: !!params.customerEmail, sms: false },
    reminder_enable: true,
  });
  return link.short_url as string;
}

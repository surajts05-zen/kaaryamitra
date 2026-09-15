import cron from 'node-cron';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { prisma } from '../lib/prisma.js';
import { BillingService } from '../modules/billing/billing.service.js';
import { logger } from '../lib/logger.js';
import { env } from '../config/env.js';

let s3Client: S3Client | null = null;

function getS3Client() {
  if (s3Client) return s3Client;
  if (env.S3_REGION && env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY) {
    s3Client = new S3Client({
      region: env.S3_REGION,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3Client;
}

export function initBillingMeterJob() {
  // Run daily at midnight
  cron.schedule('0 0 * * *', async () => {
    logger.info('[BillingMeterJob] Starting nightly billing meter...');
    try {
      const activeSubscriptions = await (prisma as any).tenantSubscription.findMany({
        where: {
          status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] },
        },
        include: {
          tenant: true,
          plan: true,
          addons: { include: { addon: true } },
        },
      });

      for (const sub of activeSubscriptions) {
        const tenantId = sub.tenantId;
        const now = new Date();

        // ── 1. Check Trial Expiry ────────────────────────────────────────────
        if (sub.status === 'TRIALING' && sub.trialEnd && now > sub.trialEnd) {
          logger.info(`[BillingMeterJob] Trial expired for tenant ${tenantId}. Downgrading to FREE.`);
          
          const freePlan = await (prisma as any).planDefinition.findUnique({
            where: { slug: 'FREE' },
          });

          if (freePlan) {
            await (prisma as any).tenantSubscription.update({
              where: { id: sub.id },
              data: { status: 'CANCELLED', planId: freePlan.id },
            });
            await prisma.tenant.update({
              where: { id: tenantId },
              data: { plan: 'FREE' },
            });
            await BillingService.syncFeatureFlags(tenantId);
          }
          continue; // Skip metering for this run, it's downgraded
        }

        // ── 2. Meter Employees ───────────────────────────────────────────────
        const employeeCount = await prisma.employee.count({
          where: { tenantId, employmentStatus: { not: 'OFFBOARDED' } },
        });

        await (prisma as any).usageRecord.create({
          data: {
            tenantId,
            subscriptionId: sub.id,
            metric: 'employees',
            value: employeeCount,
            periodStart: sub.currentPeriodStart,
            periodEnd: sub.currentPeriodEnd,
          },
        });

        // ── 3. Meter S3 Storage ──────────────────────────────────────────────
        const s3 = getS3Client();
        if (s3 && env.S3_BUCKET) {
          try {
            let totalBytes = 0;
            let isTruncated = true;
            let continuationToken: string | undefined = undefined;

            // Tenants store files under `${tenantId}/...` prefix
            while (isTruncated) {
              const command = new ListObjectsV2Command({
                Bucket: env.S3_BUCKET,
                Prefix: `${tenantId}/`,
                ContinuationToken: continuationToken,
              });
              const res: any = await s3.send(command);
              
              if (res.Contents) {
                for (const item of res.Contents) {
                  totalBytes += item.Size || 0;
                }
              }
              isTruncated = res.IsTruncated ?? false;
              continuationToken = res.NextContinuationToken;
            }

            const totalMb = Math.round(totalBytes / (1024 * 1024));

            await (prisma as any).usageRecord.create({
              data: {
                tenantId,
                subscriptionId: sub.id,
                metric: 'storage_mb',
                value: totalMb,
                periodStart: sub.currentPeriodStart,
                periodEnd: sub.currentPeriodEnd,
              },
            });
          } catch (err: any) {
            logger.error(err, `[BillingMeterJob] Failed to meter S3 for tenant ${tenantId}`);
          }
        }

        // ── 4. Check Billing Cycle End ───────────────────────────────────────
        if (sub.status === 'ACTIVE' && now > sub.currentPeriodEnd) {
          logger.info(`[BillingMeterJob] Billing cycle ended for tenant ${tenantId}. Generatng invoice...`);
          // Note: Real Razorpay subscriptions handle their own renewal and webhook will update DB.
          // If no Razorpay sub exists (manual invoicing or free plan), we handle it here:
          if (!sub.razorpaySubscriptionId && sub.plan.slug !== 'FREE') {
            // Generate manual invoice
            let addonTotal = 0;
            const addonNames = sub.addons.map((a: any) => {
              const price = sub.currency === 'USD' ? Number(a.addon.monthlyPriceUsd) : Number(a.addon.monthlyPriceInr);
              addonTotal += price;
              return a.addon.name;
            });

            let basePrice = sub.currency === 'USD' ? Number(sub.plan.monthlyPriceUsd) : Number(sub.plan.monthlyPriceInr);
            if (sub.billingCycle === 'ANNUAL') {
              const discount = sub.plan.annualDiscountPct ?? 16;
              basePrice = basePrice * 12 * (1 - discount / 100);
              addonTotal = addonTotal * 12;
            }

            const total = basePrice + addonTotal;

            if (total > 0) {
              await BillingService.generateInvoice(tenantId, sub.currentPeriodEnd, new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), {
                planName: sub.plan.name,
                addonNames,
                total,
                currency: sub.currency,
              });

              // Mark as PAST_DUE if they don't pay. For now just set active for another month
              const nextPeriodEnd = new Date(sub.currentPeriodEnd);
              nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + (sub.billingCycle === 'ANNUAL' ? 12 : 1));
              
              await (prisma as any).tenantSubscription.update({
                where: { id: sub.id },
                data: { currentPeriodStart: sub.currentPeriodEnd, currentPeriodEnd: nextPeriodEnd },
              });
            }
          }
        }
      }
      logger.info('[BillingMeterJob] Nightly billing meter completed successfully.');
    } catch (error: any) {
      logger.error(error, '[BillingMeterJob] Failed to run billing meter');
    }
  });
}

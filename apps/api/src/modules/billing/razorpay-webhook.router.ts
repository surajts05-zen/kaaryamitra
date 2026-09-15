import { Router } from 'express';
import express from 'express';
import { BillingService } from './billing.service.js';
import { verifyRazorpayWebhookSignature } from './razorpay.service.js';
import { AppError } from '../../lib/errors.js';

export const razorpayWebhookRouter = Router();

// This endpoint receives webhooks directly from Razorpay.
// We must parse the raw body to verify the HMAC signature.
razorpayWebhookRouter.post(
  '/',
  express.raw({ type: 'application/json' }),
  async (req, res, next) => {
    try {
      const signature = req.headers['x-razorpay-signature'] as string;
      if (!signature) {
        throw AppError.badRequest('Missing Razorpay signature');
      }

      const rawBody = req.body.toString('utf8');
      
      const isValid = verifyRazorpayWebhookSignature(rawBody, signature);
      if (!isValid) {
        throw AppError.unauthorized('Invalid Razorpay signature');
      }

      const payload = JSON.parse(rawBody);
      const event = payload.event;

      // Process webhook asynchronously and ACK to Razorpay quickly
      BillingService.handleRazorpayWebhook(event, payload.payload).catch((err) => {
        console.error('[Razorpay Webhook Error]', err);
      });

      res.status(200).send('OK');
    } catch (error) {
      next(error);
    }
  }
);

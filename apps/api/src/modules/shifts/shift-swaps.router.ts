import { Router } from 'express';
import {
  requestSwapHandler,
  getSwapRequestsHandler
} from './shift-swaps.controller.js';
import { requireAuth } from '../../middleware/auth.js';

export const shiftSwapsRouter = Router();

// Employee Shift Swap endpoints
shiftSwapsRouter.post('/request', requireAuth, requestSwapHandler);
shiftSwapsRouter.get('/', requireAuth, getSwapRequestsHandler);

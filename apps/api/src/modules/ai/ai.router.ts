import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { aiChatHandler } from './ai.controller.js';

export const aiRouter = Router();

aiRouter.use(requireAuth);
aiRouter.post('/chat', aiChatHandler);

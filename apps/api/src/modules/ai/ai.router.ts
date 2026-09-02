import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../../middleware/auth.js';
import { aiChatHandler, aiInsightsHandler, aiExtractHandler } from './ai.controller.js';

export const aiRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit for AI extracts
});

aiRouter.use(requireAuth);
aiRouter.post('/chat', aiChatHandler);
aiRouter.get('/insights', aiInsightsHandler);
aiRouter.post('/extract', upload.single('file'), aiExtractHandler);

import type { Request, Response } from 'express';
import { z } from 'zod';
import { handleAiChat } from './ai.service.js';

export async function aiChatHandler(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  const userId = req.auth!.userId;
  const { message, history } = z
    .object({
      message: z.string().min(1),
      history: z.array(z.object({
        role: z.enum(['user', 'model']),
        parts: z.array(z.object({ text: z.string() }))
      })).optional().default([]),
    })
    .parse(req.body);

  const responseText = await handleAiChat(tenantId, userId, message, history);

  res.json({ data: { text: responseText } });
}

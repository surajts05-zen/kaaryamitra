import type { Request, Response } from 'express';
import { z } from 'zod';
import { handleAiChat, generateInsights, extractDocumentData } from './ai.service.js';

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

export async function aiInsightsHandler(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  
  const insights = await generateInsights(tenantId);
  if (!insights) {
    return res.status(200).json({ success: true, data: { insights: null }, message: "AI Insights unavailable. Check API key." });
  }

  res.json({ success: true, data: { insights } });
}

export async function aiExtractHandler(req: Request, res: Response) {
  const tenantId = req.tenantId!;
  
  if (!req.file) {
    return res.status(400).json({ success: false, error: { message: "No file uploaded." } });
  }

  const prompt = req.body.prompt || 'Extract relevant information from this document as JSON.';

  const extractedData = await extractDocumentData(tenantId, req.file.buffer, req.file.mimetype, prompt);
  
  if (!extractedData) {
    return res.status(500).json({ success: false, error: { message: "Failed to extract data or AI unavailable." } });
  }

  res.json({ success: true, data: extractedData });
}

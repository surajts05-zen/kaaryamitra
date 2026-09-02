import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import {
  listWorkflowTemplatesHandler,
  getWorkflowTemplateHandler,
  createWorkflowTemplateHandler,
  updateWorkflowTemplateHandler,
  listMyPendingApprovalsHandler,
  processWorkflowActionHandler,
  seedStandardWorkflowsHandler,
} from './workflow.controller.js';

export const workflowRouter = Router();

// ─── Admin: Workflow Template Management ──────────────────────────────────────
workflowRouter.get('/templates', asyncHandler(listWorkflowTemplatesHandler));
workflowRouter.post('/templates/seed', asyncHandler(seedStandardWorkflowsHandler));
workflowRouter.get('/templates/:id', asyncHandler(getWorkflowTemplateHandler));
workflowRouter.post('/templates', asyncHandler(createWorkflowTemplateHandler));
workflowRouter.put('/templates/:id', asyncHandler(updateWorkflowTemplateHandler));

// ─── Approvals Inbox (any authenticated employee) ─────────────────────────────
workflowRouter.get('/approvals', asyncHandler(listMyPendingApprovalsHandler));
workflowRouter.post('/approvals/:instanceId', asyncHandler(processWorkflowActionHandler));

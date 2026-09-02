import { Router } from 'express';
import { HelpdeskController } from './helpdesk.controller.js';
import { asyncHandler } from '../../middleware/errorHandler.js';

export const helpdeskAdminRouter = Router();
export const helpdeskEssRouter = Router();

// ─── ADMIN / HR ROUTES (/api/v1/t/:slug/helpdesk) ──────────────────────────

// Categories
helpdeskAdminRouter.get('/categories', asyncHandler(HelpdeskController.getCategories));
helpdeskAdminRouter.post('/categories', asyncHandler(HelpdeskController.createCategory));
helpdeskAdminRouter.patch('/categories/:id', asyncHandler(HelpdeskController.updateCategory));
helpdeskAdminRouter.delete('/categories/:id', asyncHandler(HelpdeskController.deleteCategory));

// Tickets
helpdeskAdminRouter.get('/tickets', asyncHandler(HelpdeskController.getAllTickets));
helpdeskAdminRouter.get('/tickets/:id', asyncHandler(HelpdeskController.getTicketById));
helpdeskAdminRouter.patch('/tickets/:id', asyncHandler(HelpdeskController.updateTicket));
helpdeskAdminRouter.post('/tickets/:id/comments', asyncHandler(HelpdeskController.addAdminComment));


// ─── ESS ROUTES (/api/v1/t/:slug/me/helpdesk) ──────────────────────────────

// Categories (Read-only for ESS to populate dropdowns)
helpdeskEssRouter.get('/categories', asyncHandler(HelpdeskController.getCategories));

// Tickets
helpdeskEssRouter.get('/tickets', asyncHandler(HelpdeskController.getMyTickets));
helpdeskEssRouter.post('/tickets', asyncHandler(HelpdeskController.createTicket));
helpdeskEssRouter.get('/tickets/:id', asyncHandler(HelpdeskController.getMyTicketById));
helpdeskEssRouter.post('/tickets/:id/comments', asyncHandler(HelpdeskController.addEmployeeComment));

import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { getMyProfileHandler, updateMyProfileHandler } from './ess.controller.js';

export const essRouter = Router({ mergeParams: true });

essRouter.get('/profile', asyncHandler(getMyProfileHandler));
essRouter.put('/profile', asyncHandler(updateMyProfileHandler));

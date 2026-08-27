import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import {
  registerHandler,
  loginHandler,
  refreshHandler,
  logoutHandler,
  getMeHandler,
} from './auth.controller.js';
import { requireAuth } from '../../middleware/auth.js';

export const authRouter = Router();

// Local auth
authRouter.post('/register', asyncHandler(registerHandler));
authRouter.post('/login', asyncHandler(loginHandler));
authRouter.post('/refresh', asyncHandler(refreshHandler));
authRouter.post('/logout', requireAuth, asyncHandler(logoutHandler));

// Current user
authRouter.get('/me', requireAuth, asyncHandler(getMeHandler));

// Google OAuth (implemented in Phase 2)
// authRouter.get('/google', googleOAuthRedirect);
// authRouter.get('/google/callback', asyncHandler(googleOAuthCallback));

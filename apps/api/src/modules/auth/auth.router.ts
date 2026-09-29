import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler.js';
import {
  registerHandler,
  loginHandler,
  refreshHandler,
  logoutHandler,
  getMeHandler,
  updatePresenceHandler,
  updatePinnedColleaguesHandler,
  getBulkPresenceHandler,
  getSsoOptionsHandler,
  googleOAuthRedirect,
  googleOAuthCallback,
  zohoOAuthRedirect,
  zohoOAuthCallback,
  completeSetupHandler
} from './auth.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { authRateLimiter } from '../../middleware/rateLimiter.js';

export const authRouter = Router();

// Public SSO options
authRouter.get('/sso-options', asyncHandler(getSsoOptionsHandler));

// Local auth (Rate limited to prevent brute force)
authRouter.post('/register', authRateLimiter, asyncHandler(registerHandler));
authRouter.post('/login', authRateLimiter, asyncHandler(loginHandler));
authRouter.post('/refresh', asyncHandler(refreshHandler));
authRouter.post('/logout', asyncHandler(logoutHandler));

// Current user
authRouter.get('/me', requireAuth, asyncHandler(getMeHandler));
authRouter.put('/me/presence', requireAuth, asyncHandler(updatePresenceHandler));
authRouter.put('/me/pinned-colleagues', requireAuth, asyncHandler(updatePinnedColleaguesHandler));
authRouter.post('/presence/bulk', requireAuth, asyncHandler(getBulkPresenceHandler));

// Setup
authRouter.post('/complete-setup', requireAuth, asyncHandler(completeSetupHandler));

// Google OAuth
authRouter.get('/google', googleOAuthRedirect);
authRouter.get('/google/callback', asyncHandler(googleOAuthCallback));

// Zoho OAuth
authRouter.get('/zoho', zohoOAuthRedirect);
authRouter.get('/zoho/callback', asyncHandler(zohoOAuthCallback));

import type { Request, Response } from 'express';
import { registerSchema, loginSchema } from './auth.schema.js';
import { AuthService } from './auth.service.js';
import type { ApiResponse } from '@kaaryamitra/shared-types';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env['NODE_ENV'] === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/v1/auth',
};

export async function registerHandler(req: Request, res: Response) {
  const { body } = registerSchema.parse({ body: req.body });
  const result = await AuthService.register(body);

  res.cookie('km_refresh', result.refreshToken, REFRESH_COOKIE_OPTIONS);

  const response: ApiResponse = {
    success: true,
    data: { user: result.user, accessToken: result.accessToken },
    message: 'Account created successfully',
  };
  res.status(201).json(response);
}

export async function loginHandler(req: Request, res: Response) {
  const { body } = loginSchema.parse({ body: req.body });
  const ipAddress = req.ip;
  const userAgent = req.headers['user-agent'];
  const meta: { ipAddress?: string; userAgent?: string } = {};
  if (ipAddress !== undefined) meta.ipAddress = ipAddress;
  if (userAgent !== undefined) meta.userAgent = userAgent;

  const result = await AuthService.login(body, meta);

  res.cookie('km_refresh', result.refreshToken, REFRESH_COOKIE_OPTIONS);

  const response: ApiResponse = {
    success: true,
    data: { user: result.user, accessToken: result.accessToken },
    message: 'Logged in successfully',
  };
  res.json(response);
}

export async function refreshHandler(req: Request, res: Response) {
  const refreshToken = req.cookies['km_refresh'] as string | undefined;
  if (!refreshToken) {
    res.status(401).json({
      success: false,
      error: { code: 'AUTHENTICATION_REQUIRED', message: 'No refresh token' },
    });
    return;
  }

  const result = await AuthService.refreshTokens(refreshToken);
  res.cookie('km_refresh', result.refreshToken, REFRESH_COOKIE_OPTIONS);

  res.json({ success: true, data: { accessToken: result.accessToken } });
}

export async function logoutHandler(req: Request, res: Response) {
  const refreshToken = req.cookies['km_refresh'] as string | undefined;
  if (refreshToken) {
    await AuthService.logout(refreshToken);
  }

  res.clearCookie('km_refresh', { path: '/api/v1/auth' });
  res.json({ success: true, data: null, message: 'Logged out successfully' });
}

export async function getMeHandler(req: Request, res: Response) {
  const user = await AuthService.getMe(req.auth!.userId);
  res.json({ success: true, data: user });
}

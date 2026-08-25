import { Router, Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { authenticate } from '../../middleware/auth';
import { sendSuccess, sendCreated, sendError } from '../../utils/response';
import { z } from 'zod';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  restaurantName: z.string().optional(),
  restaurantAddress: z.string().optional(),
  restaurantPhone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = registerSchema.parse(req.body);
    const result = await authService.register(dto);
    sendCreated(res, result, 'Account created successfully');
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = loginSchema.parse(req.body);
    const result = await authService.login(dto);
    sendSuccess(res, result, 'Login successful');
  } catch (err) {
    next(err);
  }
});

router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) { sendError(res, 'Refresh token required', 400); return; }
    const result = await authService.refreshToken(refreshToken);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

router.post('/forgot-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) { sendError(res, 'Email required', 400); return; }
    await authService.requestPasswordReset(email);
    sendSuccess(res, null, 'If this email exists, a reset link has been sent');
  } catch (err) {
    next(err);
  }
});

router.post('/reset-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) { sendError(res, 'Token and password required', 400); return; }
    await authService.resetPassword(token, password);
    sendSuccess(res, null, 'Password reset successfully');
  } catch (err) {
    next(err);
  }
});

router.get('/profile', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await authService.getProfile(req.user!.id);
    sendSuccess(res, profile);
  } catch (err) {
    next(err);
  }
});

export default router;

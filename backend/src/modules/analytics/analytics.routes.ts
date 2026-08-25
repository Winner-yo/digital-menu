import { Router, Request, Response, NextFunction } from 'express';
import { analyticsService } from './analytics.service';
import { authenticate, authorizeRestaurant } from '../../middleware/auth';
import { sendSuccess } from '../../utils/response';

const router = Router();

router.get('/overview', authenticate, authorizeRestaurant, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await analyticsService.getDashboardOverview(req.user!.restaurantId!);
    sendSuccess(res, data);
  } catch (err) { next(err); }
});

router.get('/sales', authenticate, authorizeRestaurant, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = (req.query.period as 'week' | 'month' | 'year') || 'week';
    const data = await analyticsService.getSalesData(req.user!.restaurantId!, period);
    sendSuccess(res, data);
  } catch (err) { next(err); }
});

router.get('/payments', authenticate, authorizeRestaurant, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await analyticsService.getPaymentBreakdown(req.user!.restaurantId!);
    sendSuccess(res, data);
  } catch (err) { next(err); }
});

router.get('/top-items', authenticate, authorizeRestaurant, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await analyticsService.getTopItems(req.user!.restaurantId!, parseInt(req.query.limit as string || '10'));
    sendSuccess(res, data);
  } catch (err) { next(err); }
});

router.get('/rating', authenticate, authorizeRestaurant, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await analyticsService.getAverageRating(req.user!.restaurantId!);
    sendSuccess(res, data);
  } catch (err) { next(err); }
});

export default router;

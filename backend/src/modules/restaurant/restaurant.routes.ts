import { Router, Request, Response, NextFunction } from 'express';
import { restaurantService } from './restaurant.service';
import { authenticate, authorizeRestaurant } from '../../middleware/auth';
import { sendSuccess, sendCreated } from '../../utils/response';

const router = Router();

// Public: get restaurant profile by slug
router.get('/public/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await restaurantService.getPublicProfile(req.params.slug);
    sendSuccess(res, data);
  } catch (err) { next(err); }
});

// Protected: get own restaurant profile
router.get('/profile', authenticate, authorizeRestaurant, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await restaurantService.getDashboardProfile(req.user!.restaurantId!);
    sendSuccess(res, data);
  } catch (err) { next(err); }
});

// Protected: update restaurant profile
router.put('/profile', authenticate, authorizeRestaurant, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await restaurantService.updateProfile(req.user!.restaurantId!, req.body);
    sendSuccess(res, data, 'Profile updated');
  } catch (err) { next(err); }
});

router.get('/public/:slug/tables', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const restaurant = await restaurantService.getPublicProfile(req.params.slug);
    const tables = await restaurantService.getTables(restaurant.id);
    sendSuccess(res, tables);
  } catch (err) { next(err); }
});

// Get tables
router.get('/tables', authenticate, authorizeRestaurant, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tables = await restaurantService.getTables(req.user!.restaurantId!);
    sendSuccess(res, tables);
  } catch (err) { next(err); }
});

// Create table
router.post('/tables', authenticate, authorizeRestaurant, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tableNumber, capacity } = req.body;
    const table = await restaurantService.createTable(req.user!.restaurantId!, tableNumber, capacity || 4);
    sendCreated(res, table, 'Table created');
  } catch (err) { next(err); }
});

export default router;

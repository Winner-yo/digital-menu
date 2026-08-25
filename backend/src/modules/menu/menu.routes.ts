import { Router, Request, Response, NextFunction } from 'express';
import { menuService } from './menu.service';
import { authenticate, authorizeRestaurant } from '../../middleware/auth';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/response';

const router = Router();

// ---- Public routes ----

// Get full menu for customer view (by restaurant slug)
router.get('/public/:restaurantId/full', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await menuService.getFullMenu(req.params.restaurantId);
    sendSuccess(res, data);
  } catch (err) { next(err); }
});

// Get categories with items for customer
router.get('/public/:restaurantId/categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await menuService.getCategories(req.params.restaurantId, true);
    sendSuccess(res, data);
  } catch (err) { next(err); }
});

// ---- Dashboard routes ----

// Categories
router.get('/categories', authenticate, authorizeRestaurant, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await menuService.getCategories(req.user!.restaurantId!);
    sendSuccess(res, data);
  } catch (err) { next(err); }
});

router.post('/categories', authenticate, authorizeRestaurant, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await menuService.createCategory(req.user!.restaurantId!, req.body);
    sendCreated(res, data, 'Category created');
  } catch (err) { next(err); }
});

router.put('/categories/:id', authenticate, authorizeRestaurant, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await menuService.updateCategory(req.params.id, req.user!.restaurantId!, req.body);
    sendSuccess(res, data, 'Category updated');
  } catch (err) { next(err); }
});

router.delete('/categories/:id', authenticate, authorizeRestaurant, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await menuService.deleteCategory(req.params.id, req.user!.restaurantId!);
    sendSuccess(res, null, 'Category deleted');
  } catch (err) { next(err); }
});

// Menu Items
router.get('/items', authenticate, authorizeRestaurant, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { items, total, page, limit } = await menuService.getMenuItems(
      req.user!.restaurantId!,
      {
        categoryId: req.query.categoryId as string,
        search: req.query.search as string,
        isAvailable: req.query.isAvailable === 'true' ? true : req.query.isAvailable === 'false' ? false : undefined,
        page: parseInt(req.query.page as string || '1'),
        limit: parseInt(req.query.limit as string || '50'),
      }
    );
    sendPaginated(res, items, total, page, limit);
  } catch (err) { next(err); }
});

router.get('/items/:id', authenticate, authorizeRestaurant, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await menuService.getMenuItem(req.params.id, req.user!.restaurantId!);
    sendSuccess(res, data);
  } catch (err) { next(err); }
});

router.post('/items', authenticate, authorizeRestaurant, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await menuService.createMenuItem(req.user!.restaurantId!, req.body);
    sendCreated(res, data, 'Menu item created');
  } catch (err) { next(err); }
});

router.put('/items/:id', authenticate, authorizeRestaurant, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await menuService.updateMenuItem(req.params.id, req.user!.restaurantId!, req.body);
    sendSuccess(res, data, 'Menu item updated');
  } catch (err) { next(err); }
});

router.delete('/items/:id', authenticate, authorizeRestaurant, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await menuService.deleteMenuItem(req.params.id, req.user!.restaurantId!);
    sendSuccess(res, null, 'Menu item deleted');
  } catch (err) { next(err); }
});

router.patch('/items/:id/toggle-availability', authenticate, authorizeRestaurant, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await menuService.toggleAvailability(req.params.id, req.user!.restaurantId!);
    sendSuccess(res, data, `Item ${data.isAvailable ? 'enabled' : 'disabled'}`);
  } catch (err) { next(err); }
});

export default router;

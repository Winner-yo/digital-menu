import { Router, Request, Response, NextFunction } from 'express';
import { orderService } from './order.service';
import { authenticate, authorizeRestaurant } from '../../middleware/auth';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/response';
import { OrderStatus, OrderType } from '@prisma/client';

const router = Router();

// Public: Create order
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await orderService.createOrder(req.body);
    sendCreated(res, order, 'Order placed successfully');
  } catch (err) { next(err); }
});

// Public: Track order by order number
router.get('/track/:orderNumber', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await orderService.getOrder(req.params.orderNumber);
    sendSuccess(res, order);
  } catch (err) { next(err); }
});

// Dashboard: Get restaurant orders
router.get('/', authenticate, authorizeRestaurant, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orders, total, page, limit } = await orderService.getRestaurantOrders(
      req.user!.restaurantId!,
      {
        status: req.query.status as OrderStatus,
        orderType: req.query.orderType as OrderType,
        page: parseInt(req.query.page as string || '1'),
        limit: parseInt(req.query.limit as string || '20'),
        date: req.query.date as string,
        search: req.query.search as string,
      }
    );
    sendPaginated(res, orders, total, page, limit);
  } catch (err) { next(err); }
});

// Dashboard: Get stats
router.get('/stats', authenticate, authorizeRestaurant, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await orderService.getDashboardStats(req.user!.restaurantId!);
    sendSuccess(res, stats);
  } catch (err) { next(err); }
});

// Dashboard: Get single order
router.get('/:id', authenticate, authorizeRestaurant, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await orderService.getOrder(req.params.id, req.user!.restaurantId!);
    sendSuccess(res, order);
  } catch (err) { next(err); }
});

// Dashboard: Update order status
router.patch('/:id/status', authenticate, authorizeRestaurant, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, note } = req.body;
    const result = await orderService.updateOrderStatus(req.params.id, req.user!.restaurantId!, status, note);
    sendSuccess(res, result, `Order status updated to ${status}`);
  } catch (err) { next(err); }
});

export default router;

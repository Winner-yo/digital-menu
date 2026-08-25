import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma/client';
import { authenticate, authorizeRestaurant } from '../../middleware/auth';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/response';

const router = Router();

// Public: Post review
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { restaurantId, menuItemId, orderId, target, rating, comment, customerName, customerPhone } = req.body;

    let customerId: string | undefined;
    if (customerPhone) {
      let customer = await prisma.customer.findFirst({ where: { phone: customerPhone } });
      if (!customer) customer = await prisma.customer.create({ data: { name: customerName || 'Anonymous', phone: customerPhone } });
      customerId = customer.id;
    }

    const review = await prisma.review.create({
      data: { restaurantId, customerId, menuItemId, orderId, target, rating, comment },
    });
    sendCreated(res, review, 'Review submitted');
  } catch (err) { next(err); }
});

// Public: Get restaurant reviews
router.get('/public/:restaurantId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '10');
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { restaurantId: req.params.restaurantId, isPublished: true },
        skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { name: true } } },
      }),
      prisma.review.count({ where: { restaurantId: req.params.restaurantId, isPublished: true } }),
    ]);
    sendPaginated(res, reviews, total, page, limit);
  } catch (err) { next(err); }
});

// Dashboard: Get own reviews
router.get('/', authenticate, authorizeRestaurant, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '20');
    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { restaurantId: req.user!.restaurantId! },
        skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { name: true, phone: true } }, menuItem: { select: { name: true } } },
      }),
      prisma.review.count({ where: { restaurantId: req.user!.restaurantId! } }),
    ]);
    sendPaginated(res, reviews, total, page, limit);
  } catch (err) { next(err); }
});

// Dashboard: Reply to review
router.patch('/:id/reply', authenticate, authorizeRestaurant, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = await prisma.review.update({
      where: { id: req.params.id },
      data: { ownerReply: req.body.reply },
    });
    sendSuccess(res, updated, 'Reply added');
  } catch (err) { next(err); }
});

export default router;

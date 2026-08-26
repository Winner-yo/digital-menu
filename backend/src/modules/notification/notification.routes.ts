import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma/client';
import { authenticate, authorizeRestaurant } from '../../middleware/auth';
import { sendSuccess } from '../../utils/response';

const router = Router();

router.get('/', authenticate, authorizeRestaurant, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { restaurantId: req.user!.restaurantId! },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    sendSuccess(res, notifications);
  } catch (err) { next(err); }
});

router.patch('/:id/read', authenticate, authorizeRestaurant, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });
    sendSuccess(res, notification);
  } catch (err) { next(err); }
});

router.post('/read-all', authenticate, authorizeRestaurant, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.updateMany({
      where: { restaurantId: req.user!.restaurantId!, isRead: false },
      data: { isRead: true },
    });
    sendSuccess(res, null, 'All notifications marked as read');
  } catch (err) { next(err); }
});

export default router;

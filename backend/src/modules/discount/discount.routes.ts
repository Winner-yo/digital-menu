import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma/client';
import { authenticate, authorizeRestaurant } from '../../middleware/auth';
import { sendSuccess, sendCreated, sendError } from '../../utils/response';

const router = Router();

// Get all discounts
router.get('/', authenticate, authorizeRestaurant, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const discounts = await prisma.discount.findMany({
      where: { restaurantId: req.user!.restaurantId! },
      orderBy: { createdAt: 'desc' },
    });
    sendSuccess(res, discounts);
  } catch (err) { next(err); }
});

// Create discount
router.post('/', authenticate, authorizeRestaurant, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const discount = await prisma.discount.create({
      data: { restaurantId: req.user!.restaurantId!, ...req.body },
    });
    sendCreated(res, discount, 'Discount created');
  } catch (err) { next(err); }
});

// Update discount
router.put('/:id', authenticate, authorizeRestaurant, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const discount = await prisma.discount.update({
      where: { id: req.params.id },
      data: req.body,
    });
    sendSuccess(res, discount, 'Discount updated');
  } catch (err) { next(err); }
});

// Delete discount
router.delete('/:id', authenticate, authorizeRestaurant, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.discount.delete({ where: { id: req.params.id } });
    sendSuccess(res, null, 'Discount deleted');
  } catch (err) { next(err); }
});

// Promo codes
router.get('/promo-codes', authenticate, authorizeRestaurant, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const codes = await prisma.promoCode.findMany({
      where: { restaurantId: req.user!.restaurantId! },
      orderBy: { createdAt: 'desc' },
    });
    sendSuccess(res, codes);
  } catch (err) { next(err); }
});

router.post('/promo-codes', authenticate, authorizeRestaurant, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const code = await prisma.promoCode.create({
      data: {
        restaurantId: req.user!.restaurantId!,
        ...req.body,
        code: (req.body.code as string).toUpperCase(),
      },
    });
    sendCreated(res, code, 'Promo code created');
  } catch (err) { next(err); }
});

// Validate promo (public)
router.post('/validate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { restaurantId, code, orderTotal } = req.body;
    const promo = await prisma.promoCode.findFirst({
      where: {
        restaurantId,
        code: code.toUpperCase(),
        isActive: true,
        OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
      },
    });
    if (!promo) { sendError(res, 'Invalid or expired promo code', 400); return; }
    if (promo.usageLimit && promo.usageCount >= promo.usageLimit) {
      sendError(res, 'Promo code usage limit reached', 400); return;
    }
    if (orderTotal < promo.minimumOrder) {
      sendError(res, `Minimum order of ${promo.minimumOrder} ETB required`, 400); return;
    }

    let discount = 0;
    if (promo.discountType === 'PERCENTAGE') {
      discount = (orderTotal * promo.discountValue) / 100;
      if (promo.maxDiscount) discount = Math.min(discount, promo.maxDiscount);
    } else {
      discount = promo.discountValue;
    }

    sendSuccess(res, { valid: true, discount, promo });
  } catch (err) { next(err); }
});

export default router;

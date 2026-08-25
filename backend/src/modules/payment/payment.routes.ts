import { Router, Request, Response, NextFunction } from 'express';
import { paymentService } from './payment.service';
import { authenticate, authorizeRestaurant } from '../../middleware/auth';
import { sendSuccess, sendError } from '../../utils/response';
import { PaymentMethod } from '@prisma/client';
import { env } from '../../config/env';

const router = Router();

// Initiate payment (public – customer initiates after placing order)
router.post('/initiate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId, method, returnUrl } = req.body;
    if (!orderId || !method) { sendError(res, 'orderId and method required', 400); return; }

    const validMethods = Object.values(PaymentMethod);
    if (!validMethods.includes(method)) {
      sendError(res, `Invalid payment method. Allowed: ${validMethods.join(', ')}`, 400);
      return;
    }

    const result = await paymentService.initiatePayment(
      orderId,
      method as PaymentMethod,
      returnUrl || `${env.FRONTEND_URL}/payment/callback`
    );
    sendSuccess(res, result, 'Payment initiated');
  } catch (err) { next(err); }
});

// Verify payment (public – called after redirect back from provider)
router.post('/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { referenceId } = req.body;
    if (!referenceId) { sendError(res, 'referenceId required', 400); return; }
    const result = await paymentService.verifyPayment(referenceId);
    sendSuccess(res, result, result.paid ? 'Payment confirmed' : 'Payment pending');
  } catch (err) { next(err); }
});

// Mock confirm (dev/test only)
router.post('/mock/confirm', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { referenceId } = req.body;
    const result = await paymentService.confirmMockPayment(referenceId);
    sendSuccess(res, result, 'Mock payment confirmed');
  } catch (err) { next(err); }
});

// Get payment for an order (protected)
router.get('/order/:orderId', authenticate, authorizeRestaurant, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payment = await paymentService.getPaymentByOrder(req.params.orderId);
    sendSuccess(res, payment);
  } catch (err) { next(err); }
});

// Webhooks – raw body needed for signature verification
router.post('/webhook/:provider', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature =
      (req.headers['x-chapa-signature'] ||
       req.headers['x-telebirr-sign'] ||
       req.headers['x-cbe-signature'] || '') as string;

    await paymentService.handleWebhook(
      req.params.provider,
      JSON.stringify(req.body),
      signature,
      req.body
    );
    res.json({ received: true });
  } catch (err) { next(err); }
});

export default router;

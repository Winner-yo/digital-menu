import { prisma } from '../../prisma/client';
import { AppError } from '../../middleware/errorHandler';
import { mockPaymentProvider } from './providers/mock.provider';
import { chapaProvider } from './providers/chapa.provider';
import { telebirrProvider } from './providers/telebirr.provider';
import { cbeBirrProvider } from './providers/cbebirr.provider';
import { PaymentMethod, PaymentStatus, PaymentProvider, OrderStatus } from '@prisma/client';
import { env } from '../../config/env';

const providers = {
  MOCK: mockPaymentProvider,
  CHAPA: chapaProvider,
  TELEBIRR: telebirrProvider,
  CBE_BIRR: cbeBirrProvider,
};

function getProvider(method: PaymentMethod) {
  if (env.USE_MOCK_PAYMENT) return providers.MOCK;
  switch (method) {
    case PaymentMethod.TELEBIRR: return providers.TELEBIRR;
    case PaymentMethod.CBE_BIRR: return providers.CBE_BIRR;
    case PaymentMethod.CHAPA: return providers.CHAPA;
    default: return providers.MOCK;
  }
}

export const paymentService = {
  async initiatePayment(orderId: string, method: PaymentMethod, returnUrl: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true, restaurant: { select: { name: true } } },
    });
    if (!order) throw new AppError('Order not found', 404);
    if (order.payment?.status === PaymentStatus.PAID) throw new AppError('Order already paid', 400);

    const provider = getProvider(method);
    const providerName = env.USE_MOCK_PAYMENT ? PaymentProvider.MOCK : (method as unknown as PaymentProvider);

    const result = await provider.initiate({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: order.total,
      currency: 'ETB',
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail || undefined,
      returnUrl,
      description: `${order.restaurant.name} – Order ${order.orderNumber}`,
    });

    // Upsert payment record
    const payment = await prisma.payment.upsert({
      where: { orderId },
      create: {
        orderId,
        restaurantId: order.restaurantId,
        method,
        provider: providerName,
        amount: order.total,
        currency: 'ETB',
        status: PaymentStatus.PENDING,
        referenceId: result.referenceId,
        checkoutUrl: result.checkoutUrl,
      },
      update: {
        method,
        provider: providerName,
        status: PaymentStatus.PENDING,
        referenceId: result.referenceId,
        checkoutUrl: result.checkoutUrl,
      },
    });

    // Log transaction
    await prisma.transaction.create({
      data: {
        paymentId: payment.id,
        type: 'INITIATE',
        status: result.success ? 'SUCCESS' : 'FAILED',
        response: result as unknown as Record<string, unknown>,
      },
    });

    return { payment, checkoutUrl: result.checkoutUrl, referenceId: result.referenceId };
  },

  async verifyPayment(referenceId: string) {
    const payment = await prisma.payment.findFirst({
      where: { referenceId },
      include: { order: true },
    });
    if (!payment) throw new AppError('Payment not found', 404);

    const provider = getProvider(payment.method);
    const result = await provider.verify(referenceId);

    const newStatus =
      result.status === 'PAID' ? PaymentStatus.PAID :
      result.status === 'PENDING' ? PaymentStatus.PROCESSING :
      result.status === 'CANCELLED' ? PaymentStatus.CANCELLED :
      result.status === 'EXPIRED' ? PaymentStatus.EXPIRED :
      PaymentStatus.FAILED;

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: newStatus,
          providerTxId: result.providerTxId,
          paidAt: result.paidAt,
          failureReason: result.status !== 'PAID' ? result.message : null,
        },
      });

      await tx.transaction.create({
        data: {
          paymentId: payment.id,
          type: 'VERIFY',
          status: result.status,
          response: result as unknown as Record<string, unknown>,
        },
      });

      // Update order status
      if (newStatus === PaymentStatus.PAID) {
        await tx.order.update({
          where: { id: payment.orderId },
          data: { status: OrderStatus.CONFIRMED, confirmedAt: new Date() },
        });
        await tx.orderStatusHistory.create({
          data: { orderId: payment.orderId, status: OrderStatus.CONFIRMED, note: 'Payment confirmed' },
        });
      }
    });

    return { status: newStatus, paid: newStatus === PaymentStatus.PAID };
  },

  async handleWebhook(provider: string, payload: string, signature: string, body: Record<string, unknown>) {
    // Verify signature
    const prov = providers[provider.toUpperCase() as keyof typeof providers];
    if (!prov) throw new AppError('Unknown provider', 400);

    const valid = prov.verifyWebhookSignature(payload, signature);
    if (!valid) throw new AppError('Invalid webhook signature', 401);

    // Extract reference ID from webhook body
    const txRef = (body.tx_ref || body.reference || body.out_trade_no || body.requestId) as string;
    if (!txRef) return { received: true };

    await this.verifyPayment(txRef);
    return { received: true };
  },

  async getPaymentByOrder(orderId: string) {
    return prisma.payment.findUnique({
      where: { orderId },
      include: { transactions: { orderBy: { createdAt: 'desc' } } },
    });
  },

  // Mock payment confirmation (for demo/testing)
  async confirmMockPayment(referenceId: string) {
    if (!env.USE_MOCK_PAYMENT && env.NODE_ENV === 'production') {
      throw new AppError('Mock payments disabled in production', 400);
    }
    return this.verifyPayment(referenceId);
  },
};

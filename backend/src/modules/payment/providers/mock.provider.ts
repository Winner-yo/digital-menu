/**
 * MOCK PAYMENT PROVIDER
 * For development and testing only.
 * Simulates payment flows without real API calls.
 */

import { v4 as uuidv4 } from 'uuid';

export interface PaymentInitParams {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  returnUrl: string;
  cancelUrl?: string;
  description?: string;
}

export interface PaymentInitResult {
  success: boolean;
  referenceId: string;
  providerTxId?: string;
  checkoutUrl?: string;
  expiresAt?: Date;
  message?: string;
}

export interface PaymentVerifyResult {
  success: boolean;
  status: 'PAID' | 'FAILED' | 'PENDING' | 'CANCELLED' | 'EXPIRED';
  providerTxId?: string;
  paidAt?: Date;
  amount?: number;
  message?: string;
}

export const mockPaymentProvider = {
  name: 'MOCK' as const,

  async initiate(params: PaymentInitParams): Promise<PaymentInitResult> {
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 300));

    const referenceId = `MOCK-${uuidv4().toUpperCase().slice(0, 8)}`;
    const checkoutUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/mock?ref=${referenceId}&amount=${params.amount}&order=${params.orderNumber}`;

    return {
      success: true,
      referenceId,
      providerTxId: `TX-MOCK-${Date.now()}`,
      checkoutUrl,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min
      message: 'Mock payment initiated',
    };
  },

  async verify(referenceId: string): Promise<PaymentVerifyResult> {
    await new Promise((r) => setTimeout(r, 200));

    // Always return success for mock (in real usage, check a status store)
    return {
      success: true,
      status: 'PAID',
      providerTxId: `TX-MOCK-${Date.now()}`,
      paidAt: new Date(),
      message: 'Mock payment verified successfully',
    };
  },

  verifyWebhookSignature(_payload: string, _signature: string): boolean {
    // Mock always passes
    return true;
  },
};

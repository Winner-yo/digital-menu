/**
 * CBE BIRR PAYMENT PROVIDER
 * Integration with Commercial Bank of Ethiopia CBE Birr
 * When USE_MOCK_PAYMENT=true, falls back to mock provider.
 */

import axios from 'axios';
import crypto from 'crypto';
import { env } from '../../../config/env';
import { PaymentInitParams, PaymentInitResult, PaymentVerifyResult } from './mock.provider';

const cbeApi = axios.create({
  baseURL: env.CBE_BIRR_BASE_URL,
  headers: {
    'X-API-Key': env.CBE_BIRR_API_KEY,
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

export const cbeBirrProvider = {
  name: 'CBE_BIRR' as const,

  async initiate(params: PaymentInitParams): Promise<PaymentInitResult> {
    if (env.USE_MOCK_PAYMENT || !env.CBE_BIRR_API_KEY || !env.CBE_BIRR_MERCHANT_ID) {
      console.warn('[CBE Birr] No credentials – falling back to mock');
      const { mockPaymentProvider } = await import('./mock.provider');
      return mockPaymentProvider.initiate(params);
    }

    try {
      const requestId = `CBE-${params.orderNumber}-${Date.now()}`;
      const callbackUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payments/webhook/cbebirr`;

      const payload = {
        merchantId: env.CBE_BIRR_MERCHANT_ID,
        requestId,
        amount: params.amount.toFixed(2),
        currency: 'ETB',
        customerMobile: params.customerPhone,
        description: params.description || `Order ${params.orderNumber}`,
        callbackUrl,
        returnUrl: params.returnUrl,
        orderId: params.orderId,
      };

      const response = await cbeApi.post('/payment/initiate', payload);

      if (response.data.responseCode === '00') {
        return {
          success: true,
          referenceId: requestId,
          providerTxId: response.data.transactionId,
          checkoutUrl: response.data.paymentUrl,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
          message: 'CBE Birr payment initialized',
        };
      }

      return {
        success: false,
        referenceId: requestId,
        message: response.data.responseMessage || 'CBE Birr initiation failed',
      };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { responseMessage?: string } }; message?: string };
      throw new Error(`CBE Birr init failed: ${error.response?.data?.responseMessage || error.message}`);
    }
  },

  async verify(referenceId: string): Promise<PaymentVerifyResult> {
    if (env.USE_MOCK_PAYMENT || !env.CBE_BIRR_API_KEY) {
      const { mockPaymentProvider } = await import('./mock.provider');
      return mockPaymentProvider.verify(referenceId);
    }

    try {
      const response = await cbeApi.get(`/payment/status/${referenceId}`);
      const data = response.data;

      if (data.status === 'COMPLETED' || data.responseCode === '00') {
        return {
          success: true,
          status: 'PAID',
          providerTxId: data.transactionId,
          paidAt: new Date(data.completedAt || Date.now()),
          amount: parseFloat(data.amount),
        };
      }

      if (data.status === 'PENDING') {
        return { success: false, status: 'PENDING', message: 'Payment pending' };
      }

      return { success: false, status: 'FAILED', message: data.message };
    } catch (err: unknown) {
      const error = err as { message?: string };
      throw new Error(`CBE Birr verify failed: ${error.message}`);
    }
  },

  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!env.CBE_BIRR_API_KEY) return true;
    const hash = crypto.createHmac('sha256', env.CBE_BIRR_API_KEY).update(payload).digest('hex');
    return hash === signature;
  },
};

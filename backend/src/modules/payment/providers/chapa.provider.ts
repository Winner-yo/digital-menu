/**
 * CHAPA PAYMENT PROVIDER
 * Production integration with Chapa (https://chapa.co)
 * Chapa supports Telebirr, CBE Birr, and bank transfers as sub-methods.
 * Docs: https://developer.chapa.co/docs
 */

import axios from 'axios';
import crypto from 'crypto';
import { env } from '../../../config/env';
import { PaymentInitParams, PaymentInitResult, PaymentVerifyResult } from './mock.provider';

const chapaApi = axios.create({
  baseURL: env.CHAPA_BASE_URL,
  headers: {
    Authorization: `Bearer ${env.CHAPA_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

export const chapaProvider = {
  name: 'CHAPA' as const,

  async initiate(params: PaymentInitParams): Promise<PaymentInitResult> {
    if (env.USE_MOCK_PAYMENT || !env.CHAPA_SECRET_KEY) {
      console.warn('[Chapa] No credentials – falling back to mock');
      const { mockPaymentProvider } = await import('./mock.provider');
      return mockPaymentProvider.initiate(params);
    }

    try {
      const txRef = `ETH-MENU-${params.orderNumber}-${Date.now()}`;

      const payload = {
        amount: params.amount.toFixed(2),
        currency: params.currency || 'ETB',
        email: params.customerEmail || `${params.customerPhone}@placeholder.com`,
        first_name: params.customerName.split(' ')[0] || params.customerName,
        last_name: params.customerName.split(' ').slice(1).join(' ') || 'Customer',
        phone_number: params.customerPhone,
        tx_ref: txRef,
        callback_url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payments/webhook/chapa`,
        return_url: params.returnUrl,
        title: 'Food Order Payment',
        description: params.description || `Order ${params.orderNumber}`,
        meta: { order_id: params.orderId, order_number: params.orderNumber },
      };

      const response = await chapaApi.post('/transaction/initialize', payload);

      if (response.data.status === 'success') {
        return {
          success: true,
          referenceId: txRef,
          checkoutUrl: response.data.data.checkout_url,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
          message: 'Chapa payment initialized',
        };
      }

      return { success: false, referenceId: txRef, message: response.data.message };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      throw new Error(`Chapa init failed: ${error.response?.data?.message || error.message}`);
    }
  },

  async verify(referenceId: string): Promise<PaymentVerifyResult> {
    if (env.USE_MOCK_PAYMENT || !env.CHAPA_SECRET_KEY) {
      const { mockPaymentProvider } = await import('./mock.provider');
      return mockPaymentProvider.verify(referenceId);
    }

    try {
      const response = await chapaApi.get(`/transaction/verify/${referenceId}`);
      const data = response.data.data;

      if (data.status === 'success') {
        return {
          success: true,
          status: 'PAID',
          providerTxId: data.id,
          paidAt: new Date(data.created_at),
          amount: parseFloat(data.amount),
          message: 'Payment verified',
        };
      }

      if (data.status === 'pending') {
        return { success: false, status: 'PENDING', message: 'Payment pending' };
      }

      return { success: false, status: 'FAILED', message: data.status };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      throw new Error(`Chapa verify failed: ${error.response?.data?.message || error.message}`);
    }
  },

  verifyWebhookSignature(payload: string, chapaSignature: string): boolean {
    if (!env.CHAPA_WEBHOOK_SECRET) return true; // Skip in dev
    const hash = crypto
      .createHmac('sha256', env.CHAPA_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');
    return hash === chapaSignature;
  },
};

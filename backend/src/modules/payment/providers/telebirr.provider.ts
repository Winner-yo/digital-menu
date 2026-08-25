/**
 * TELEBIRR PAYMENT PROVIDER
 * Integration with Ethio Telecom Telebirr
 * Docs: https://developer.ethiotelecom.et
 *
 * NOTE: Requires RSA encryption of payload with Telebirr's public key.
 * When USE_MOCK_PAYMENT=true, falls back to mock provider.
 */

import crypto from 'crypto';
import axios from 'axios';
import { env } from '../../../config/env';
import { PaymentInitParams, PaymentInitResult, PaymentVerifyResult } from './mock.provider';

const telebirrApi = axios.create({
  baseURL: env.TELEBIRR_BASE_URL,
  timeout: 30000,
});

function encryptWithRSA(data: string, publicKey: string): string {
  return crypto.publicEncrypt(
    { key: publicKey, padding: crypto.constants.RSA_PKCS1_PADDING },
    Buffer.from(data)
  ).toString('base64');
}

function buildUssdPayload(params: PaymentInitParams, notifyUrl: string, returnUrl: string) {
  const timestamp = Date.now().toString();
  const nonce = crypto.randomBytes(8).toString('hex');

  const rawData = {
    appid: env.TELEBIRR_APP_ID,
    merch_code: env.TELEBIRR_SHORT_CODE,
    nonce,
    notify_url: notifyUrl,
    out_trade_no: params.orderNumber,
    receiver: env.TELEBIRR_SHORT_CODE,
    return_url: returnUrl,
    subject: params.description || `Order ${params.orderNumber}`,
    timeout_express: '30m',
    timestamp,
    total_amount: params.amount.toFixed(2),
  };

  return rawData;
}

export const telebirrProvider = {
  name: 'TELEBIRR' as const,

  async initiate(params: PaymentInitParams): Promise<PaymentInitResult> {
    if (env.USE_MOCK_PAYMENT || !env.TELEBIRR_APP_ID || !env.TELEBIRR_PUBLIC_KEY) {
      console.warn('[Telebirr] No credentials – falling back to mock');
      const { mockPaymentProvider } = await import('./mock.provider');
      return mockPaymentProvider.initiate(params);
    }

    try {
      const notifyUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payments/webhook/telebirr`;
      const rawData = buildUssdPayload(params, notifyUrl, params.returnUrl);

      // Sort and sign
      const sortedStr = Object.entries(rawData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join('&') + `&key=${env.TELEBIRR_APP_KEY}`;

      const sign = crypto.createHash('sha256').update(sortedStr).digest('hex').toUpperCase();
      const encryptedPayload = encryptWithRSA(JSON.stringify({ ...rawData, sign }), env.TELEBIRR_PUBLIC_KEY);

      const response = await telebirrApi.post('/paygate/api/v1/toPay', {
        appid: env.TELEBIRR_APP_ID,
        sign,
        ussd: encryptedPayload,
      }, {
        headers: {
          'X-APP-Key': env.TELEBIRR_APP_KEY,
        },
      });

      if (response.data.code === '0') {
        return {
          success: true,
          referenceId: rawData.nonce,
          checkoutUrl: response.data.data.toPayUrl,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
          message: 'Telebirr payment initialized',
        };
      }

      return { success: false, referenceId: rawData.nonce, message: response.data.msg };
    } catch (err: unknown) {
      const error = err as { response?: { data?: unknown }; message?: string };
      console.error('[Telebirr] Init error:', error.response?.data || error.message);
      throw new Error(`Telebirr init failed: ${error.message}`);
    }
  },

  async verify(referenceId: string): Promise<PaymentVerifyResult> {
    if (env.USE_MOCK_PAYMENT || !env.TELEBIRR_APP_ID) {
      const { mockPaymentProvider } = await import('./mock.provider');
      return mockPaymentProvider.verify(referenceId);
    }

    try {
      const response = await telebirrApi.post('/paygate/api/v1/queryTrade', {
        appid: env.TELEBIRR_APP_ID,
        out_trade_no: referenceId,
      }, {
        headers: { 'X-APP-Key': env.TELEBIRR_APP_KEY },
      });

      const data = response.data.data;
      if (data?.trade_status === 'TRADE_SUCCESS') {
        return {
          success: true,
          status: 'PAID',
          providerTxId: data.trade_no,
          paidAt: new Date(),
          amount: parseFloat(data.total_amount),
        };
      }

      return { success: false, status: 'PENDING', message: data?.trade_status };
    } catch (err: unknown) {
      const error = err as { message?: string };
      throw new Error(`Telebirr verify failed: ${error.message}`);
    }
  },

  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!env.TELEBIRR_APP_KEY) return true;
    const hash = crypto.createHash('sha256').update(payload + env.TELEBIRR_APP_KEY).digest('hex').toUpperCase();
    return hash === signature;
  },
};

import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export const generateOrderNumber = (): string => {
  const date = new Date();
  const yy = date.getFullYear().toString().slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 9000 + 1000);
  return `ORD-${yy}${mm}${dd}-${random}`;
};

export const generateQRCode = (): string => {
  return `QR-${uuidv4().replace(/-/g, '').toUpperCase().slice(0, 12)}`;
};

export const generateToken = (length = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

export const generateOTP = (length = 6): string => {
  return Math.floor(Math.random() * Math.pow(10, length))
    .toString()
    .padStart(length, '0');
};

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const formatETB = (amount: number): string => {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const getPaginationParams = (
  query: Record<string, string | undefined>
): { page: number; limit: number; skip: number } => {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const hashWebhookPayload = (payload: string, secret: string): string => {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
};

export const isValidEthiopianPhone = (phone: string): boolean => {
  // Ethiopian phone numbers: +251XXXXXXXXX or 09XXXXXXXX or 07XXXXXXXX
  const cleaned = phone.replace(/\s+/g, '');
  return /^(\+251|0)(9|7)\d{8}$/.test(cleaned);
};

export const normalizePhone = (phone: string): string => {
  const cleaned = phone.replace(/\s+/g, '');
  if (cleaned.startsWith('0')) {
    return '+251' + cleaned.slice(1);
  }
  return cleaned;
};

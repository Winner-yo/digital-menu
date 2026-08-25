import dotenv from 'dotenv';
dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  DATABASE_URL: process.env.DATABASE_URL || '',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'dev_jwt_secret_change_in_production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_in_production',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',

  // Frontend URL
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Upload
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB

  // Email
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@ethiopian-menu.com',

  // Payment
  PAYMENT_PROVIDER: process.env.PAYMENT_PROVIDER || 'mock',
  USE_MOCK_PAYMENT: process.env.USE_MOCK_PAYMENT !== 'false',

  // Telebirr
  TELEBIRR_APP_ID: process.env.TELEBIRR_APP_ID || '',
  TELEBIRR_APP_KEY: process.env.TELEBIRR_APP_KEY || '',
  TELEBIRR_PUBLIC_KEY: process.env.TELEBIRR_PUBLIC_KEY || '',
  TELEBIRR_SHORT_CODE: process.env.TELEBIRR_SHORT_CODE || '',
  TELEBIRR_BASE_URL: process.env.TELEBIRR_BASE_URL || 'https://app.ethiotelecom.et',

  // CBE Birr
  CBE_BIRR_API_KEY: process.env.CBE_BIRR_API_KEY || '',
  CBE_BIRR_MERCHANT_ID: process.env.CBE_BIRR_MERCHANT_ID || '',
  CBE_BIRR_BASE_URL: process.env.CBE_BIRR_BASE_URL || 'https://api.cbebirr.com',

  // Chapa
  CHAPA_SECRET_KEY: process.env.CHAPA_SECRET_KEY || '',
  CHAPA_BASE_URL: process.env.CHAPA_BASE_URL || 'https://api.chapa.co/v1',
  CHAPA_WEBHOOK_SECRET: process.env.CHAPA_WEBHOOK_SECRET || '',

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
};

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { env } from './config/env';
import { errorHandler, notFound } from './middleware/errorHandler';
import { prisma } from './prisma/client';

// Route imports
import authRoutes from './modules/auth/auth.routes';
import restaurantRoutes from './modules/restaurant/restaurant.routes';
import menuRoutes from './modules/menu/menu.routes';
import orderRoutes from './modules/order/order.routes';
import paymentRoutes from './modules/payment/payment.routes';
import qrCodeRoutes from './modules/qrcode/qrcode.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import reviewRoutes from './modules/review/review.routes';
import discountRoutes from './modules/discount/discount.routes';
import uploadRoutes from './modules/upload/upload.routes';

const app = express();
const httpServer = createServer(app);

// Socket.IO for real-time order updates
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: env.FRONTEND_URL,
    credentials: true,
  },
});

// Make io available to routes
app.set('io', io);

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: [env.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later',
});

// Stricter limit for auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: 'Too many auth attempts',
});

app.use(limiter);
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cookieParser());

// Parse JSON for most routes (raw body preserved for webhooks)
app.use('/api/payments/webhook', express.raw({ type: '*/*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(process.cwd(), env.UPLOAD_DIR)));

// ============================================================
// ROUTES
// ============================================================

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    env: env.NODE_ENV,
  });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/qrcodes', qrCodeRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/upload', uploadRoutes);

// ============================================================
// SOCKET.IO
// ============================================================

io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  socket.on('join-restaurant', (restaurantId: string) => {
    socket.join(`restaurant:${restaurantId}`);
    console.log(`[Socket] ${socket.id} joined restaurant:${restaurantId}`);
  });

  socket.on('join-order', (orderNumber: string) => {
    socket.join(`order:${orderNumber}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// Export io for use in services
export { io };

// ============================================================
// ERROR HANDLING
// ============================================================

app.use(notFound);
app.use(errorHandler);

// ============================================================
// START SERVER
// ============================================================

async function bootstrap() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    httpServer.listen(env.PORT, () => {
      console.log(`🚀 Server running on http://localhost:${env.PORT}`);
      console.log(`📊 Environment: ${env.NODE_ENV}`);
      console.log(`💳 Mock payments: ${env.USE_MOCK_PAYMENT ? 'ENABLED' : 'DISABLED'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

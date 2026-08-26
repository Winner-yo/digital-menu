import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './prisma/client';

const app = createApp();
const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: env.FRONTEND_URL,
    credentials: true,
  },
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  socket.on('join-restaurant', (restaurantId: string) => {
    socket.join(`restaurant:${restaurantId}`);
  });

  socket.on('join-order', (orderNumber: string) => {
    socket.join(`order:${orderNumber}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

export { io, app };

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

if (!process.env.VERCEL) {
  bootstrap();
}

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

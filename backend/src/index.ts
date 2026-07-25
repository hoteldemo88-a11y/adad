import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import formbody from '@fastify/formbody';
import { config } from './config';
import { connectDatabase, disconnectDatabase, prisma } from './config/database';
import bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/request-logger';
import authRoutes from './routes/auth';
import devicesRoutes from './routes/devices';
import contactsRoutes from './routes/contacts';
import callsRoutes from './routes/calls';
import smsRoutes from './routes/sms';
import dashboardRoutes from './routes/dashboard';
import notificationsRoutes from './routes/notifications';
import settingsRoutes from './routes/settings';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { id?: string; email?: string; type?: string; deviceId?: string; parentId?: string };
    user: { id?: string; email?: string; type?: string; deviceId?: string; parentId?: string };
  }
}

async function buildServer() {
  const fastify = Fastify({
    logger: {
      level: config.nodeEnv === 'production' ? 'info' : 'debug',
      transport: config.nodeEnv === 'development' ? {
        target: 'pino-pretty',
        options: { colorize: true },
      } : undefined,
    },
  });

  await fastify.register(cors, {
    origin: config.cors.origin,
    credentials: true,
  });

  await fastify.register(helmet, {
    contentSecurityPolicy: config.nodeEnv === 'production',
  });

  await fastify.register(rateLimit, {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.windowMs,
    errorResponseBuilder: () => ({
      success: false,
      message: 'Too many requests, please try again later',
    }),
  });

  await fastify.register(jwt, {
    secret: config.jwt.secret,
  });

  await fastify.register(formbody);

  fastify.setErrorHandler(errorHandler);
  fastify.addHook('onResponse', requestLogger);

  await fastify.register(authRoutes, { prefix: '/api/auth' });
  await fastify.register(devicesRoutes, { prefix: '/api/devices' });
  await fastify.register(contactsRoutes, { prefix: '/api/contacts' });
  await fastify.register(callsRoutes, { prefix: '/api/calls' });
  await fastify.register(smsRoutes, { prefix: '/api/sms' });
  await fastify.register(dashboardRoutes, { prefix: '/api/dashboard' });
  await fastify.register(notificationsRoutes, { prefix: '/api/notifications' });
  await fastify.register(settingsRoutes, { prefix: '/api/settings' });

  fastify.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });

  return fastify;
}

async function autoSeed(): Promise<void> {
  try {
    const parentCount = await prisma.parent.count();
    if (parentCount > 0) {
      console.log('Database already seeded, skipping.');
      return;
    }

    console.log('Database is empty, seeding...');

    const passwordHash = await bcrypt.hash('Test1234!', 12);
    const genHash = (data: string) => crypto.createHash('md5').update(data).digest('hex');

    const parent = await prisma.parent.create({
      data: { email: 'parent@example.com', passwordHash, name: 'John Doe', phone: '+1-555-0000' },
    });

    const device = await prisma.childDevice.create({
      data: {
        name: 'Samsung Galaxy S24', model: 'Galaxy S24', manufacturer: 'Samsung',
        androidVersion: 'Android 14', pairingCode: '123456', parentId: parent.id,
        isOnline: true, lastSyncAt: new Date(), batteryLevel: 85,
        storageTotal: BigInt(128 * 1024 * 1024 * 1024), storageUsed: BigInt(64 * 1024 * 1024 * 1024),
      },
    });

    const contacts = [
      { name: 'Mom', phoneNumber: '+1-555-0101', email: 'mom@example.com', isFavorite: true },
      { name: 'Dad', phoneNumber: '+1-555-0102', email: 'dad@example.com', isFavorite: true },
      { name: 'Unknown Caller', phoneNumber: '+1-555-0200', isFavorite: false },
      { name: 'Best Friend Alex', phoneNumber: '+1-555-0301', email: 'alex@example.com', isFavorite: false },
      { name: 'School Office', phoneNumber: '+1-555-0400', isFavorite: false },
    ];

    await prisma.contact.createMany({
      data: contacts.map(c => ({
        deviceId: device.id, ...c, email: c.email || null,
        syncHash: genHash(`${c.name}${c.phoneNumber}`),
      })),
    });

    const now = Date.now();
    const calls = [
      { contactName: 'Mom', phoneNumber: '+1-555-0101', type: 'OUTGOING' as const, duration: 342, offset: 1 },
      { contactName: 'Dad', phoneNumber: '+1-555-0102', type: 'INCOMING' as const, duration: 125, offset: 3 },
      { contactName: 'Unknown Caller', phoneNumber: '+1-555-0200', type: 'MISSED' as const, duration: 0, offset: 5 },
      { contactName: 'Best Friend Alex', phoneNumber: '+1-555-0301', type: 'OUTGOING' as const, duration: 890, offset: 8 },
    ];

    await prisma.callLog.createMany({
      data: calls.map(c => ({
        deviceId: device.id, ...c,
        timestamp: new Date(now - c.offset * 3600000),
        syncHash: genHash(`${c.contactName}${c.phoneNumber}${c.type}${c.duration}`),
      })),
    });

    const sms = [
      { senderNumber: '+1-555-0101', recipientNumber: '+1-555-0000', body: "Hi Mom, I'll be home by 5pm today.", type: 'OUTGOING' as const, offset: 2 },
      { senderNumber: '+1-555-0101', recipientNumber: '+1-555-0000', body: "Ok sweetie, don't forget to pick up milk!", type: 'INCOMING' as const, offset: 2 },
      { senderNumber: '+1-555-0301', recipientNumber: '+1-555-0000', body: 'Hey! Want to hang out after school tomorrow?', type: 'INCOMING' as const, offset: 4 },
    ];

    await prisma.smsMessage.createMany({
      data: sms.map(s => ({
        deviceId: device.id, ...s,
        timestamp: new Date(now - s.offset * 3600000),
        syncHash: genHash(`${s.type}${s.body}`),
      })),
    });

    console.log('Seeding complete! Parent: parent@example.com / Test1234! | Pairing code: 123456');
  } catch (error) {
    console.error('Auto-seed failed:', error);
  }
}

async function start() {
  try {
    await connectDatabase();
    await autoSeed();

    const server = await buildServer();

    await server.listen({ port: config.port, host: '0.0.0.0' });

    console.log(`Server running on port ${config.port}`);
    console.log(`Environment: ${config.nodeEnv}`);

    const shutdown = async (signal: string) => {
      console.log(`${signal} received. Starting graceful shutdown...`);
      await server.close();
      await disconnectDatabase();
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

export { buildServer };

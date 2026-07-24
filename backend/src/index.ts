import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import formbody from '@fastify/formbody';
import { config } from './config';
import { connectDatabase, disconnectDatabase } from './config/database';
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

async function start() {
  try {
    await connectDatabase();

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

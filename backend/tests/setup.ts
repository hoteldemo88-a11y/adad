import { vi, describe, it, expect, beforeAll, afterAll } from 'vitest';

process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db?schema=public';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';

import { FastifyInstance } from 'fastify';
import { buildServer } from '../src/index';

let server: FastifyInstance;

beforeAll(async () => {
  server = await buildServer();
  await server.ready();
});

afterAll(async () => {
  if (server) {
    await server.close();
  }
});

export { server };

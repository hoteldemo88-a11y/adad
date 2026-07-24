import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildServer } from '../src/index';

process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db?schema=public';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';

describe('Device Routes', () => {
  let server: FastifyInstance;
  let accessToken: string;
  let deviceId: string;
  let pairingCode: string;

  beforeAll(async () => {
    server = await buildServer();
    await server.ready();

    const registerResponse = await server.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        email: 'deviceparent@example.com',
        password: 'TestPass123!',
        name: 'Device Parent',
      },
    });

    const registerBody = JSON.parse(registerResponse.payload);
    accessToken = registerBody.data.accessToken;
  });

  afterAll(async () => {
    if (server) {
      await server.close();
    }
  });

  describe('POST /api/devices/register', () => {
    it('should register a new device successfully', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/devices/register',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          name: 'Child Phone',
          model: 'Samsung Galaxy S23',
          manufacturer: 'Samsung',
          androidVersion: '14',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('Child Phone');
      expect(body.data.pairingCode).toBeDefined();
      expect(body.data.pairingCode).toHaveLength(6);
      
      deviceId = body.data.id;
      pairingCode = body.data.pairingCode;
    });

    it('should fail without authentication', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/devices/register',
        payload: {
          name: 'Another Phone',
          model: 'Pixel 8',
          manufacturer: 'Google',
          androidVersion: '14',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should fail with missing fields', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/devices/register',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          name: 'Incomplete Device',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
    });
  });

  describe('GET /api/devices', () => {
    it('should list devices for authenticated parent', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/devices',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
    });

    it('should fail without authentication', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/devices',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /api/devices/pair', () => {
    it('should pair device with valid pairing code', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/devices/pair',
        payload: {
          pairingCode,
          deviceName: 'Child Phone',
          deviceModel: 'Samsung Galaxy S23',
          androidVersion: '14',
          manufacturer: 'Samsung',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.success).toBe(true);
      expect(body.data.deviceId).toBeDefined();
      expect(body.data.deviceToken).toBeDefined();
      expect(body.data.parentId).toBeDefined();
      expect(body.data.message).toBe('Device paired successfully');
    });

    it('should fail with invalid pairing code', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/devices/pair',
        payload: {
          pairingCode: '000000',
          deviceName: 'Unknown Device',
          deviceModel: 'Unknown',
          androidVersion: '14',
          manufacturer: 'Unknown',
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
    });

    it('should fail with invalid pairing code format', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/devices/pair',
        payload: {
          pairingCode: 'abc123',
          deviceName: 'Device',
          deviceModel: 'Model',
          androidVersion: '14',
          manufacturer: 'Maker',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(false);
    });
  });

  describe('POST /api/devices/:id/pause and /resume', () => {
    it('should pause monitoring for a device', async () => {
      const response = await server.inject({
        method: 'POST',
        url: `/api/devices/${deviceId}/pause`,
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.isMonitoringActive).toBe(false);
    });

    it('should resume monitoring for a device', async () => {
      const response = await server.inject({
        method: 'POST',
        url: `/api/devices/${deviceId}/resume`,
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.isMonitoringActive).toBe(true);
    });
  });

  describe('DELETE /api/devices/:id', () => {
    it('should delete a device', async () => {
      const registerResponse = await server.inject({
        method: 'POST',
        url: '/api/devices/register',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          name: 'Device to Delete',
          model: 'Test Model',
          manufacturer: 'Test',
          androidVersion: '14',
        },
      });

      const registerBody = JSON.parse(registerResponse.payload);
      const deleteId = registerBody.data.id;

      const response = await server.inject({
        method: 'DELETE',
        url: `/api/devices/${deleteId}`,
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
    });

    it('should fail to delete non-existent device', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: '/api/devices/00000000-0000-0000-0000-000000000000',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.statusCode).toBe(404);
    });
  });
});

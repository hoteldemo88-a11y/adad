import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../config/database';
import { config } from '../config';
import { DeviceRegisterSchema, DevicePairSchema, AutoRegisterSchema } from '../utils/validators';
import { success, error } from '../utils/response';
import { authMiddleware } from '../middleware/auth';
import { auditLog } from '../middleware/audit';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors';

function generatePairingCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default async function devicesRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/auto-register', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = AutoRegisterSchema.parse(request.body);

    const device = await prisma.childDevice.create({
      data: {
        name: body.deviceName,
        model: body.deviceModel,
        manufacturer: body.manufacturer,
        androidVersion: body.androidVersion,
        status: 'PENDING',
      },
    });

    const deviceToken = fastify.jwt.sign(
      {
        id: device.id,
        deviceId: device.id,
        parentId: undefined,
        type: 'device',
      },
      { expiresIn: config.jwt.deviceExpiresIn }
    );

    await prisma.childDevice.update({
      where: { id: device.id },
      data: { isOnline: true, lastSyncAt: new Date() },
    });

    return success(reply, {
      deviceId: device.id,
      deviceToken,
      status: 'PENDING',
    }, 'Device registered successfully. Waiting for parent approval.', 201);
  });

  fastify.get('/pending', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const devices = await prisma.childDevice.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });

    return success(reply, devices, 'Pending devices retrieved successfully');
  });

  fastify.post('/:id/approve', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const parentId = (request as FastifyRequest & { parentId: string }).parentId;

    const device = await prisma.childDevice.findFirst({
      where: { id, status: 'PENDING' },
    });

    if (!device) {
      throw new NotFoundError('Pending device not found');
    }

    const updatedDevice = await prisma.childDevice.update({
      where: { id },
      data: {
        parentId,
        status: 'APPROVED',
      },
    });

    await prisma.notification.create({
      data: {
        parentId,
        deviceId: device.id,
        type: 'NEW_DEVICE',
        title: 'New Device Approved',
        message: `Device "${device.name}" has been approved and linked to your account.`,
      },
    });

    await auditLog(request, {
      action: 'DEVICE_APPROVED',
      targetId: device.id,
      details: { deviceName: device.name },
    });

    return success(reply, updatedDevice, 'Device approved successfully');
  });

  fastify.post('/register', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = DeviceRegisterSchema.parse(request.body);
    const parentId = (request as FastifyRequest & { parentId: string }).parentId;

    let pairingCode = generatePairingCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.childDevice.findFirst({
        where: { pairingCode },
      });
      if (!existing) break;
      pairingCode = generatePairingCode();
      attempts++;
    }

    const device = await prisma.childDevice.create({
      data: {
        name: body.name,
        model: body.model,
        manufacturer: body.manufacturer,
        androidVersion: body.androidVersion,
        pairingCode,
        parentId,
      },
      include: {
        parent: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    await auditLog(request, {
      action: 'DEVICE_REGISTERED',
      targetId: device.id,
      details: { deviceName: device.name, pairingCode },
    });

    await prisma.notification.create({
      data: {
        parentId,
        type: 'NEW_DEVICE',
        title: 'New Device Registered',
        message: `Device "${device.name}" has been registered and is waiting to be paired.`,
      },
    });

    return success(reply, device, 'Device registered successfully. Use the pairing code to connect the device.', 201);
  });

  fastify.get('/', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parentId = (request as FastifyRequest & { parentId: string }).parentId;

    const devices = await prisma.childDevice.findMany({
      where: { parentId },
      include: {
        _count: {
          select: {
            contacts: true,
            callLogs: true,
            smsMessages: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return success(reply, devices, 'Devices retrieved successfully');
  });

  fastify.get('/:id', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const parentId = (request as FastifyRequest & { parentId: string }).parentId;

    const device = await prisma.childDevice.findFirst({
      where: { id, parentId },
      include: {
        _count: {
          select: {
            contacts: true,
            callLogs: true,
            smsMessages: true,
          },
        },
      },
    });

    if (!device) {
      throw new NotFoundError('Device not found');
    }

    return success(reply, device, 'Device retrieved successfully');
  });

  fastify.delete('/:id', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const parentId = (request as FastifyRequest & { parentId: string }).parentId;

    const device = await prisma.childDevice.findFirst({
      where: { id, parentId },
    });

    if (!device) {
      throw new NotFoundError('Device not found');
    }

    await prisma.childDevice.delete({ where: { id } });

    await auditLog(request, {
      action: 'DEVICE_DELETED',
      targetId: id,
      details: { deviceName: device.name },
    });

    return success(reply, null, 'Device deleted successfully');
  });

  fastify.post('/:id/pause', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const parentId = (request as FastifyRequest & { parentId: string }).parentId;

    const device = await prisma.childDevice.findFirst({
      where: { id, parentId },
    });

    if (!device) {
      throw new NotFoundError('Device not found');
    }

    const updatedDevice = await prisma.childDevice.update({
      where: { id },
      data: { isMonitoringActive: false },
    });

    await auditLog(request, {
      action: 'DEVICE_PAUSED',
      targetId: id,
      details: { deviceName: device.name },
    });

    return success(reply, updatedDevice, 'Monitoring paused successfully');
  });

  fastify.post('/:id/resume', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const parentId = (request as FastifyRequest & { parentId: string }).parentId;

    const device = await prisma.childDevice.findFirst({
      where: { id, parentId },
    });

    if (!device) {
      throw new NotFoundError('Device not found');
    }

    const updatedDevice = await prisma.childDevice.update({
      where: { id },
      data: { isMonitoringActive: true },
    });

    await auditLog(request, {
      action: 'DEVICE_RESUMED',
      targetId: id,
      details: { deviceName: device.name },
    });

    return success(reply, updatedDevice, 'Monitoring resumed successfully');
  });

  fastify.post('/pair', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = DevicePairSchema.parse(request.body);

    if (!body.pairingCode) {
      throw new ValidationError('Pairing code is required');
    }

    const device = await prisma.childDevice.findFirst({
      where: { pairingCode: body.pairingCode },
    });

    if (!device) {
      throw new NotFoundError('Invalid pairing code');
    }

    const updatedDevice = await prisma.childDevice.update({
      where: { id: device.id },
      data: {
        name: body.deviceName,
        model: body.deviceModel,
        androidVersion: body.androidVersion,
        manufacturer: body.manufacturer,
        isOnline: true,
        lastSyncAt: new Date(),
      },
    });

    const deviceToken = fastify.jwt.sign(
      {
        id: device.id,
        deviceId: device.id,
        parentId: device.parentId ?? undefined,
        type: 'device',
      },
      { expiresIn: config.jwt.deviceExpiresIn }
    );

    if (device.parentId) {
      await prisma.notification.create({
        data: {
          parentId: device.parentId,
          deviceId: device.id,
          type: 'PAIRING_SUCCESS',
          title: 'Device Paired Successfully',
          message: `Device "${body.deviceName}" has been paired and is now online.`,
        },
      });
    }

    await auditLog(request, {
      action: 'DEVICE_PAIRED',
      targetId: device.id,
      details: { deviceName: body.deviceName },
    });

    return success(reply, {
      success: true,
      deviceId: device.id,
      deviceToken,
      parentId: device.parentId,
      message: 'Device paired successfully',
    }, 'Device paired successfully');
  });
}

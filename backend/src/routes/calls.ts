import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../config/database';
import { CallLogSyncSchema, PaginationSchema } from '../utils/validators';
import { success, paginated } from '../utils/response';
import { deviceAuthMiddleware, authMiddleware } from '../middleware/auth';
import { auditLog } from '../middleware/audit';
import { NotFoundError, ForbiddenError } from '../utils/errors';

export default async function callsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/sync', { preHandler: [deviceAuthMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = CallLogSyncSchema.parse(request.body);
    const deviceId = (request as FastifyRequest & { deviceId: string }).deviceId;
    const parentId = (request as FastifyRequest & { parentId: string }).parentId;

    if (body.deviceId !== deviceId) {
      throw new ForbiddenError('Device ID mismatch');
    }

    const device = await prisma.childDevice.findFirst({
      where: { id: deviceId },
    });

    if (!device) {
      throw new NotFoundError('Device not found');
    }

    if (device.parentId && device.parentId !== parentId) {
      throw new ForbiddenError('Device does not belong to this parent');
    }

    if (device.status === 'APPROVED' && !device.isMonitoringActive) {
      return success(reply, { created: 0, updated: 0, deleted: 0 }, 'Monitoring is paused for this device');
    }

    const result = await prisma.$transaction(async (tx) => {
      const existingCalls = await tx.callLog.findMany({
        where: { deviceId },
        select: { id: true, syncHash: true },
      });

      const existingHashMap = new Map(existingCalls.map(c => [c.syncHash, c.id]));
      const incomingHashes = new Set(body.calls.map(c => c.syncHash));

      let created = 0;
      let updated = 0;
      let deleted = 0;

      for (const call of body.calls) {
        if (existingHashMap.has(call.syncHash)) {
          const existingId = existingHashMap.get(call.syncHash)!;
          await tx.callLog.update({
            where: { id: existingId },
            data: {
              contactName: call.contactName || null,
              phoneNumber: call.phoneNumber,
              type: call.callType,
              duration: call.duration,
              timestamp: new Date(call.timestamp),
            },
          });
          updated++;
          existingHashMap.delete(call.syncHash);
        } else {
          await tx.callLog.create({
            data: {
              deviceId,
              contactName: call.contactName || null,
              phoneNumber: call.phoneNumber,
              type: call.callType,
              duration: call.duration,
              timestamp: new Date(call.timestamp),
              syncHash: call.syncHash,
            },
          });
          created++;
        }
      }

      for (const [hash, id] of existingHashMap) {
        if (!incomingHashes.has(hash)) {
          await tx.callLog.delete({ where: { id } });
          deleted++;
        }
      }

      await tx.childDevice.update({
        where: { id: deviceId },
        data: { lastSyncAt: new Date() },
      });

      return { created, updated, deleted };
    });

    await auditLog(request, {
      action: 'CALL_LOGS_SYNCED',
      targetId: deviceId,
      details: result,
    });

    return success(reply, result, 'Call logs synced successfully');
  });

  fastify.get('/', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parentId = (request as FastifyRequest & { parentId: string }).parentId;
    const query = PaginationSchema.parse(request.query);
    const { deviceId, type, startDate, endDate } = request.query as {
      deviceId?: string;
      type?: string;
      startDate?: string;
      endDate?: string;
    };

    const where: Record<string, unknown> = {};
    
    if (deviceId) {
      const device = await prisma.childDevice.findFirst({
        where: { id: deviceId, parentId },
      });
      if (!device) {
        throw new NotFoundError('Device not found');
      }
      where.deviceId = deviceId;
    } else {
      const devices = await prisma.childDevice.findMany({
        where: { parentId },
        select: { id: true },
      });
      where.deviceId = { in: devices.map(d => d.id) };
    }

    if (type) {
      where.type = type;
    }

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        (where.timestamp as Record<string, unknown>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.timestamp as Record<string, unknown>).lte = new Date(endDate);
      }
    }

    if (query.search) {
      where.OR = [
        { contactName: { contains: query.search, mode: 'insensitive' } },
        { phoneNumber: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [calls, total] = await Promise.all([
      prisma.callLog.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { timestamp: query.sortOrder },
        include: {
          device: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.callLog.count({ where }),
    ]);

    return paginated(reply, calls, total, query.page, query.limit, 'Call logs retrieved successfully');
  });
}

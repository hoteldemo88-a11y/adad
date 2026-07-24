import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../config/database';
import { ContactSyncSchema, PaginationSchema } from '../utils/validators';
import { success, paginated } from '../utils/response';
import { deviceAuthMiddleware, authMiddleware } from '../middleware/auth';
import { auditLog } from '../middleware/audit';
import { NotFoundError, ForbiddenError } from '../utils/errors';

export default async function contactsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/sync', { preHandler: [deviceAuthMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = ContactSyncSchema.parse(request.body);
    const deviceId = (request as FastifyRequest & { deviceId: string }).deviceId;
    const parentId = (request as FastifyRequest & { parentId: string }).parentId;

    if (body.deviceId !== deviceId) {
      throw new ForbiddenError('Device ID mismatch');
    }

    const device = await prisma.childDevice.findFirst({
      where: { id: deviceId, parentId },
    });

    if (!device) {
      throw new NotFoundError('Device not found');
    }

    if (!device.isMonitoringActive) {
      return success(reply, { created: 0, updated: 0, deleted: 0 }, 'Monitoring is paused for this device');
    }

    const result = await prisma.$transaction(async (tx) => {
      const existingContacts = await tx.contact.findMany({
        where: { deviceId },
        select: { id: true, syncHash: true },
      });

      const existingHashMap = new Map(existingContacts.map(c => [c.syncHash, c.id]));
      const incomingHashes = new Set(body.contacts.map(c => c.syncHash));

      let created = 0;
      let updated = 0;
      let deleted = 0;

      for (const contact of body.contacts) {
        if (existingHashMap.has(contact.syncHash)) {
          const existingId = existingHashMap.get(contact.syncHash)!;
          await tx.contact.update({
            where: { id: existingId },
            data: {
              name: contact.displayName,
              phoneNumber: contact.phoneNumber || null,
              email: contact.email || null,
            },
          });
          updated++;
          existingHashMap.delete(contact.syncHash);
        } else {
          await tx.contact.create({
            data: {
              deviceId,
              name: contact.displayName,
              phoneNumber: contact.phoneNumber || null,
              email: contact.email || null,
              syncHash: contact.syncHash,
            },
          });
          created++;
        }
      }

      for (const [hash, id] of existingHashMap) {
        if (!incomingHashes.has(hash)) {
          await tx.contact.delete({ where: { id } });
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
      action: 'CONTACTS_SYNCED',
      targetId: deviceId,
      details: result,
    });

    return success(reply, result, 'Contacts synced successfully');
  });

  fastify.get('/', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parentId = (request as FastifyRequest & { parentId: string }).parentId;
    const query = PaginationSchema.parse(request.query);
    const { deviceId } = request.query as { deviceId?: string };

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

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { phoneNumber: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { [query.sortBy || 'name']: query.sortOrder },
        include: {
          device: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.contact.count({ where }),
    ]);

    return paginated(reply, contacts, total, query.page, query.limit, 'Contacts retrieved successfully');
  });
}

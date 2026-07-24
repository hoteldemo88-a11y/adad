import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../config/database';
import { PaginationSchema } from '../utils/validators';
import { success, paginated } from '../utils/response';
import { authMiddleware } from '../middleware/auth';
import { auditLog } from '../middleware/audit';
import { NotFoundError } from '../utils/errors';

export default async function notificationsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parentId = (request as FastifyRequest & { parentId: string }).parentId;
    const query = PaginationSchema.parse(request.query);
    const { unreadOnly } = request.query as { unreadOnly?: string };

    const where: Record<string, unknown> = { parentId };

    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: query.sortOrder },
        include: {
          device: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { parentId, isRead: false } }),
    ]);

    const response = {
      notifications,
      unreadCount,
    };

    return paginated(reply, [response], total, query.page, query.limit, 'Notifications retrieved successfully');
  });

  fastify.put('/:id/read', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const parentId = (request as FastifyRequest & { parentId: string }).parentId;

    const notification = await prisma.notification.findFirst({
      where: { id, parentId },
    });

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return success(reply, updated, 'Notification marked as read');
  });

  fastify.put('/read-all', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parentId = (request as FastifyRequest & { parentId: string }).parentId;

    const result = await prisma.notification.updateMany({
      where: { parentId, isRead: false },
      data: { isRead: true },
    });

    await auditLog(request, {
      action: 'NOTIFICATIONS_READ_ALL',
      targetId: parentId,
      details: { count: result.count },
    });

    return success(reply, { count: result.count }, 'All notifications marked as read');
  });
}

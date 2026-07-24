import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { UpdateProfileSchema, ChangePasswordSchema, UpdateSyncIntervalSchema } from '../utils/validators';
import { success } from '../utils/response';
import { authMiddleware } from '../middleware/auth';
import { auditLog } from '../middleware/audit';
import { UnauthorizedError } from '../utils/errors';

export default async function settingsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/profile', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parentId = (request as FastifyRequest & { parentId: string }).parentId;

    const parent = await prisma.parent.findUnique({
      where: { id: parentId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        twoFactorEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return success(reply, parent, 'Profile retrieved successfully');
  });

  fastify.put('/profile', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parentId = (request as FastifyRequest & { parentId: string }).parentId;
    const body = UpdateProfileSchema.parse(request.body);

    const parent = await prisma.parent.update({
      where: { id: parentId },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.avatar !== undefined && { avatar: body.avatar }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await auditLog(request, {
      action: 'PROFILE_UPDATED',
      targetId: parentId,
      details: { fields: Object.keys(body) },
    });

    return success(reply, parent, 'Profile updated successfully');
  });

  fastify.put('/sync-interval', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parentId = (request as FastifyRequest & { parentId: string }).parentId;
    const body = UpdateSyncIntervalSchema.parse(request.body);

    await prisma.session.updateMany({
      where: { parentId },
      data: { expiresAt: new Date() },
    });

    await auditLog(request, {
      action: 'SYNC_INTERVAL_UPDATED',
      targetId: parentId,
      details: { intervalMs: body.intervalMs },
    });

    return success(reply, { intervalMs: body.intervalMs }, 'Sync interval updated successfully');
  });

  fastify.put('/password', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parentId = (request as FastifyRequest & { parentId: string }).parentId;
    const body = ChangePasswordSchema.parse(request.body);

    const parent = await prisma.parent.findUnique({
      where: { id: parentId },
      select: { passwordHash: true },
    });

    if (!parent) {
      throw new UnauthorizedError('Parent not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(body.currentPassword, parent.passwordHash);

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    const newPasswordHash = await bcrypt.hash(body.newPassword, 12);

    await prisma.parent.update({
      where: { id: parentId },
      data: { passwordHash: newPasswordHash },
    });

    await prisma.refreshToken.deleteMany({
      where: { parentId },
    });

    await auditLog(request, {
      action: 'PASSWORD_CHANGED',
      targetId: parentId,
    });

    return success(reply, null, 'Password changed successfully. Please log in again.');
  });
}

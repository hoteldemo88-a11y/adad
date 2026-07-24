import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../config/database';

export interface AuditContext {
  action: string;
  targetId?: string;
  details?: Record<string, unknown>;
}

export async function auditLog(
  request: FastifyRequest,
  context: AuditContext
): Promise<void> {
  try {
    const parentId = (request as FastifyRequest & { parentId?: string }).parentId || null;
    const ipAddress = request.ip;

    await prisma.auditLog.create({
      data: {
        parentId,
        action: context.action,
        targetId: context.targetId || null,
        details: context.details ? JSON.parse(JSON.stringify(context.details)) : {},
        ipAddress,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

import { FastifyRequest, FastifyReply } from 'fastify';

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      reply.status(401).send({
        success: false,
        message: 'Missing or invalid authorization header',
      });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = request.server.jwt.verify<{ id: string; email: string }>(token);
    
    (request as FastifyRequest & { parentId: string }).parentId = decoded.id;
  } catch (error) {
    reply.status(401).send({
      success: false,
      message: 'Invalid or expired token',
    });
  }
}

export async function deviceAuthMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      reply.status(401).send({
        success: false,
        message: 'Missing or invalid authorization header',
      });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = request.server.jwt.verify<{ deviceId: string; parentId: string; type: string }>(token);
    
    if (decoded.type !== 'device') {
      reply.status(401).send({
        success: false,
        message: 'Invalid token type',
      });
      return;
    }

    (request as FastifyRequest & { deviceId: string; parentId: string | null }).deviceId = decoded.deviceId;
    (request as FastifyRequest & { deviceId: string; parentId: string | null }).parentId = decoded.parentId;
  } catch (error) {
    reply.status(401).send({
      success: false,
      message: 'Invalid or expired device token',
    });
  }
}

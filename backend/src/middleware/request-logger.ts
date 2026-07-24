import { FastifyRequest, FastifyReply } from 'fastify';

export async function requestLogger(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const startTime = Date.now();
  
  reply.raw.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      duration: `${duration}ms`,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      timestamp: new Date().toISOString(),
    };

    if (reply.statusCode >= 500) {
      console.error('Request Error:', JSON.stringify(logData));
    } else if (reply.statusCode >= 400) {
      console.warn('Request Warning:', JSON.stringify(logData));
    } else {
      console.info('Request:', JSON.stringify(logData));
    }
  });
}

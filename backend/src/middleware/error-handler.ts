import { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { AppError, ValidationError } from '../utils/errors';

export function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply): void {
  if (error instanceof ValidationError) {
    reply.status(error.statusCode).send({
      success: false,
      message: error.message,
      errors: error.errors,
    });
    return;
  }

  if (error instanceof AppError) {
    reply.status(error.statusCode).send({
      success: false,
      message: error.message,
    });
    return;
  }

  if (error.validation) {
    reply.status(400).send({
      success: false,
      message: 'Validation error',
      errors: error.validation,
    });
    return;
  }

  const statusCode = error.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message;

  console.error(`[${new Date().toISOString()}] Error:`, error);

  reply.status(statusCode).send({
    success: false,
    message,
  });
}

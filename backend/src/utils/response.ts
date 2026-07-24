import { FastifyReply } from 'fastify';

interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function success<T>(reply: FastifyReply, data: T, message: string = 'Success', statusCode: number = 200): void {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  reply.status(statusCode).send(response);
}

export function error(reply: FastifyReply, message: string = 'Internal server error', statusCode: number = 500): void {
  const response: ApiResponse = {
    success: false,
    message,
  };
  reply.status(statusCode).send(response);
}

export function paginated<T>(
  reply: FastifyReply,
  data: T[],
  total: number,
  page: number,
  limit: number,
  message: string = 'Success'
): void {
  const totalPages = Math.ceil(total / limit);
  const response: PaginatedResponse<T> = {
    success: true,
    message,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
  };
  reply.status(200).send(response);
}

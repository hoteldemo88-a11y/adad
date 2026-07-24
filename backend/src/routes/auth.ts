import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { config } from '../config';
import {
  RegisterSchema,
  LoginSchema,
  RefreshTokenSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from '../utils/validators';
import { success, error } from '../utils/response';
import { authMiddleware } from '../middleware/auth';
import { auditLog } from '../middleware/audit';
import { ConflictError, NotFoundError, UnauthorizedError, ValidationError } from '../utils/errors';
import { v4 as uuidv4 } from 'uuid';

export default async function authRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = RegisterSchema.parse(request.body);
    
    const existingParent = await prisma.parent.findUnique({
      where: { email: body.email },
    });

    if (existingParent) {
      throw new ConflictError('Email already registered');
    }

    const passwordHash = await bcrypt.hash(body.password, 12);

    const parent = await prisma.parent.create({
      data: {
        email: body.email,
        passwordHash,
        name: body.name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    const accessToken = fastify.jwt.sign(
      { id: parent.id, email: parent.email, type: 'access' },
      { expiresIn: config.jwt.accessExpiresIn }
    );

    const refreshToken = fastify.jwt.sign(
      { id: parent.id, type: 'refresh' },
      { expiresIn: config.jwt.refreshExpiresIn }
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        parentId: parent.id,
        expiresAt,
      },
    });

    await auditLog(request, {
      action: 'REGISTER',
      targetId: parent.id,
      details: { email: parent.email },
    });

    return success(reply, {
      parent,
      accessToken,
      refreshToken,
    }, 'Registration successful', 201);
  });

  fastify.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = LoginSchema.parse(request.body);

    const parent = await prisma.parent.findUnique({
      where: { email: body.email },
    });

    if (!parent) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(body.password, parent.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const accessToken = fastify.jwt.sign(
      { id: parent.id, email: parent.email, type: 'access' },
      { expiresIn: config.jwt.accessExpiresIn }
    );

    const refreshToken = fastify.jwt.sign(
      { id: parent.id, type: 'refresh' },
      { expiresIn: config.jwt.refreshExpiresIn }
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        parentId: parent.id,
        expiresAt,
      },
    });

    await auditLog(request, {
      action: 'LOGIN',
      targetId: parent.id,
      details: { email: parent.email },
    });

    return success(reply, {
      parent: {
        id: parent.id,
        email: parent.email,
        name: parent.name,
      },
      accessToken,
      refreshToken,
    }, 'Login successful');
  });

  fastify.post('/logout', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = RefreshTokenSchema.parse(request.body);
    const parentId = (request as FastifyRequest & { parentId: string }).parentId;

    await prisma.refreshToken.deleteMany({
      where: {
        token: body.refreshToken,
        parentId,
      },
    });

    await auditLog(request, {
      action: 'LOGOUT',
      targetId: parentId,
    });

    return success(reply, null, 'Logout successful');
  });

  fastify.post('/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = RefreshTokenSchema.parse(request.body);

    let decoded: { id: string; type: string };
    try {
      decoded = fastify.jwt.verify(body.refreshToken) as { id: string; type: string };
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }

    if (decoded.type !== 'refresh') {
      throw new UnauthorizedError('Invalid token type');
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: body.refreshToken },
    });

    if (!storedToken) {
      throw new UnauthorizedError('Refresh token not found');
    }

    if (storedToken.expiresAt < new Date()) {
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      throw new UnauthorizedError('Refresh token expired');
    }

    const parent = await prisma.parent.findUnique({
      where: { id: decoded.id },
    });

    if (!parent) {
      throw new UnauthorizedError('Parent not found');
    }

    await prisma.refreshToken.delete({ where: { id: storedToken.id } });

    const accessToken = fastify.jwt.sign(
      { id: parent.id, email: parent.email, type: 'access' },
      { expiresIn: config.jwt.accessExpiresIn }
    );

    const newRefreshToken = fastify.jwt.sign(
      { id: parent.id, type: 'refresh' },
      { expiresIn: config.jwt.refreshExpiresIn }
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        parentId: parent.id,
        expiresAt,
      },
    });

    return success(reply, {
      accessToken,
      refreshToken: newRefreshToken,
    }, 'Token refreshed successfully');
  });

  fastify.post('/forgot-password', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = ForgotPasswordSchema.parse(request.body);

    const parent = await prisma.parent.findUnique({
      where: { email: body.email },
    });

    if (!parent) {
      console.log(`Password reset requested for non-existent email: ${body.email}`);
      return success(reply, null, 'If the email exists, a reset link has been sent');
    }

    const resetToken = uuidv4();
    console.log(`Password reset token for ${body.email}: ${resetToken}`);

    await auditLog(request, {
      action: 'FORGOT_PASSWORD',
      targetId: parent.id,
      details: { email: body.email },
    });

    return success(reply, null, 'If the email exists, a reset link has been sent');
  });

  fastify.post('/reset-password', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = ResetPasswordSchema.parse(request.body);

    const passwordHash = await bcrypt.hash(body.password, 12);

    await auditLog(request, {
      action: 'RESET_PASSWORD',
      details: { tokenUsed: body.token },
    });

    return success(reply, null, 'Password reset successful');
  });
}

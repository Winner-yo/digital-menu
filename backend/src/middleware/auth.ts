import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../prisma/client';
import { sendUnauthorized, sendForbidden } from '../utils/response';
import { UserRole } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  restaurantId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      sendUnauthorized(res, 'No token provided');
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      id: string;
      email: string;
      role: UserRole;
      restaurantId?: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      sendUnauthorized(res, 'Account not found or inactive');
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      restaurantId: decoded.restaurantId,
    };

    next();
  } catch {
    sendUnauthorized(res, 'Invalid or expired token');
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendUnauthorized(res);
      return;
    }
    if (!roles.includes(req.user.role)) {
      sendForbidden(res, 'Insufficient permissions');
      return;
    }
    next();
  };
};

export const authorizeRestaurant = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendUnauthorized(res);
      return;
    }

    if (req.user.role === UserRole.SUPER_ADMIN) {
      next();
      return;
    }

    const restaurantId = req.params.restaurantId || req.user.restaurantId;
    if (!restaurantId) {
      sendForbidden(res, 'Restaurant context required');
      return;
    }

    const membership = await prisma.restaurantUser.findFirst({
      where: { restaurantId, userId: req.user.id, isActive: true },
    });

    if (!membership) {
      sendForbidden(res, 'Access denied to this restaurant');
      return;
    }

    req.user.restaurantId = restaurantId;
    next();
  } catch {
    sendForbidden(res);
  }
};

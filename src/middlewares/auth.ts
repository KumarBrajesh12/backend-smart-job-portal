import type { NextFunction, Request, Response } from 'express';
import AppError from '../utils/AppError.js';
import { verifyAccessToken } from '../utils/jwt.js';
import type { UserRole } from '../types/auth.js';

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    next(new AppError('Authentication required', 401));
    return;
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    next(new AppError('Authentication required', 401));
    return;
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (error) {
    next(
      error instanceof AppError ? error : new AppError('Invalid token', 401),
    );
  }
};

export const authorize =
  (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('Authentication required', 401));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(
        new AppError('You do not have permission to perform this action', 403),
      );
      return;
    }

    next();
  };

export const candidateOnly = authorize('candidate');
export const recruiterOnly = authorize('recruiter');
export const adminOnly = authorize('admin');

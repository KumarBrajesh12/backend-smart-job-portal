import type { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import AppError from '../utils/AppError.js';

const validate = (req: Request, _res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors
      .array()
      .map((err) => err.msg)
      .join('. ');
    next(new AppError(message, 400));
    return;
  }
  next();
};

export default validate;

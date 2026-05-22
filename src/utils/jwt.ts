import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';
import env from '../config/env.js';

export type { JwtPayload };

export const signToken = (
  payload: string | object | Buffer,
  options: SignOptions = {},
): string => {
  const signOptions: SignOptions = {
    ...options,
    expiresIn: (options.expiresIn ??
      env.jwtExpiresIn) as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.jwtSecret, signOptions);
};

export const verifyToken = (token: string): JwtPayload | string =>
  jwt.verify(token, env.jwtSecret);

export const decodeToken = (token: string): JwtPayload | string | null =>
  jwt.decode(token);

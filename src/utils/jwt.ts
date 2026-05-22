import jwt, { type SignOptions } from 'jsonwebtoken';
import env from '../config/env.js';
import type { JwtTokenPayload } from '../types/auth.js';
import AppError from './AppError.js';

const signWithExpiry = (payload: JwtTokenPayload, expiresIn: string): string =>
  jwt.sign(payload, env.jwtSecret, {
    expiresIn: expiresIn as SignOptions['expiresIn'],
  });

export const signAccessToken = (
  payload: Omit<JwtTokenPayload, 'type'>,
): string =>
  signWithExpiry({ ...payload, type: 'access' }, env.jwtAccessExpiresIn);

export const signRefreshToken = (
  payload: Omit<JwtTokenPayload, 'type'>,
): string =>
  signWithExpiry({ ...payload, type: 'refresh' }, env.jwtRefreshExpiresIn);

export const verifyAccessToken = (token: string): JwtTokenPayload => {
  const decoded = jwt.verify(token, env.jwtSecret) as JwtTokenPayload;
  if (decoded.type !== 'access') {
    throw new AppError('Invalid access token', 401);
  }
  return decoded;
};

export const verifyRefreshToken = (token: string): JwtTokenPayload => {
  const decoded = jwt.verify(token, env.jwtSecret) as JwtTokenPayload;
  if (decoded.type !== 'refresh') {
    throw new AppError('Invalid refresh token', 401);
  }
  return decoded;
};

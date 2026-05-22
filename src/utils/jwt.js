import jwt from 'jsonwebtoken';
import env from '../config/env.js';

export const signToken = (payload, options = {}) =>
  jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
    ...options,
  });

export const verifyToken = (token) => jwt.verify(token, env.jwtSecret);

export const decodeToken = (token) => jwt.decode(token);

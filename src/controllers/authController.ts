import type { Request, Response } from 'express';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.js';
import { generateSecureToken, hashToken } from '../utils/token.js';
import { sendVerificationEmail } from '../services/emailService.js';
import type { LoginResponse, PublicUser } from '../types/auth.js';

const EMAIL_VERIFICATION_EXPIRY_MS = 24 * 60 * 60 * 1000;

const toPublicUser = (user: {
  _id: { toString(): string };
  name: string;
  email: string;
  role: PublicUser['role'];
  isEmailVerified: boolean;
  createdAt: Date;
}): PublicUser => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  isEmailVerified: user.isEmailVerified,
  createdAt: user.createdAt,
});

const issueTokens = async (userId: string, role: PublicUser['role']) => {
  const payload = { id: userId, role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await User.findByIdAndUpdate(userId, {
    refreshToken: hashToken(refreshToken),
  });

  return { accessToken, refreshToken };
};

export const register = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { name, email, password, role } = req.body as {
      name: string;
      email: string;
      password: string;
      role: PublicUser['role'];
    };

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('Email is already registered', 400);
    }

    const verificationToken = generateSecureToken();
    const hashedVerificationToken = hashToken(verificationToken);

    const user = await User.create({
      name,
      email,
      password,
      role,
      emailVerificationToken: hashedVerificationToken,
      emailVerificationExpires: new Date(
        Date.now() + EMAIL_VERIFICATION_EXPIRY_MS,
      ),
    });

    try {
      await sendVerificationEmail({
        to: email,
        name,
        token: verificationToken,
      });
    } catch (emailError) {
      await User.findByIdAndDelete(user._id);
      throw emailError;
    }

    res.status(201).json({
      success: true,
      message:
        'Registration successful. Please check your email to verify your account.',
    });
  },
);

export const login = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body as {
      email: string;
      password: string;
    };

    const user = await User.findOne({ email }).select(
      '+password +refreshToken',
    );

    if (!user || !(await user.comparePassword(password))) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.isEmailVerified) {
      throw new AppError('Please verify your email before logging in', 403);
    }

    const { accessToken, refreshToken } = await issueTokens(
      user._id.toString(),
      user.role,
    );

    const response: LoginResponse = {
      accessToken,
      refreshToken,
      user: {
        id: user._id.toString(),
        name: user.name,
        role: user.role,
      },
    };

    res.status(200).json({
      success: true,
      ...response,
    });
  },
);

export const refresh = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body as { refreshToken: string };

    const decoded = verifyRefreshToken(refreshToken);
    const hashedToken = hashToken(refreshToken);

    const user = await User.findOne({
      _id: decoded.id,
      refreshToken: hashedToken,
    }).select('+refreshToken');

    if (!user) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const { accessToken, refreshToken: newRefreshToken } = await issueTokens(
      user._id.toString(),
      user.role,
    );

    res.status(200).json({
      success: true,
      accessToken,
      refreshToken: newRefreshToken,
    });
  },
);

export const logout = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    await User.findByIdAndUpdate(req.user.id, {
      refreshToken: null,
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  },
);

export const getMe = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      success: true,
      user: toPublicUser(user),
    });
  },
);

export const verifyEmail = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { token } = req.params;
    const hashedToken = hashToken(token as string);

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: new Date() },
    }).select('+emailVerificationToken +emailVerificationExpires');

    if (!user) {
      throw new AppError('Invalid or expired verification token', 400);
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully. You can now log in.',
    });
  },
);

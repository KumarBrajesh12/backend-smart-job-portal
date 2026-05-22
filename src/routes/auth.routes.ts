import { Router } from 'express';
import {
  getMe,
  login,
  logout,
  refresh,
  register,
  verifyEmail,
} from '../controllers/authController.js';
import { authenticate } from '../middlewares/auth.js';
import { loginRateLimiter } from '../middlewares/rateLimiter.js';
import validate from '../middlewares/validate.js';
import {
  loginValidation,
  refreshValidation,
  registerValidation,
  verifyEmailValidation,
} from '../validations/authValidation.js';

const router = Router();

router.post('/register', registerValidation, validate, register);
router.post('/login', loginRateLimiter, loginValidation, validate, login);
router.post('/refresh', refreshValidation, validate, refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.get(
  '/verify-email/:token',
  verifyEmailValidation,
  validate,
  verifyEmail,
);

export default router;

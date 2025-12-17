import { Router } from 'express';
import { login } from '../controllers/auth.controller';
import { loginValidator } from '../middleware/validator';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/login', authLimiter, loginValidator, login);

export default router;

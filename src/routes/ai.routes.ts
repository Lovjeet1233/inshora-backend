import { Router } from 'express';
import { chat } from '../controllers/ai.controller';
import { protect } from '../middleware/auth';

const router = Router();

// Protected routes
router.use(protect);

router.post('/chat', chat);

export default router;

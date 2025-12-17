import { Router } from 'express';
import { getDashboard } from '../controllers/analytics.controller';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/dashboard', getDashboard);

export default router;

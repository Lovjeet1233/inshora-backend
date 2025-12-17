import { Router } from 'express';
import { webhook, sendMessage, chat, getConversations } from '../controllers/whatsapp.controller';
import { protect } from '../middleware/auth';
import { whatsappSendValidator } from '../middleware/validator';
import { webhookLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public webhook endpoint
router.route('/webhook')
  .get(webhookLimiter, webhook)
  .post(webhookLimiter, webhook);

// Protected routes
router.use(protect);

router.post('/send', whatsappSendValidator, sendMessage);
router.post('/chat', chat);
router.get('/conversations', getConversations);

export default router;

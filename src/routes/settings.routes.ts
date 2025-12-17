import { Router } from 'express';
import { getSettings, updateSettings, testWhatsApp, testFacebook } from '../controllers/settings.controller';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);

router.route('/')
  .get(getSettings)
  .put(updateSettings);

router.post('/test-whatsapp', testWhatsApp);
router.post('/test-facebook', testFacebook);

export default router;

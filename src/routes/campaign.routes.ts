import { Router } from 'express';
import {
  createCampaign,
  getCampaigns,
  getCampaignById,
  startCampaign,
  pauseCampaign,
  uploadCSV,
  sendSMSMessage,
  sendEmailMessage,
  makeCall,
  addContactToCampaign,
  addContactsToCampaign
} from '../controllers/campaign.controller';
import { upload } from '../controllers/campaign.controller';
import { protect } from '../middleware/auth';
import {
  campaignValidator,
  sendSmsValidator,
  sendEmailValidator,
  makeCallValidator,
  paginationValidator,
  addContactValidator,
  addContactsValidator
} from '../middleware/validator';
import { campaignLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(protect);

router.post('/', campaignValidator, createCampaign);
router.get('/', paginationValidator, getCampaigns);
router.get('/:id', getCampaignById);
router.post('/:id/start', campaignLimiter, startCampaign);
router.post('/:id/pause', pauseCampaign);
router.post('/:id/add-contact', addContactValidator, addContactToCampaign);
router.post('/:id/add-contacts', addContactsValidator, addContactsToCampaign);
router.post('/upload-csv', upload.single('file'), uploadCSV);
router.post('/send-sms', campaignLimiter, sendSmsValidator, sendSMSMessage);
router.post('/send-email', campaignLimiter, sendEmailValidator, sendEmailMessage);
router.post('/make-call', campaignLimiter, makeCallValidator, makeCall);

export default router;

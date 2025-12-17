import { Router } from 'express';
import authRoutes from './auth.routes';
import settingsRoutes from './settings.routes';
import whatsappRoutes from './whatsapp.routes';
import socialRoutes from './social.routes';
import campaignRoutes from './campaign.routes';
import analyticsRoutes from './analytics.routes';
import healthRoutes from './health.routes';
import transcriptRoutes from './transcript.routes';
import aiRoutes from './ai.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/settings', settingsRoutes);
router.use('/whatsapp', whatsappRoutes);
router.use('/social', socialRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/health', healthRoutes);
router.use('/transcripts', transcriptRoutes);
router.use('/ai', aiRoutes);

export default router;

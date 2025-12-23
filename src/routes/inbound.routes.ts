import { Router } from 'express';
import { protect } from '../middleware/auth';
import multer from 'multer';
import * as inboundController from '../controllers/inbound.controller';

const router = Router();

// Configure multer for file uploads (memory storage for GCS upload)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
});

// All routes require authentication
router.use(protect);

/**
 * @route   POST /api/inbound/ingest
 * @desc    Ingest data into RAG knowledge base
 * @access  Private
 */
router.post(
  '/ingest',
  upload.fields([
    { name: 'pdfs', maxCount: 10 },
    { name: 'csvs', maxCount: 10 },
  ]),
  inboundController.ingestData
);

/**
 * @route   GET /api/inbound/list
 * @desc    Get all ingested data
 * @access  Private
 */
router.get('/list', inboundController.getIngestedData);

export default router;


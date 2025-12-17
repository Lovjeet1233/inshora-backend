import { Router } from 'express';
import { getTranscripts, getTranscriptById } from '../controllers/transcript.controller';

const router = Router();

router.get('/', getTranscripts);
router.get('/:id', getTranscriptById);

export default router;

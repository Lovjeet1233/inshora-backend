import { Router } from 'express';
import {
  getPrompts,
  getPromptById,
  getDefaultPrompt,
  createPrompt,
  updatePrompt,
  deletePrompt,
  testVoice
} from '../controllers/prompts.controller';
import { protect } from '../middleware/auth';
import { body } from 'express-validator';

const router = Router();

router.use(protect);

// Get default prompt (must be before /:id route)
router.get('/default', getDefaultPrompt);

// Test voice
router.post(
  '/test-voice',
  [
    body('voiceId').isIn(['alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'marin', 'nova', 'onyx', 'sage', 'shimmer', 'verse', 'cedar']).withMessage('Invalid voice ID'),
    body('text').optional().isString().withMessage('Text must be a string')
  ],
  testVoice
);

// CRUD operations
router.get('/', getPrompts);
router.get('/:id', getPromptById);

router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Prompt name is required'),
    body('description').optional().isString(),
    body('content').notEmpty().withMessage('Prompt content is required'),
    body('voiceId').isIn(['alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'marin', 'nova', 'onyx', 'sage', 'shimmer', 'verse', 'cedar']).withMessage('Invalid voice ID'),
    body('isDefault').optional().isBoolean()
  ],
  createPrompt
);

router.put(
  '/:id',
  [
    body('name').optional().notEmpty().withMessage('Prompt name cannot be empty'),
    body('description').optional().isString(),
    body('content').optional().notEmpty().withMessage('Prompt content cannot be empty'),
    body('voiceId').optional().isIn(['alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'marin', 'nova', 'onyx', 'sage', 'shimmer', 'verse', 'cedar']).withMessage('Invalid voice ID'),
    body('isDefault').optional().isBoolean()
  ],
  updatePrompt
);

router.delete('/:id', deletePrompt);

export default router;


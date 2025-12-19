import { Router } from 'express';
import {
  searchLeads,
  enrichLeads,
  searchAndEnrichLeads,
  saveLeadsToContacts
} from '../controllers/leads.controller';
import { protect } from '../middleware/auth';
import { body } from 'express-validator';

const router = Router();

router.use(protect);

router.post(
  '/search',
  [
    body('person_titles').optional().isArray().withMessage('person_titles must be an array'),
    body('person_locations').optional().isArray().withMessage('person_locations must be an array'),
    body('per_page').optional().isInt({ min: 1, max: 100 }).withMessage('per_page must be between 1 and 100'),
    body('page').optional().isInt({ min: 1 }).withMessage('page must be at least 1')
  ],
  searchLeads
);

router.post(
  '/enrich',
  [
    body('person_ids').isArray({ min: 1 }).withMessage('person_ids must be a non-empty array')
  ],
  enrichLeads
);

router.post(
  '/search-and-enrich',
  [
    body('person_titles').optional().isArray().withMessage('person_titles must be an array'),
    body('person_locations').optional().isArray().withMessage('person_locations must be an array'),
    body('per_page').optional().isInt({ min: 1, max: 100 }).withMessage('per_page must be between 1 and 100'),
    body('page').optional().isInt({ min: 1 }).withMessage('page must be at least 1')
  ],
  searchAndEnrichLeads
);

router.post(
  '/save-to-contacts',
  [
    body('leads').isArray({ min: 1 }).withMessage('leads must be a non-empty array')
  ],
  saveLeadsToContacts
);

export default router;


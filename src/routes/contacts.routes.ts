import { Router } from 'express';
import {
  getContacts,
  getContactById,
  deleteContact,
  createContactList,
  getContactLists,
  getContactListById,
  updateContactList,
  addContactsToList,
  removeContactsFromList,
  deleteContactList
} from '../controllers/contacts.controller';
import { protect } from '../middleware/auth';
import { body } from 'express-validator';
import { paginationValidator } from '../middleware/validator';

const router = Router();

router.use(protect);

// Contact list routes (must come before individual contact routes to avoid conflict)
router.post(
  '/lists',
  [
    body('name').notEmpty().withMessage('List name is required'),
    body('description').optional().isString(),
    body('contact_ids').optional().isArray().withMessage('contact_ids must be an array')
  ],
  createContactList
);

router.get('/lists', getContactLists);
router.get('/lists/:id', getContactListById);

router.put(
  '/lists/:id',
  [
    body('name').optional().notEmpty().withMessage('List name cannot be empty'),
    body('description').optional().isString()
  ],
  updateContactList
);

router.post(
  '/lists/:id/add-contacts',
  [
    body('contact_ids').isArray({ min: 1 }).withMessage('contact_ids must be a non-empty array')
  ],
  addContactsToList
);

router.post(
  '/lists/:id/remove-contacts',
  [
    body('contact_ids').isArray({ min: 1 }).withMessage('contact_ids must be a non-empty array')
  ],
  removeContactsFromList
);

router.delete('/lists/:id', deleteContactList);

// Contact routes (after list routes)
router.get('/', paginationValidator, getContacts);
router.get('/:id', getContactById);
router.delete('/:id', deleteContact);

export default router;


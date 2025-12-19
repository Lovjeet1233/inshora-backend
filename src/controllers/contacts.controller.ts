import { Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import Contact from '../models/Contact';
import ContactList from '../models/ContactList';
import { logger } from '../utils/logger';

// @desc    Get all contacts
// @route   GET /api/contacts
// @access  Private
export const getContacts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = req.query.search as string;

  const query: any = { userId: req.userId };
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } },
      { title: { $regex: search, $options: 'i' } }
    ];
  }

  const contacts = await Contact.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit);

  const total = await Contact.countDocuments(query);

  return res.status(200).json({
    success: true,
    count: contacts.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: contacts
  });
});

// @desc    Get contact by ID
// @route   GET /api/contacts/:id
// @access  Private
export const getContactById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const contact = await Contact.findOne({
    _id: req.params.id,
    userId: req.userId
  });

  if (!contact) {
    return res.status(404).json({
      success: false,
      message: 'Contact not found'
    });
  }

  return res.status(200).json({
    success: true,
    data: contact
  });
});

// @desc    Delete contact
// @route   DELETE /api/contacts/:id
// @access  Private
export const deleteContact = asyncHandler(async (req: AuthRequest, res: Response) => {
  const contact = await Contact.findOne({
    _id: req.params.id,
    userId: req.userId
  });

  if (!contact) {
    return res.status(404).json({
      success: false,
      message: 'Contact not found'
    });
  }

  await contact.deleteOne();

  logger.info(`Contact deleted: ${contact.name}`);

  return res.status(200).json({
    success: true,
    message: 'Contact deleted successfully'
  });
});

// @desc    Create contact list
// @route   POST /api/contacts/lists
// @access  Private
export const createContactList = asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { name, description, contact_ids = [] } = req.body;

  // Check if list with same name exists
  const existingList = await ContactList.findOne({
    userId: req.userId,
    name: name.trim()
  });

  if (existingList) {
    return res.status(400).json({
      success: false,
      message: 'A list with this name already exists'
    });
  }

  const list = await ContactList.create({
    userId: req.userId,
    name: name.trim(),
    description: description?.trim(),
    contacts: contact_ids
  });

  logger.info(`Contact list created: ${list.name}`);

  return res.status(201).json({
    success: true,
    message: 'Contact list created successfully',
    data: list
  });
});

// @desc    Get all contact lists
// @route   GET /api/contacts/lists
// @access  Private
export const getContactLists = asyncHandler(async (req: AuthRequest, res: Response) => {
  const lists = await ContactList.find({ userId: req.userId })
    .sort({ createdAt: -1 })
    .populate('contacts');

  return res.status(200).json({
    success: true,
    count: lists.length,
    data: lists
  });
});

// @desc    Get contact list by ID
// @route   GET /api/contacts/lists/:id
// @access  Private
export const getContactListById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const list = await ContactList.findOne({
    _id: req.params.id,
    userId: req.userId
  }).populate('contacts');

  if (!list) {
    return res.status(404).json({
      success: false,
      message: 'Contact list not found'
    });
  }

  return res.status(200).json({
    success: true,
    data: list
  });
});

// @desc    Update contact list
// @route   PUT /api/contacts/lists/:id
// @access  Private
export const updateContactList = asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const list = await ContactList.findOne({
    _id: req.params.id,
    userId: req.userId
  });

  if (!list) {
    return res.status(404).json({
      success: false,
      message: 'Contact list not found'
    });
  }

  const { name, description } = req.body;

  if (name) list.name = name.trim();
  if (description !== undefined) list.description = description?.trim();

  await list.save();

  logger.info(`Contact list updated: ${list.name}`);

  return res.status(200).json({
    success: true,
    message: 'Contact list updated successfully',
    data: list
  });
});

// @desc    Add contacts to list
// @route   POST /api/contacts/lists/:id/add-contacts
// @access  Private
export const addContactsToList = asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const list = await ContactList.findOne({
    _id: req.params.id,
    userId: req.userId
  });

  if (!list) {
    return res.status(404).json({
      success: false,
      message: 'Contact list not found'
    });
  }

  const { contact_ids } = req.body;

  if (!Array.isArray(contact_ids) || contact_ids.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'contact_ids must be a non-empty array'
    });
  }

  // Add only new contacts (avoid duplicates)
  const newContacts = contact_ids.filter(id => !list.contacts.includes(id));
  list.contacts.push(...newContacts);

  await list.save();

  logger.info(`${newContacts.length} contacts added to list: ${list.name}`);

  return res.status(200).json({
    success: true,
    message: `${newContacts.length} contacts added to list`,
    data: list
  });
});

// @desc    Remove contacts from list
// @route   POST /api/contacts/lists/:id/remove-contacts
// @access  Private
export const removeContactsFromList = asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const list = await ContactList.findOne({
    _id: req.params.id,
    userId: req.userId
  });

  if (!list) {
    return res.status(404).json({
      success: false,
      message: 'Contact list not found'
    });
  }

  const { contact_ids } = req.body;

  if (!Array.isArray(contact_ids) || contact_ids.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'contact_ids must be a non-empty array'
    });
  }

  list.contacts = list.contacts.filter(id => !contact_ids.includes(id.toString()));

  await list.save();

  logger.info(`${contact_ids.length} contacts removed from list: ${list.name}`);

  return res.status(200).json({
    success: true,
    message: 'Contacts removed from list',
    data: list
  });
});

// @desc    Delete contact list
// @route   DELETE /api/contacts/lists/:id
// @access  Private
export const deleteContactList = asyncHandler(async (req: AuthRequest, res: Response) => {
  const list = await ContactList.findOne({
    _id: req.params.id,
    userId: req.userId
  });

  if (!list) {
    return res.status(404).json({
      success: false,
      message: 'Contact list not found'
    });
  }

  await list.deleteOne();

  logger.info(`Contact list deleted: ${list.name}`);

  return res.status(200).json({
    success: true,
    message: 'Contact list deleted successfully'
  });
});

export default {
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
};


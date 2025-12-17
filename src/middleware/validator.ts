import { body, param, query, ValidationChain } from 'express-validator';

export const loginValidator: ValidationChain[] = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
];

export const campaignValidator: ValidationChain[] = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Campaign name is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Campaign name must be between 3 and 100 characters')
    .escape(),
  body('type')
    .isIn(['sms', 'email', 'call', 'all'])
    .withMessage('Type must be sms, email, call, or all'),
  body('contacts')
    .isArray({ min: 1 })
    .withMessage('At least one contact is required'),
  body('contacts.*.name')
    .trim()
    .notEmpty()
    .withMessage('Contact name is required')
    .escape(),
  body('contacts.*.phone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Invalid phone number format'),
  body('contacts.*.email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  body('messageTemplate.body')
    .trim()
    .notEmpty()
    .withMessage('Message body is required')
    .isLength({ max: 5000 })
    .withMessage('Message body too long (max 5000 characters)')
];

export const sendSmsValidator: ValidationChain[] = [
  body('body')
    .notEmpty()
    .withMessage('Message body is required'),
  body('number')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Please provide a valid phone number')
];

export const sendEmailValidator: ValidationChain[] = [
  body('subject')
    .notEmpty()
    .withMessage('Email subject is required'),
  body('body')
    .notEmpty()
    .withMessage('Email body is required'),
  body('receiver_email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
];

export const makeCallValidator: ValidationChain[] = [
  body('phone_number')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Please provide a valid phone number'),
  body('name')
    .notEmpty()
    .withMessage('Name is required')
];

export const whatsappSendValidator: ValidationChain[] = [
  body('to')
    .notEmpty()
    .withMessage('Recipient phone number is required'),
  body('message')
    .notEmpty()
    .withMessage('Message is required'),
  body('threadId')
    .optional()
    .isString()
    .withMessage('Thread ID must be a string')
];

export const generateImagesValidator: ValidationChain[] = [
  body('idea')
    .notEmpty()
    .withMessage('Image idea is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Idea must be between 10 and 500 characters'),
  body('style')
    .optional()
    .isString()
    .withMessage('Style must be a string'),
  body('platform')
    .optional()
    .isIn(['facebook', 'instagram'])
    .withMessage('Platform must be facebook or instagram')
];

export const postToFacebookValidator: ValidationChain[] = [
  body('imageUrl')
    .notEmpty()
    .withMessage('Image URL is required')
    .isURL()
    .withMessage('Please provide a valid URL'),
  body('caption')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Caption too long (max 2000 characters)')
];

export const updatePostValidator: ValidationChain[] = [
  param('postId')
    .notEmpty()
    .withMessage('Post ID is required'),
  body('caption')
    .notEmpty()
    .withMessage('Caption is required')
    .isString()
    .withMessage('Caption must be a string')
];

export const paginationValidator: ValidationChain[] = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

export const addContactValidator: ValidationChain[] = [
  param('id')
    .notEmpty()
    .withMessage('Campaign ID is required')
    .isMongoId()
    .withMessage('Invalid campaign ID'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Contact name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .escape(),
  body('phone')
    .optional()
    .trim()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Invalid phone number format'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail()
];

export const addContactsValidator: ValidationChain[] = [
  param('id')
    .notEmpty()
    .withMessage('Campaign ID is required')
    .isMongoId()
    .withMessage('Invalid campaign ID'),
  body('contacts')
    .isArray({ min: 1 })
    .withMessage('Contacts array is required and must contain at least one contact'),
  body('contacts.*.name')
    .trim()
    .notEmpty()
    .withMessage('Contact name is required')
    .escape(),
  body('contacts.*.phone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Invalid phone number format'),
  body('contacts.*.email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail()
];

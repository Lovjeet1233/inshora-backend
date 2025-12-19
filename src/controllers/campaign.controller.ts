import { Response } from 'express';
import { validationResult } from 'express-validator';
import multer from 'multer';
import Campaign from '../models/Campaign';
import Settings from '../models/Settings';
import Contact from '../models/Contact';
import ContactList from '../models/ContactList';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { parseCSV } from '../utils/csvParser';
import { sendSMS, sendEmail, makeOutboundCall } from '../services/leadGenerator.service';
import { logger } from '../utils/logger';

// Direct campaign processing (fallback when Redis is unavailable)
async function processCampaignDirectly(campaignId: string, userId: string) {
  try {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    logger.info(`Processing campaign ${campaignId} directly (no queue)`);

    const settings = await Settings.findOne({ userId });

    for (let i = 0; i < campaign.contacts.length; i++) {
      const contact = campaign.contacts[i];
      const methods: any[] = [];
      let successfulMethods = 0;
      let failedMethods = 0;

      try {
        // Add delay between contacts (1 second)
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Check if campaign is paused
        const updatedCampaign = await Campaign.findById(campaignId);
        if (updatedCampaign?.status === 'paused') {
          logger.info(`Campaign ${campaignId} paused, stopping processing`);
          break;
        }

        logger.info(`\n${'='.repeat(60)}`);
        logger.info(`📋 Processing Contact ${i + 1}/${campaign.contacts.length}: ${contact.name}`);
        logger.info(`${'='.repeat(60)}`);

        // Determine which methods to execute
        const methodsToExecute: Array<'sms' | 'email' | 'call'> = 
          campaign.type === 'all' ? ['sms', 'email', 'call'] : [campaign.type as 'sms' | 'email' | 'call'];

        // Execute each method
        for (const method of methodsToExecute) {
          let methodStatus: 'sent' | 'failed' = 'sent';
          let methodError: string | undefined;
          let methodResult: any;

          try {
            switch (method) {
              case 'sms':
                if (!contact.phone) {
                  throw new Error('Phone number required for SMS');
                }
                methodResult = await sendSMS(campaign.messageTemplate.body, contact.phone);
                break;

              case 'email':
                if (!contact.email) {
                  throw new Error('Email required for email');
                }
                methodResult = await sendEmail(
                  campaign.messageTemplate.subject || 'Message',
                  campaign.messageTemplate.body,
                  contact.email,
                  campaign.messageTemplate.isHtml || false
                );
                break;

              case 'call':
                if (!contact.phone) {
                  throw new Error('Phone number required for call');
                }
                if (!settings) {
                  throw new Error('Settings not configured for calls');
                }
                methodResult = await makeOutboundCall(contact.phone, contact.name, settings);
                break;
            }

            successfulMethods++;
            logger.info(`✅ ${method.toUpperCase()} successful for ${contact.name}`);
          } catch (err: any) {
            methodStatus = 'failed';
            methodError = err.message;
            failedMethods++;
            logger.error(`❌ ${method.toUpperCase()} failed for ${contact.name}: ${err.message}`);
          }

          methods.push({
            method,
            status: methodStatus,
            timestamp: new Date(),
            response: methodResult ? JSON.stringify(methodResult) : undefined,
            error: methodError
          });

          // Small delay between methods (500ms)
          if (methodsToExecute.length > 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }

        // Determine overall status
        let overallStatus: 'success' | 'partial' | 'failed';
        if (successfulMethods === methodsToExecute.length) {
          overallStatus = 'success';
          campaign.successCount++;
        } else if (successfulMethods > 0) {
          overallStatus = 'partial';
          campaign.successCount++;
        } else {
          overallStatus = 'failed';
          campaign.failureCount++;
        }

        logger.info(`\n📊 Contact Summary: ${contact.name}`);
        logger.info(`   Overall Status: ${overallStatus.toUpperCase()}`);
        logger.info(`   Successful: ${successfulMethods}/${methodsToExecute.length}`);
        logger.info(`   Failed: ${failedMethods}/${methodsToExecute.length}`);
        logger.info(`${'='.repeat(60)}\n`);

      } catch (err: any) {
        logger.error(`❌ Critical error processing ${contact.name}: ${err.message}`);
        campaign.failureCount++;
      }

      // Update results
      campaign.results.push({
        contactId: `${i}`,
        contactName: contact.name,
        methods,
        overallStatus: methods.every(m => m.status === 'sent') ? 'success' : 
                       methods.some(m => m.status === 'sent') ? 'partial' : 'failed',
        timestamp: new Date()
      } as any);

      await campaign.save();
    }

    // Mark as completed
    campaign.status = 'completed';
    await campaign.save();
    
    logger.info(`\n${'█'.repeat(60)}`);
    logger.info(`🎉 CAMPAIGN COMPLETED: ${campaign.name}`);
    logger.info(`   Total Contacts: ${campaign.contacts.length}`);
    logger.info(`   Successful: ${campaign.successCount}`);
    logger.info(`   Failed: ${campaign.failureCount}`);
    logger.info(`${'█'.repeat(60)}\n`);

  } catch (error: any) {
    logger.error(`Campaign processing failed: ${error.message}`);
    const campaign = await Campaign.findById(campaignId);
    if (campaign) {
      campaign.status = 'paused';
      await campaign.save();
    }
  }
}

// Configure multer for CSV uploads
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  fileFilter: (_req, file, cb): void => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// @desc    Create campaign
// @route   POST /api/campaigns
// @access  Private
export const createCampaign = asyncHandler(async (req: AuthRequest, res: Response) => {
  logger.info(`📝 Create Campaign Request: ${JSON.stringify(req.body, null, 2)}`);
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.error(`❌ Validation failed: ${JSON.stringify(errors.array(), null, 2)}`);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const campaignData = {
    ...req.body,
    userId: req.userId
  };

  const campaign = await Campaign.create(campaignData);

  logger.info(`✅ Campaign created: ${campaign._id} (${campaign.name})`);

  return res.status(201).json({
    success: true,
    message: 'Campaign created successfully',
    data: campaign
  });
});

// @desc    Get all campaigns
// @route   GET /api/campaigns
// @access  Private
export const getCampaigns = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as string;
  const type = req.query.type as string;

  const query: any = { userId: req.userId };
  if (status) query.status = status;
  if (type) query.type = type;

  const campaigns = await Campaign.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit);

  const total = await Campaign.countDocuments(query);

  return res.status(200).json({
    success: true,
    count: campaigns.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: campaigns
  });
});

// @desc    Get campaign by ID
// @route   GET /api/campaigns/:id
// @access  Private
export const getCampaignById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const campaign = await Campaign.findOne({
    _id: req.params.id,
    userId: req.userId
  });

  if (!campaign) {
    return res.status(404).json({
      success: false,
      message: 'Campaign not found'
    });
  }

  return res.status(200).json({
    success: true,
    data: campaign
  });
});

// @desc    Start campaign
// @route   POST /api/campaigns/:id/start
// @access  Private
export const startCampaign = asyncHandler(async (req: AuthRequest, res: Response) => {
  logger.info(`🚀 START CAMPAIGN REQUEST: ${req.params.id}`);
  
  const campaign = await Campaign.findOne({
    _id: req.params.id,
    userId: req.userId
  });

  if (!campaign) {
    logger.warn(`Campaign not found: ${req.params.id}`);
    return res.status(404).json({
      success: false,
      message: 'Campaign not found'
    });
  }

  logger.info(`Campaign found: ${campaign.name}, Status: ${campaign.status}, Contacts: ${campaign.contacts.length}`);

  if (campaign.status === 'running') {
    logger.warn(`Campaign already running: ${campaign._id}`);
    return res.status(400).json({
      success: false,
      message: 'Campaign is already running'
    });
  }

  if (campaign.status === 'completed') {
    logger.warn(`Campaign already completed: ${campaign._id}`);
    return res.status(400).json({
      success: false,
      message: 'Campaign is already completed'
    });
  }

  // Process campaign directly (skip Redis)
  logger.info(`⚡ Processing campaign directly (Redis disabled)`);
  
  campaign.status = 'running';
  await campaign.save();

  // Process in background
  processCampaignDirectly(campaign._id.toString(), req.userId!).catch(err => {
    logger.error(`Background campaign processing failed: ${err}`);
  });

  return res.status(200).json({
    success: true,
    message: 'Campaign started successfully',
    data: campaign
  });
});

// @desc    Pause campaign
// @route   POST /api/campaigns/:id/pause
// @access  Private
export const pauseCampaign = asyncHandler(async (req: AuthRequest, res: Response) => {
  const campaign = await Campaign.findOne({
    _id: req.params.id,
    userId: req.userId
  });

  if (!campaign) {
    return res.status(404).json({
      success: false,
      message: 'Campaign not found'
    });
  }

  if (campaign.status !== 'running') {
    return res.status(400).json({
      success: false,
      message: 'Campaign is not running'
    });
  }

  campaign.status = 'paused';
  await campaign.save();

  logger.info(`Campaign ${campaign._id} paused`);

  return res.status(200).json({
    success: true,
    message: 'Campaign paused successfully',
    data: campaign
  });
});

// @desc    Upload CSV and parse contacts
// @route   POST /api/campaigns/upload-csv
// @access  Private
export const uploadCSV = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  const contacts = await parseCSV(req.file.buffer);

  logger.info(`Parsed ${contacts.length} contacts from CSV`);

  return res.status(200).json({
    success: true,
    count: contacts.length,
    data: { contacts }
  });
});

// @desc    Send SMS
// @route   POST /api/campaigns/send-sms
// @access  Private
export const sendSMSMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { body, number } = req.body;

  const result = await sendSMS(body, number);

  logger.info(`SMS sent to ${number}`);

  return res.status(200).json({
    success: true,
    message: 'SMS sent successfully',
    data: result
  });
});

// @desc    Send Email
// @route   POST /api/campaigns/send-email
// @access  Private
export const sendEmailMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { subject, body, receiver_email, is_html = false } = req.body;

  const result = await sendEmail(subject, body, receiver_email, is_html);

  logger.info(`Email sent to ${receiver_email}`);

  return res.status(200).json({
    success: true,
    message: 'Email sent successfully',
    data: result
  });
});

// @desc    Make outbound call
// @route   POST /api/campaigns/make-call
// @access  Private
export const makeCall = asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { phone_number, name } = req.body;

  const settings = await Settings.findOne({ userId: req.userId });
  if (!settings) {
    return res.status(400).json({
      success: false,
      message: 'Settings not found. Please configure voice call settings.'
    });
  }

  const result = await makeOutboundCall(phone_number, name, settings);

  logger.info(`Call initiated to ${phone_number}`);

  return res.status(200).json({
    success: true,
    message: 'Call initiated successfully',
    data: result
  });
});

// @desc    Add contact to campaign manually
// @route   POST /api/campaigns/:id/add-contact
// @access  Private
export const addContactToCampaign = asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const campaign = await Campaign.findOne({
    _id: req.params.id,
    userId: req.userId
  });

  if (!campaign) {
    return res.status(404).json({
      success: false,
      message: 'Campaign not found'
    });
  }

  const { name, email, phone } = req.body;

  // Validate that at least name is provided
  if (!name || name.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Contact name is required'
    });
  }

  // Add contact to campaign
  campaign.contacts.push({
    name: name.trim(),
    email: email?.trim() || undefined,
    phone: phone?.trim() || undefined
  });

  await campaign.save();

  logger.info(`Contact added to campaign ${campaign._id}: ${name}`);

  return res.status(200).json({
    success: true,
    message: 'Contact added successfully',
    data: campaign
  });
});

// @desc    Add multiple contacts to campaign manually
// @route   POST /api/campaigns/:id/add-contacts
// @access  Private
export const addContactsToCampaign = asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const campaign = await Campaign.findOne({
    _id: req.params.id,
    userId: req.userId
  });

  if (!campaign) {
    return res.status(404).json({
      success: false,
      message: 'Campaign not found'
    });
  }

  const { contacts } = req.body;

  if (!Array.isArray(contacts) || contacts.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Contacts array is required and must not be empty'
    });
  }

  // Validate and add contacts
  const validContacts = contacts.filter(contact => 
    contact.name && contact.name.trim() !== ''
  ).map(contact => ({
    name: contact.name.trim(),
    email: contact.email?.trim() || undefined,
    phone: contact.phone?.trim() || undefined
  }));

  if (validContacts.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No valid contacts provided. Each contact must have at least a name.'
    });
  }

  campaign.contacts.push(...validContacts);
  await campaign.save();

  logger.info(`${validContacts.length} contacts added to campaign ${campaign._id}`);

  return res.status(200).json({
    success: true,
    message: `${validContacts.length} contacts added successfully`,
    data: campaign
  });
});

// @desc    Load contacts from a contact list to campaign
// @route   POST /api/campaigns/:id/load-from-list
// @access  Private
export const loadContactsFromList = asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const campaign = await Campaign.findOne({
    _id: req.params.id,
    userId: req.userId
  });

  if (!campaign) {
    return res.status(404).json({
      success: false,
      message: 'Campaign not found'
    });
  }

  const { list_id } = req.body;

  // Find the contact list
  const contactList = await ContactList.findOne({
    _id: list_id,
    userId: req.userId
  });

  if (!contactList) {
    return res.status(404).json({
      success: false,
      message: 'Contact list not found'
    });
  }

  // Fetch all contacts from the list
  const contacts = await Contact.find({
    _id: { $in: contactList.contacts },
    userId: req.userId
  });

  if (contacts.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No contacts found in the list'
    });
  }

  // Convert Contact model to campaign contact format
  const campaignContacts = contacts.map(contact => ({
    name: contact.name,
    email: contact.email || undefined,
    phone: contact.phone || undefined
  }));

  campaign.contacts.push(...campaignContacts);
  await campaign.save();

  logger.info(`${campaignContacts.length} contacts loaded from list ${contactList.name} to campaign ${campaign._id}`);

  return res.status(200).json({
    success: true,
    message: `${campaignContacts.length} contacts loaded from list successfully`,
    data: campaign
  });
});

export default {
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
  addContactsToCampaign,
  loadContactsFromList
};

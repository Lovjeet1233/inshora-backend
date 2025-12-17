import Bull from 'bull';
import { logger } from '../utils/logger';
import Campaign, { IContact } from '../models/Campaign';
import Settings from '../models/Settings';
import { sendSMS, sendEmail, makeOutboundCall } from '../services/leadGenerator.service';

// Create campaign queue
export const campaignQueue = new Bull('campaign-processing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: true,
    removeOnFail: false
  }
});

interface CampaignJobData {
  campaignId: string;
  userId: string;
}

interface ContactJobData {
  campaignId: string;
  userId: string;
  contact: IContact;
  contactIndex: number;
  messageTemplate: any;
  campaignType: 'sms' | 'email' | 'call';
}

// Process campaign jobs
campaignQueue.process('start-campaign', async (job) => {
  const { campaignId, userId } = job.data as CampaignJobData;

  try {
    logger.info(`Processing campaign ${campaignId}`);

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Update status to running
    campaign.status = 'running';
    await campaign.save();

    // Add individual contact jobs to the queue
    for (let i = 0; i < campaign.contacts.length; i++) {
      await campaignQueue.add(
        'process-contact',
        {
          campaignId,
          userId,
          contact: campaign.contacts[i],
          contactIndex: i,
          messageTemplate: campaign.messageTemplate,
          campaignType: campaign.type
        },
        {
          delay: i * 1000 // 1 second delay between each contact
        }
      );
    }

    logger.info(`Queued ${campaign.contacts.length} contacts for campaign ${campaignId}`);
    return { success: true, contactsQueued: campaign.contacts.length };
  } catch (error: any) {
    logger.error(`Campaign processing error: ${error.message}`);
    throw error;
  }
});

// Process individual contact
campaignQueue.process('process-contact', async (job) => {
  const { campaignId, userId, contact, contactIndex, messageTemplate, campaignType } = job.data as ContactJobData;

  try {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Check if campaign is still running
    if (campaign.status === 'paused') {
      logger.info(`Campaign ${campaignId} is paused, skipping contact`);
      return { success: false, reason: 'paused' };
    }

    let result: any;
    let status: 'sent' | 'failed' = 'sent';
    let error: string | undefined;

    try {
      switch (campaignType) {
        case 'sms':
          if (!contact.phone) {
            throw new Error('Phone number is required for SMS');
          }
          result = await sendSMS(messageTemplate.body, contact.phone);
          break;

        case 'email':
          if (!contact.email) {
            throw new Error('Email is required for email campaign');
          }
          result = await sendEmail(
            messageTemplate.subject || 'Message',
            messageTemplate.body,
            contact.email,
            messageTemplate.isHtml || false
          );
          break;

        case 'call':
          if (!contact.phone) {
            throw new Error('Phone number is required for call');
          }
          const settings = await Settings.findOne({ userId });
          if (!settings) {
            throw new Error('Voice call settings not found. Please configure in Settings.');
          }
          if (!settings.voiceCall.dynamicInstruction || !settings.voiceCall.apiKey) {
            throw new Error('Voice call settings incomplete. Please configure dynamic instruction and API key.');
          }
          result = await makeOutboundCall(contact.phone, contact.name, settings);
          break;

        default:
          throw new Error(`Invalid campaign type: ${campaignType}`);
      }

      campaign.successCount++;
      logger.info(`Successfully processed contact ${contact.name} for campaign ${campaignId}`);
    } catch (err: any) {
      status = 'failed';
      error = err.message;
      campaign.failureCount++;
      logger.error(`Failed to process contact ${contact.name}: ${err.message}`);
    }

    // Update campaign results
    campaign.results.push({
      contactId: `${contactIndex}`,
      contactName: contact.name,
      methods: [{
        method: campaignType,
        status,
        timestamp: new Date(),
        response: result ? JSON.stringify(result) : undefined,
        error
      }],
      overallStatus: status === 'sent' ? 'success' : 'failed',
      timestamp: new Date()
    } as any);

    // Check if all contacts have been processed
    if (campaign.results.length >= campaign.totalContacts) {
      campaign.status = 'completed';
      logger.info(`Campaign ${campaignId} completed`);
    }

    await campaign.save();

    return { success: status === 'sent', contact: contact.name };
  } catch (error: any) {
    logger.error(`Contact processing error: ${error.message}`);
    throw error;
  }
});

// Queue event handlers
campaignQueue.on('completed', (job, result) => {
  logger.info(`Job ${job.id} completed:`, result);
});

campaignQueue.on('failed', (job, err) => {
  logger.error(`Job ${job?.id} failed:`, err.message);
});

// Suppress Redis connection errors (don't log them repeatedly)
let redisErrorLogged = false;
campaignQueue.on('error', (error: any) => {
  if (!redisErrorLogged && error.code === 'ECONNREFUSED') {
    logger.warn('Redis is not available. Campaign queue functionality will be disabled.');
    redisErrorLogged = true;
  } else if (error.code !== 'ECONNREFUSED') {
    logger.error('Queue error:', error);
  }
});

export default campaignQueue;

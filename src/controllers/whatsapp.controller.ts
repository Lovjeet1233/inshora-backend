import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import WhatsAppMessage from '../models/WhatsAppMessage';
import Settings from '../models/Settings';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { sendWhatsAppMessage, verifyWebhook } from '../services/whatsapp.service';
import { sendChatMessage } from '../services/leadGenerator.service';
import { logger } from '../utils/logger';

// @desc    Webhook verification and message receiving
// @route   POST /api/whatsapp/webhook
// @access  Public
export const webhook = asyncHandler(async (req: Request, res: Response) => {
  logger.info('📱 WhatsApp webhook called');
  logger.info(`Method: ${req.method}, Query: ${JSON.stringify(req.query)}`);
  
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Webhook verification (GET request from Meta)
  if (mode && token) {
    logger.info(`🔐 Webhook verification attempt - Mode: ${mode}, Token: ${token}`);
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'my_verify_token_12345';
    const result = verifyWebhook(mode as string, token as string, challenge as string, verifyToken);

    if (result) {
      logger.info('✅ Webhook verified successfully');
      return res.status(200).send(result);
    } else {
      logger.error('❌ Webhook verification failed');
      return res.status(403).json({ success: false, message: 'Verification failed' });
    }
  }

  // Message receiving (POST request with message data)
  if (req.body.object === 'whatsapp_business_account') {
    logger.info('📨 WhatsApp message received');
    logger.info(`Body: ${JSON.stringify(req.body, null, 2)}`);
    
    try {
      const body = req.body;
      
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          if (change.value?.messages) {
            for (const message of change.value.messages) {
              const from = message.from;
              const text = message.text?.body || '';
              const messageId = message.id;
              const timestamp = new Date();

              logger.info(`💬 Message from ${from}: "${text}"`);

              // Create a thread ID based on the phone number
              const threadId = `whatsapp_${from}`;

              // Find user settings (for now, use the first available user)
              const settings = await Settings.findOne();
              if (!settings) {
                logger.error('❌ No settings found for WhatsApp webhook');
                continue;
              }
              
              logger.info(`✅ Settings found - Phone: ${settings.whatsapp.phoneNumberId}`);

              // Save incoming message
              await WhatsAppMessage.create({
                userId: settings.userId,
                from,
                to: change.value.metadata.phone_number_id,
                message: text,
                threadId,
                direction: 'inbound',
                messageId,
                timestamp
              });

              logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              logger.info(`🤖 CALLING LEAD GENERATOR /chat`);
              logger.info(`Thread ID: ${threadId}`);
              logger.info(`User Message: ${text}`);
              logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              
              // Call LEAD_GENERATOR_URL/chat endpoint
              let chatResponse: string;
              try {
                const response = await sendChatMessage(text, threadId);
                chatResponse = response.response;
                
                logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                logger.info(`✅ LEAD GENERATOR RESPONSE RECEIVED`);
                logger.info(`Response: ${chatResponse}`);
                logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              } catch (error: any) {
                logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                logger.error(`❌ LEAD GENERATOR ERROR: ${error.message}`);
                logger.error(`Stack: ${error.stack}`);
                logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                chatResponse = "I'm having trouble connecting right now. Please try again in a moment.";
              }

              logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              logger.info(`📤 SENDING WHATSAPP RESPONSE`);
              logger.info(`To: ${from}`);
              logger.info(`Message: ${chatResponse}`);
              logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

              // Send response back to WhatsApp
              try {
                await sendWhatsAppMessage(
                  from,
                  chatResponse,
                  settings.whatsapp.phoneNumberId,
                  settings.whatsapp.token
                );
                logger.info(`✅ WhatsApp message SENT to ${from}`);
              } catch (error: any) {
                logger.error(`❌ Failed to send WhatsApp message: ${error.message}`);
                throw error;
              }

              // Save outgoing message
              await WhatsAppMessage.create({
                userId: settings.userId,
                from: change.value.metadata.phone_number_id,
                to: from,
                message: chatResponse,
                threadId,
                direction: 'outbound',
                timestamp: new Date()
              });

              logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              logger.info(`✅ COMPLETE - Message processed for ${from}`);
              logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            }
          }
        }
      }

      logger.info('✅ WhatsApp webhook processed successfully');
      return res.status(200).json({ success: true });
    } catch (error: any) {
      logger.error(`❌ WhatsApp webhook error: ${error.message}`);
      logger.error(`Stack: ${error.stack}`);
      return res.status(200).json({ success: true }); // Always return 200 to Meta
    }
  }

  // If we reach here, it's not a valid WhatsApp webhook call
  logger.warn('⚠️ Webhook called but not a valid WhatsApp request');
  logger.info(`Body object: ${req.body?.object}`);
  return res.status(200).json({ success: false, message: 'Not a WhatsApp webhook' });
});

// @desc    Send WhatsApp message
// @route   POST /api/whatsapp/send
// @access  Private
export const sendMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { to, message, threadId } = req.body;

  const settings = await Settings.findOne({ userId: req.userId });
  if (!settings || !settings.whatsapp.token || !settings.whatsapp.phoneNumberId) {
    return res.status(400).json({
      success: false,
      message: 'WhatsApp settings not configured'
    });
  }

  // Send message
  const result = await sendWhatsAppMessage(
    to,
    message,
    settings.whatsapp.phoneNumberId,
    settings.whatsapp.token
  );

  // Save message to database
  await WhatsAppMessage.create({
    userId: req.userId,
    from: settings.whatsapp.phoneNumberId,
    to,
    message,
    threadId: threadId || `whatsapp_${to}`,
    direction: 'outbound',
    messageId: result.messages?.[0]?.id
  });

  return res.status(200).json({
    success: true,
    message: 'Message sent successfully',
    data: result
  });
});

// @desc    Chat with AI (for chatbot page)
// @route   POST /api/whatsapp/chat
// @access  Private
export const chat = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { query, thread_id } = req.body;

  if (!query || !thread_id) {
    return res.status(400).json({
      success: false,
      message: 'Query and thread_id are required'
    });
  }

  try {
    logger.info(`💬 Chat request - Thread: ${thread_id}, Query: ${query}`);
    
    const response = await sendChatMessage(query, thread_id);

    logger.info(`✅ Chat response received for thread ${thread_id}`);

    return res.status(200).json({
      success: true,
      data: {
        response: response.response,
        thread_id: response.thread_id
      }
    });
  } catch (error: any) {
    logger.error(`❌ Chat error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to process chat message'
    });
  }
});

// @desc    Get all conversations
// @route   GET /api/whatsapp/conversations
// @access  Private
export const getConversations = asyncHandler(async (req: AuthRequest, res: Response) => {
  const messages = await WhatsAppMessage.find({ userId: req.userId })
    .sort({ timestamp: -1 });

  // Group messages by threadId
  const conversations: { [key: string]: any[] } = {};
  
  messages.forEach(msg => {
    if (!conversations[msg.threadId]) {
      conversations[msg.threadId] = [];
    }
    conversations[msg.threadId].push({
      id: msg._id,
      from: msg.from,
      to: msg.to,
      message: msg.message,
      direction: msg.direction,
      timestamp: msg.timestamp
    });
  });

  res.status(200).json({
    success: true,
    count: Object.keys(conversations).length,
    data: conversations
  });
});

export default {
  webhook,
  sendMessage,
  chat,
  getConversations
};

import axios from 'axios';
import { logger } from '../utils/logger';
import { ISettings } from '../models/Settings';

const BASE_URL = process.env.LEAD_GENERATOR_BASE_URL || 'https://inshora-lead-generator.onrender.com';

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  retries: number = MAX_RETRIES
): Promise<T> => {
  try {
    return await requestFn();
  } catch (error: any) {
    if (retries > 0 && error.response?.status >= 500) {
      logger.warn(`Request failed, retrying... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
      await sleep(RETRY_DELAY);
      return retryRequest(requestFn, retries - 1);
    }
    throw error;
  }
};

export const sendChatMessage = async (
  query: string,
  threadId: string
): Promise<{ response: string; thread_id: string }> => {
  const url = `${BASE_URL}/chat`;
  const payload = { query, thread_id: threadId };
  
  try {
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info('💬 SENDING CHAT MESSAGE');
    logger.info(`🔗 URL: ${url}`);
    logger.info(`📦 Payload: ${JSON.stringify(payload, null, 2)}`);
    
    const response = await retryRequest(() =>
      axios.post(url, payload)
    );

    logger.info(`✅ Response Status: ${response.status}`);
    logger.info(`✅ Response Data: ${JSON.stringify(response.data, null, 2)}`);
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return response.data;
  } catch (error: any) {
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.error('❌ CHAT MESSAGE FAILED');
    logger.error(`🔗 URL: ${url}`);
    logger.error(`📦 Payload: ${JSON.stringify(payload, null, 2)}`);
    logger.error(`❌ Error: ${JSON.stringify(error.response?.data || error.message, null, 2)}`);
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    throw new Error(`Failed to send chat message: ${error.response?.data?.message || error.message}`);
  }
};

export const sendSMS = async (
  body: string,
  number: string
): Promise<any> => {
  const url = `${BASE_URL}/sms/send`;
  const payload = { body, number };
  
  try {
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info('📱 SENDING SMS');
    logger.info(`🔗 URL: ${url}`);
    logger.info(`📦 Payload: ${JSON.stringify(payload, null, 2)}`);
    
    const response = await retryRequest(() =>
      axios.post(url, payload)
    );

    logger.info(`✅ Response Status: ${response.status}`);
    logger.info(`✅ Response Data: ${JSON.stringify(response.data, null, 2)}`);
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return response.data;
  } catch (error: any) {
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.error('❌ SMS SEND FAILED');
    logger.error(`🔗 URL: ${url}`);
    logger.error(`📦 Payload: ${JSON.stringify(payload, null, 2)}`);
    logger.error(`❌ Error: ${JSON.stringify(error.response?.data || error.message, null, 2)}`);
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    throw new Error(`Failed to send SMS: ${error.response?.data?.message || error.message}`);
  }
};

export const sendEmail = async (
  subject: string,
  body: string,
  receiverEmail: string,
  isHtml: boolean = false
): Promise<any> => {
  const url = `${BASE_URL}/email/send`;
  const payload = {
    subject,
    body,
    receiver_email: receiverEmail,
    is_html: isHtml
  };
  
  try {
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info('📧 SENDING EMAIL');
    logger.info(`🔗 URL: ${url}`);
    logger.info(`📦 Payload: ${JSON.stringify(payload, null, 2)}`);
    
    const response = await retryRequest(() =>
      axios.post(url, payload)
    );

    logger.info(`✅ Response Status: ${response.status}`);
    logger.info(`✅ Response Data: ${JSON.stringify(response.data, null, 2)}`);
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return response.data;
  } catch (error: any) {
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.error('❌ EMAIL SEND FAILED');
    logger.error(`🔗 URL: ${url}`);
    logger.error(`📦 Payload: ${JSON.stringify(payload, null, 2)}`);
    logger.error(`❌ Error: ${JSON.stringify(error.response?.data || error.message, null, 2)}`);
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    throw new Error(`Failed to send email: ${error.response?.data?.message || error.message}`);
  }
};

export const makeOutboundCall = async (
  phoneNumber: string,
  name: string,
  settings: ISettings
): Promise<any> => {
  const url = `${BASE_URL}/outbound`;
  const payload = {
    phone_number: phoneNumber,
    name,
    dynamic_instruction: settings.voiceCall.dynamicInstruction,
    sip_trunk_id: settings.voiceCall.sipTrunkId,
    transfer_to: settings.voiceCall.transferTo,
    api_key: settings.voiceCall.apiKey,
    voice_id: settings.voiceCall.voiceId,
    provider: settings.voiceCall.provider,
    language: settings.voiceCall.language || 'en',
    escalation_condition: settings.voiceCall.escalationCondition
  };

  try {
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info('📞 MAKING OUTBOUND CALL');
    logger.info(`🔗 URL: ${url}`);
    logger.info(`📦 Payload: ${JSON.stringify(payload, null, 2)}`);
    
    const response = await retryRequest(() =>
      axios.post(url, payload)
    );

    logger.info(`✅ Response Status: ${response.status}`);
    logger.info(`✅ Response Data: ${JSON.stringify(response.data, null, 2)}`);
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return response.data;
  } catch (error: any) {
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.error('❌ OUTBOUND CALL FAILED');
    logger.error(`🔗 URL: ${url}`);
    logger.error(`📦 Payload: ${JSON.stringify(payload, null, 2)}`);
    logger.error(`❌ Error: ${JSON.stringify(error.response?.data || error.message, null, 2)}`);
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    throw new Error(`Failed to make call: ${error.response?.data?.message || error.message}`);
  }
};

export default {
  sendChatMessage,
  sendSMS,
  sendEmail,
  makeOutboundCall
};

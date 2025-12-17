import axios from 'axios';
import { logger } from '../utils/logger';

const WHATSAPP_API_URL = 'https://graph.facebook.com/v21.0';

export const sendWhatsAppMessage = async (
  to: string,
  message: string,
  phoneNumberId: string,
  accessToken: string
): Promise<any> => {
  try {
    const response = await axios.post(
      `${WHATSAPP_API_URL}/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: message }
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    logger.info(`WhatsApp message sent to ${to}`);
    return response.data;
  } catch (error: any) {
    logger.error(`WhatsApp send error: ${error.response?.data || error.message}`);
    throw new Error(`Failed to send WhatsApp message: ${error.response?.data?.error?.message || error.message}`);
  }
};

export const verifyWebhook = (
  mode: string,
  token: string,
  challenge: string,
  verifyToken: string
): string | null => {
  if (mode === 'subscribe' && token === verifyToken) {
    logger.info('WhatsApp webhook verified');
    return challenge;
  }
  logger.warn('WhatsApp webhook verification failed');
  return null;
};

export default {
  sendWhatsAppMessage,
  verifyWebhook
};

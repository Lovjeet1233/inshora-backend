import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { sendChatMessage } from '../services/leadGenerator.service';
import { logger } from '../utils/logger';

// @desc    Chat with AI
// @route   POST /api/ai/chat
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
    logger.info(`💬 AI Chat request - Thread: ${thread_id}, Query: ${query}`);
    
    const response = await sendChatMessage(query, thread_id);

    logger.info(`✅ AI Chat response received for thread ${thread_id}`);

    return res.status(200).json({
      success: true,
      data: {
        response: response.response,
        thread_id: response.thread_id
      }
    });
  } catch (error: any) {
    logger.error(`❌ AI Chat error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to process chat message'
    });
  }
});

export default { chat };

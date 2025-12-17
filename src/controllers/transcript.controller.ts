import { Response } from 'express';
import Transcript from '../models/Transcript';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

// @desc    Get all transcripts
// @route   GET /api/transcripts
// @access  Public (no auth needed as transcripts are from external calls)
export const getTranscripts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = req.query.search as string;

  try {
    const query: any = {};
    
    // Search by name or contact number
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { contact_number: { $regex: search, $options: 'i' } }
      ];
    }

    logger.info(`📞 Fetching transcripts - Page: ${page}, Search: ${search || 'none'}`);

    const transcripts = await Transcript.find(query)
      .sort({ timestamp: -1 }) // Sort by timestamp field in database
      .limit(limit)
      .skip((page - 1) * limit)
      .lean(); // Convert to plain JavaScript objects

    const total = await Transcript.countDocuments(query);

    logger.info(`✅ Fetched ${transcripts.length} transcripts (Total: ${total})`);

    return res.status(200).json({
      success: true,
      count: transcripts.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: transcripts
    });
  } catch (error: any) {
    logger.error(`❌ Error fetching transcripts: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch transcripts',
      error: error.message
    });
  }
});

// @desc    Get transcript by ID
// @route   GET /api/transcripts/:id
// @access  Public
export const getTranscriptById = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    logger.info(`📞 Fetching transcript by ID: ${req.params.id}`);
    
    const transcript = await Transcript.findById(req.params.id).lean();

    if (!transcript) {
      logger.warn(`❌ Transcript not found: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        message: 'Transcript not found'
      });
    }

    logger.info(`✅ Transcript found: ${req.params.id}`);

    return res.status(200).json({
      success: true,
      data: transcript
    });
  } catch (error: any) {
    logger.error(`❌ Error fetching transcript: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch transcript',
      error: error.message
    });
  }
});

export default {
  getTranscripts,
  getTranscriptById
};

import { Response } from 'express';
import axios from 'axios';
import Settings from '../models/Settings';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { cache } from '../utils/cache';

// @desc    Get user settings
// @route   GET /api/settings
// @access  Private
export const getSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const cacheKey = `settings:${req.userId}`;
  
  // Try to get from cache first
  let settings = cache.get(cacheKey);
  
  if (!settings) {
    settings = await Settings.findOne({ userId: req.userId });

    if (!settings) {
      // Create default settings if they don't exist
      settings = await Settings.create({
        userId: req.userId,
        leadGeneratorEndpoint: 'https://inshora-lead-generator.onrender.com',
        voiceCall: {
          voiceId: '21m00Tcm4TlvDq8ikWAM',
          provider: 'openai',
          dynamicInstruction: '',
          sipTrunkId: '',
          transferTo: '',
          apiKey: ''
        }
      });
      logger.info(`Created default settings for user ${req.userId}`);
    }
    
    // Cache for 1 hour
    cache.set(cacheKey, settings, 3600);
  }

  res.status(200).json({
    success: true,
    data: settings
  });
});

// @desc    Update user settings
// @route   PUT /api/settings
// @access  Private
export const updateSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const updateData = req.body;
  const cacheKey = `settings:${req.userId}`;

  let settings = await Settings.findOne({ userId: req.userId });

  if (!settings) {
    // Create new settings if they don't exist
    settings = await Settings.create({
      userId: req.userId,
      ...updateData
    });
  } else {
    // Update existing settings
    Object.assign(settings, updateData);
    await settings.save();
  }

  // Invalidate cache
  cache.delete(cacheKey);

  logger.info(`Settings updated for user ${req.userId}`);

  res.status(200).json({
    success: true,
    message: 'Settings updated successfully',
    data: settings
  });
});

// @desc    Test WhatsApp connection
// @route   POST /api/settings/test-whatsapp
// @access  Private
export const testWhatsApp = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { phoneNumberId, token } = req.body;

  if (!phoneNumberId || !token) {
    return res.status(400).json({
      success: false,
      message: 'Phone Number ID and Token are required'
    });
  }

  try {
    const response = await axios.get(
      `https://graph.facebook.com/v21.0/${phoneNumberId}`,
      {
        params: { access_token: token },
        timeout: 10000
      }
    );

    logger.info(`✅ WhatsApp test successful for user ${req.userId}`);

    return res.status(200).json({
      success: true,
      message: 'WhatsApp connection successful!',
      data: {
        phoneNumber: response.data.display_phone_number || response.data.id,
        verifiedName: response.data.verified_name || 'N/A',
        qualityRating: response.data.quality_rating || 'N/A'
      }
    });
  } catch (error: any) {
    logger.error(`❌ WhatsApp test failed: ${error.message}`);
    return res.status(400).json({
      success: false,
      message: error.response?.data?.error?.message || 'Failed to connect to WhatsApp',
      error: error.response?.data?.error?.type || 'Connection failed'
    });
  }
});

// @desc    Test Facebook connection
// @route   POST /api/settings/test-facebook
// @access  Private
export const testFacebook = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { pageId, accessToken } = req.body;

  if (!pageId || !accessToken) {
    return res.status(400).json({
      success: false,
      message: 'Page ID and Access Token are required'
    });
  }

  try {
    const response = await axios.get(
      `https://graph.facebook.com/v21.0/${pageId}`,
      {
        params: {
          fields: 'id,name,category,fan_count',
          access_token: accessToken
        },
        timeout: 10000
      }
    );

    logger.info(`✅ Facebook test successful for user ${req.userId}`);

    return res.status(200).json({
      success: true,
      message: 'Facebook connection successful!',
      data: {
        pageName: response.data.name,
        category: response.data.category || 'N/A',
        followers: response.data.fan_count || 'N/A'
      }
    });
  } catch (error: any) {
    logger.error(`❌ Facebook test failed: ${error.message}`);
    return res.status(400).json({
      success: false,
      message: error.response?.data?.error?.message || 'Failed to connect to Facebook',
      error: error.response?.data?.error?.type || 'Connection failed'
    });
  }
});

export default {
  getSettings,
  updateSettings,
  testWhatsApp,
  testFacebook
};

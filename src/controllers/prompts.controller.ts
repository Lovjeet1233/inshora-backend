import { Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import Prompt from '../models/Prompt';
import { logger } from '../utils/logger';
import axios from 'axios';

// @desc    Get all prompts
// @route   GET /api/prompts
// @access  Private
export const getPrompts = asyncHandler(async (req: AuthRequest, res: Response) => {
  logger.info(`[GET /api/prompts] Request from user: ${req.userId}`);

  const prompts = await Prompt.find({ userId: req.userId }).sort({ isDefault: -1, createdAt: -1 });

  logger.info(`[GET /api/prompts] Response: ${prompts.length} prompts found`);

  return res.status(200).json({
    success: true,
    count: prompts.length,
    data: prompts
  });
});

// @desc    Get prompt by ID
// @route   GET /api/prompts/:id
// @access  Private
export const getPromptById = asyncHandler(async (req: AuthRequest, res: Response) => {
  logger.info(`[GET /api/prompts/:id] Request from user: ${req.userId}, promptId: ${req.params.id}`);

  const prompt = await Prompt.findOne({
    _id: req.params.id,
    userId: req.userId
  });

  if (!prompt) {
    logger.warn(`[GET /api/prompts/:id] Prompt not found: ${req.params.id}`);
    return res.status(404).json({
      success: false,
      message: 'Prompt not found'
    });
  }

  logger.info(`[GET /api/prompts/:id] Response: Prompt found - ${prompt.name}`);

  return res.status(200).json({
    success: true,
    data: prompt
  });
});

// @desc    Get default prompt
// @route   GET /api/prompts/default
// @access  Private
export const getDefaultPrompt = asyncHandler(async (req: AuthRequest, res: Response) => {
  logger.info(`[GET /api/prompts/default] Request from user: ${req.userId}`);
  logger.info(`[GET /api/prompts/default] Searching for default prompt...`);

  const prompt = await Prompt.findOne({
    userId: req.userId,
    isDefault: true
  });

  logger.info(`[GET /api/prompts/default] Query result: ${prompt ? 'FOUND' : 'NOT FOUND'}`);

  if (!prompt) {
    logger.warn(`[GET /api/prompts/default] No default prompt found for user: ${req.userId}`);
    
    // Check if user has any prompts at all
    const totalPrompts = await Prompt.countDocuments({ userId: req.userId });
    logger.info(`[GET /api/prompts/default] User has ${totalPrompts} total prompts`);
    
    return res.status(404).json({
      success: false,
      message: 'No default prompt set',
      totalPrompts
    });
  }

  logger.info(`[GET /api/prompts/default] Response: Default prompt - ${prompt.name}`);
  logger.info(`[GET /api/prompts/default] Voice ID: ${prompt.voiceId}`);
  logger.info(`[GET /api/prompts/default] Content: ${prompt.content.substring(0, 100)}...`);

  return res.status(200).json({
    success: true,
    data: prompt
  });
});

// @desc    Create prompt
// @route   POST /api/prompts
// @access  Private
export const createPrompt = asyncHandler(async (req: AuthRequest, res: Response) => {
  logger.info(`[POST /api/prompts] Request from user: ${req.userId}`);
  logger.info(`[POST /api/prompts] Body: ${JSON.stringify(req.body)}`);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.error(`[POST /api/prompts] Validation failed: ${JSON.stringify(errors.array())}`);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { name, description, content, voiceId, isDefault } = req.body;

  // If setting as default, remove default from other prompts
  if (isDefault) {
    await Prompt.updateMany(
      { userId: req.userId, isDefault: true },
      { isDefault: false }
    );
    logger.info(`[POST /api/prompts] Cleared default flag from other prompts`);
  }

  const prompt = await Prompt.create({
    userId: req.userId,
    name,
    description,
    content,
    voiceId,
    isDefault: isDefault || false
  });

  logger.info(`[POST /api/prompts] Response: Prompt created successfully - ${prompt._id}`);

  return res.status(201).json({
    success: true,
    message: 'Prompt created successfully',
    data: prompt
  });
});

// @desc    Update prompt
// @route   PUT /api/prompts/:id
// @access  Private
export const updatePrompt = asyncHandler(async (req: AuthRequest, res: Response) => {
  logger.info(`[PUT /api/prompts/:id] Request from user: ${req.userId}, promptId: ${req.params.id}`);
  logger.info(`[PUT /api/prompts/:id] Body: ${JSON.stringify(req.body)}`);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.error(`[PUT /api/prompts/:id] Validation failed: ${JSON.stringify(errors.array())}`);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const prompt = await Prompt.findOne({
    _id: req.params.id,
    userId: req.userId
  });

  if (!prompt) {
    logger.warn(`[PUT /api/prompts/:id] Prompt not found: ${req.params.id}`);
    return res.status(404).json({
      success: false,
      message: 'Prompt not found'
    });
  }

  const { name, description, content, voiceId, isDefault } = req.body;

  // If setting as default, remove default from other prompts
  if (isDefault && !prompt.isDefault) {
    await Prompt.updateMany(
      { userId: req.userId, isDefault: true, _id: { $ne: prompt._id } },
      { isDefault: false }
    );
    logger.info(`[PUT /api/prompts/:id] Cleared default flag from other prompts`);
  }

  if (name !== undefined) prompt.name = name;
  if (description !== undefined) prompt.description = description;
  if (content !== undefined) prompt.content = content;
  if (voiceId !== undefined) prompt.voiceId = voiceId;
  if (isDefault !== undefined) prompt.isDefault = isDefault;

  await prompt.save();

  logger.info(`[PUT /api/prompts/:id] Response: Prompt updated successfully`);

  return res.status(200).json({
    success: true,
    message: 'Prompt updated successfully',
    data: prompt
  });
});

// @desc    Delete prompt
// @route   DELETE /api/prompts/:id
// @access  Private
export const deletePrompt = asyncHandler(async (req: AuthRequest, res: Response) => {
  logger.info(`[DELETE /api/prompts/:id] Request from user: ${req.userId}, promptId: ${req.params.id}`);

  const prompt = await Prompt.findOne({
    _id: req.params.id,
    userId: req.userId
  });

  if (!prompt) {
    logger.warn(`[DELETE /api/prompts/:id] Prompt not found: ${req.params.id}`);
    return res.status(404).json({
      success: false,
      message: 'Prompt not found'
    });
  }

  await prompt.deleteOne();

  logger.info(`[DELETE /api/prompts/:id] Response: Prompt deleted successfully`);

  return res.status(200).json({
    success: true,
    message: 'Prompt deleted successfully'
  });
});

// @desc    Test voice (generate sample audio)
// @route   POST /api/prompts/test-voice
// @access  Private
export const testVoice = asyncHandler(async (req: AuthRequest, res: Response) => {
  logger.info(`[POST /api/prompts/test-voice] Request from user: ${req.userId}`);
  logger.info(`[POST /api/prompts/test-voice] Body: ${JSON.stringify(req.body)}`);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.error(`[POST /api/prompts/test-voice] Validation failed: ${JSON.stringify(errors.array())}`);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { voiceId, text } = req.body;

  try {
    // Use OpenAI TTS API to generate sample audio
    const response = await axios.post(
      'https://api.openai.com/v1/audio/speech',
      {
        model: 'tts-1',
        voice: voiceId,
        input: text || `Hello! This is a sample of the ${voiceId} voice. How do you like it?`
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    );

    logger.info(`[POST /api/prompts/test-voice] Response: Audio generated successfully for voice ${voiceId}`);

    // Return audio as base64
    const audioBase64 = Buffer.from(response.data).toString('base64');

    return res.status(200).json({
      success: true,
      data: {
        audio: `data:audio/mpeg;base64,${audioBase64}`,
        voiceId
      }
    });
  } catch (error: any) {
    logger.error(`[POST /api/prompts/test-voice] Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate voice sample',
      error: error.message
    });
  }
});

export default {
  getPrompts,
  getPromptById,
  getDefaultPrompt,
  createPrompt,
  updatePrompt,
  deletePrompt,
  testVoice
};


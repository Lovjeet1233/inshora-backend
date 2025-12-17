import { Response } from 'express';
import { validationResult } from 'express-validator';
import SocialMediaPost from '../models/SocialMediaPost';
import Settings from '../models/Settings';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { generateImages } from '../services/openai.service';
import {
  validateFacebookToken,
  postToFacebook,
  getPostInsights,
  updatePostCaption,
  deletePost
} from '../services/facebook.service';
import { logger } from '../utils/logger';

// @desc    Validate Facebook token
// @route   GET /api/social/validate-token
// @access  Private
export const validateToken = asyncHandler(async (req: AuthRequest, res: Response) => {
  const settings = await Settings.findOne({ userId: req.userId });
  
  if (!settings || !settings.facebook.accessToken || !settings.facebook.pageId) {
    return res.status(400).json({
      success: false,
      message: 'Facebook settings not configured'
    });
  }

  try {
    const tokenInfo = await validateFacebookToken(settings.facebook.accessToken);

    logger.info(`Token validated for user ${req.userId}`);

    return res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: {
        type: tokenInfo.type,
        expiresAt: tokenInfo.expires_at === 0 ? null : new Date(tokenInfo.expires_at * 1000),
        permissions: tokenInfo.scopes,
        isValid: tokenInfo.is_valid
      }
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Generate images using AI
// @route   POST /api/social/generate-images
// @access  Private
export const generateSocialImages = asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { idea, style = 'professional', platform = 'facebook' } = req.body;

  const result = await generateImages(idea, style, platform);

  logger.info(`Generated ${result.images.length} images for user ${req.userId}`);

  return res.status(200).json({
    success: true,
    data: {
      images: result.images.map(img => img.url),
      caption: result.caption
    }
  });
});

// @desc    Post to Facebook
// @route   POST /api/social/post-to-facebook
// @access  Private
export const postToFacebookPage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { imageUrl, caption } = req.body;

  const settings = await Settings.findOne({ userId: req.userId });
  if (!settings || !settings.facebook.accessToken || !settings.facebook.pageId) {
    return res.status(400).json({
      success: false,
      message: 'Facebook settings not configured'
    });
  }

  const fbResponse = await postToFacebook(
    settings.facebook.pageId,
    settings.facebook.accessToken,
    imageUrl,
    caption
  );

  // Save to database
  const post = await SocialMediaPost.create({
    userId: req.userId,
    platform: 'facebook',
    postId: fbResponse.post_id || fbResponse.id,
    imageUrl,
    caption,
    status: 'published',
    publishedAt: new Date()
  });

  logger.info(`Posted to Facebook: ${post.postId}`);

  return res.status(201).json({
    success: true,
    message: 'Post published successfully',
    data: {
      postId: post.postId,
      url: `https://facebook.com/${post.postId}`
    }
  });
});

// @desc    Get all posts
// @route   GET /api/social/posts
// @access  Private
export const getPosts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as string;

  const query: any = { userId: req.userId };
  if (status) {
    query.status = status;
  }

  const posts = await SocialMediaPost.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit);

  const total = await SocialMediaPost.countDocuments(query);

  res.status(200).json({
    success: true,
    count: posts.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: posts
  });
});

// @desc    Get post insights
// @route   GET /api/social/post/:postId/insights
// @access  Private
export const getInsights = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { postId } = req.params;

  const post = await SocialMediaPost.findOne({
    postId,
    userId: req.userId
  });

  if (!post) {
    return res.status(404).json({
      success: false,
      message: 'Post not found'
    });
  }

  const settings = await Settings.findOne({ userId: req.userId });
  if (!settings || !settings.facebook.accessToken) {
    return res.status(400).json({
      success: false,
      message: 'Facebook settings not configured'
    });
  }

  const insights = await getPostInsights(post.postId, settings.facebook.accessToken);

  // Update database
  post.insights = {
    ...insights,
    lastFetched: new Date()
  };
  await post.save();

  logger.info(`Fetched insights for post ${postId}`);

  return res.status(200).json({
    success: true,
    data: insights
  });
});

// @desc    Update post caption
// @route   PUT /api/social/post/:postId
// @access  Private
export const updatePost = asyncHandler(async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { postId } = req.params;
  const { caption } = req.body;

  const post = await SocialMediaPost.findOne({
    postId,
    userId: req.userId
  });

  if (!post) {
    return res.status(404).json({
      success: false,
      message: 'Post not found'
    });
  }

  const settings = await Settings.findOne({ userId: req.userId });
  if (!settings || !settings.facebook.accessToken) {
    return res.status(400).json({
      success: false,
      message: 'Facebook settings not configured'
    });
  }

  await updatePostCaption(post.postId, settings.facebook.accessToken, caption);

  // Update database
  post.caption = caption;
  await post.save();

  logger.info(`Updated caption for post ${postId}`);

  return res.status(200).json({
    success: true,
    message: 'Post updated successfully',
    data: post
  });
});

// @desc    Delete post
// @route   DELETE /api/social/post/:postId
// @access  Private
export const deleteSocialPost = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { postId } = req.params;

  const post = await SocialMediaPost.findOne({
    postId,
    userId: req.userId
  });

  if (!post) {
    return res.status(404).json({
      success: false,
      message: 'Post not found'
    });
  }

  const settings = await Settings.findOne({ userId: req.userId });
  if (!settings || !settings.facebook.accessToken) {
    return res.status(400).json({
      success: false,
      message: 'Facebook settings not configured'
    });
  }

  await deletePost(post.postId, settings.facebook.accessToken);

  // Update status in database
  post.status = 'deleted';
  await post.save();

  logger.info(`Deleted post ${postId}`);

  return res.status(200).json({
    success: true,
    message: 'Post deleted successfully'
  });
});

export default {
  validateToken,
  generateSocialImages,
  postToFacebookPage,
  getPosts,
  getInsights,
  updatePost,
  deleteSocialPost
};

import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import User from '../models/User';
import Settings from '../models/Settings';
import { generateToken } from '../utils/jwt';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { email, password } = req.body;

  // Check for hardcoded admin credentials
  if (email === 'admin@inshora.com' && password === 'Inshora@2025') {
    // Check if admin user exists
    let user = await User.findOne({ email }).select('+password');

    if (!user) {
      // Create admin user if doesn't exist
      user = await User.create({
        email: 'admin@inshora.com',
        password: 'Inshora@2025',
        name: 'Admin',
        role: 'admin'
      });

      // Create default settings for admin
      await Settings.create({
        userId: user._id,
        leadGeneratorEndpoint: 'https://inshora-lead-generator.onrender.com',
        voiceCall: {
          voiceId: '21m00Tcm4TlvDq8ikWAM',
          provider: 'openai'
        }
      });

      logger.info('Admin user created');
    }

    // Generate token
    const token = generateToken({
      id: user._id.toString(),
      email: user.email
    });

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  }

  // Regular user authentication
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Check password
  const isPasswordCorrect = await user.comparePassword(password);

  if (!isPasswordCorrect) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Generate token
  const token = generateToken({
    id: user._id.toString(),
    email: user.email
  });

  logger.info(`User logged in: ${user.email}`);

  return res.status(200).json({
    success: true,
    token,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  });
});

export default { login };

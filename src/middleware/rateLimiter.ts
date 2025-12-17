import rateLimit from 'express-rate-limit';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Custom key generator for proxy support
  keyGenerator: (req) => {
    return req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || req.ip || 'unknown';
  },
  validate: false
});

// Strict limiter for authentication routes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    success: false,
    message: 'Too many login attempts, please try again after 15 minutes.'
  },
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    return req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || req.ip || 'unknown';
  },
  validate: false
});

// Limiter for external API calls (like OpenAI)
export const externalApiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: {
    success: false,
    message: 'Too many API requests, please slow down.'
  },
  keyGenerator: (req) => {
    return req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || req.ip || 'unknown';
  },
  validate: false
});

// Limiter for campaign operations
export const campaignLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: {
    success: false,
    message: 'Too many campaign operations, please try again later.'
  },
  keyGenerator: (req) => {
    return req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || req.ip || 'unknown';
  },
  validate: false
});

// Limiter for webhook endpoints
export const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Higher limit for webhooks
  message: {
    success: false,
    message: 'Webhook rate limit exceeded.'
  },
  // Use a custom key generator to avoid trust proxy warnings
  keyGenerator: (req) => {
    // For webhooks, use the real IP from X-Forwarded-For or fall back to req.ip
    return req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || req.ip || 'unknown';
  },
  // Skip rate limiting validation errors (we handle proxy manually)
  skip: () => false,
  validate: false
});

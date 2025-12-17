import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import axios from 'axios';
import { logger } from '../utils/logger';

const router = Router();

router.get('/health', async (_req: Request, res: Response) => {
  const checks = {
    server: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'checking' as string,
    leadGenerator: 'checking' as string,
  };

  // Check MongoDB
  try {
    if (mongoose.connection.db) {
      await mongoose.connection.db.admin().ping();
      checks.database = 'ok';
    } else {
      checks.database = 'error: Database not connected';
    }
  } catch (error: any) {
    checks.database = `error: ${error.message}`;
    logger.error('Database health check failed:', error);
  }

  // Check Lead Generator API
  try {
    const leadGenUrl = process.env.LEAD_GENERATOR_BASE_URL || 'https://inshora-lead-generator.onrender.com';
    await axios.get(`${leadGenUrl}/health`, { timeout: 5000 });
    checks.leadGenerator = 'ok';
  } catch (error: any) {
    checks.leadGenerator = `error: ${error.message}`;
    logger.warn('Lead Generator health check failed:', error.message);
  }

  // Determine overall status
  const allOk = checks.database === 'ok' && checks.leadGenerator === 'ok';
  const statusCode = allOk ? 200 : 503;

  res.status(statusCode).json({
    success: allOk,
    status: allOk ? 'healthy' : 'degraded',
    checks,
  });
});

router.get('/health/ready', async (_req: Request, res: Response) => {
  try {
    if (mongoose.connection.db) {
      await mongoose.connection.db.admin().ping();
      res.status(200).json({ ready: true });
    } else {
      res.status(503).json({ ready: false });
    }
  } catch (error) {
    res.status(503).json({ ready: false });
  }
});

router.get('/health/live', (_req: Request, res: Response) => {
  res.status(200).json({ alive: true });
});

export default router;

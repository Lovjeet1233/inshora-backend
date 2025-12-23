import { Request, Response } from 'express';
import * as inboundService from '../services/inbound.service';
import { logger } from '../utils/logger';

/**
 * Ingest data into RAG knowledge base
 */
export const ingestData = async (req: Request, res: Response): Promise<void> => {
  try {
    // Log request body
    logger.info('=== INGEST DATA REQUEST ===');
    logger.info('Request Body:', JSON.stringify(req.body, null, 2));
    
    const { urls } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const pdfs = files?.pdfs;
    const csvs = files?.csvs;

    // Log files info
    logger.info('Files received:', {
      pdfs: pdfs ? pdfs.map(f => ({ name: f.originalname, size: f.size, mimetype: f.mimetype })) : [],
      csvs: csvs ? csvs.map(f => ({ name: f.originalname, size: f.size, mimetype: f.mimetype })) : [],
    });

    // Validation
    if (!urls && (!pdfs || pdfs.length === 0) && (!csvs || csvs.length === 0)) {
      const errorResponse = {
        success: false,
        error: 'At least one data source (urls, pdfs, or csvs) must be provided',
      };
      logger.error('Validation failed - Response:', JSON.stringify(errorResponse, null, 2));
      res.status(400).json(errorResponse);
      return;
    }

    logger.info('Ingesting data into collection: inshora', {
      urls: urls ? urls.split(',').length : 0,
      pdfs: pdfs?.length || 0,
      csvs: csvs?.length || 0,
    });

    const result = await inboundService.ingestData({
      collection_name: 'inshora', // Always use "inshora" as collection name
      urls,
      pdfs,
      csvs,
    });

    const successResponse = {
      success: true,
      data: result,
    };
    
    // Log response body
    logger.info('=== INGEST DATA RESPONSE ===');
    logger.info('Response Body:', JSON.stringify(successResponse, null, 2));
    
    res.json(successResponse);
  } catch (error: any) {
    logger.error('Ingest data error:', error);
    const errorResponse = {
      success: false,
      error: error.message,
    };
    
    // Log error response body
    logger.error('=== INGEST DATA ERROR RESPONSE ===');
    logger.error('Response Body:', JSON.stringify(errorResponse, null, 2));
    
    res.status(500).json(errorResponse);
  }
};

/**
 * Get all ingested data
 */
export const getIngestedData = async (_req: Request, res: Response): Promise<void> => {
  try {
    logger.info('=== GET INGESTED DATA REQUEST ===');
    
    const data = await inboundService.getIngestedData();
    
    const successResponse = {
      success: true,
      data,
    };
    
    logger.info('=== GET INGESTED DATA RESPONSE ===');
    logger.info('Response Body:', JSON.stringify({ ...successResponse, data: `${data.length} records` }, null, 2));
    
    res.json(successResponse);
  } catch (error: any) {
    logger.error('Get ingested data error:', error);
    const errorResponse = {
      success: false,
      error: error.message,
    };
    
    logger.error('=== GET INGESTED DATA ERROR RESPONSE ===');
    logger.error('Response Body:', JSON.stringify(errorResponse, null, 2));
    
    res.status(500).json(errorResponse);
  }
};



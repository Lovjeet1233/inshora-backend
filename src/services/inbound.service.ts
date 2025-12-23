import axios from 'axios';
import FormData from 'form-data';
import { logger } from '../utils/logger';
import { uploadToGCS } from './gcs.service';
import IngestedData from '../models/IngestedData';

const RAG_ENDPOINT = process.env.RAG_ENDPOINT || 'https://inshora-lead-generator.onrender.com';

export interface IngestParams {
  collection_name?: string;
  urls?: string;
  pdfs?: Express.Multer.File[];
  csvs?: Express.Multer.File[];
}

export interface IngestResult {
  message: string;
  collection: string;
  sources: string[];
}

/**
 * Upload files to GCS and get public URLs
 */
async function uploadFilesToGCS(
  files: Express.Multer.File[],
  folder: string
): Promise<{ url: string; filename: string }[]> {
  const uploadPromises = files.map(async (file) => {
    const timestamp = Date.now();
    const filename = `${folder}/${timestamp}-${file.originalname}`;
    const contentType = file.mimetype;
    
    const url = await uploadToGCS(file.buffer, filename, contentType);
    
    return {
      url,
      filename: file.originalname,
    };
  });

  return Promise.all(uploadPromises);
}

/**
 * Ingest data into RAG knowledge base
 */
export async function ingestData(params: IngestParams): Promise<IngestResult> {
  const { collection_name = 'inshora', urls, pdfs, csvs } = params;
  
  try {
    const formData = new FormData();
    formData.append('collection_name', collection_name);
    
    const ingestedRecords: any[] = [];
    const sources: string[] = [];

    // Handle URLs
    if (urls) {
      formData.append('urls', urls);
      const urlList = urls.split(',').map(u => u.trim());
      
      // Save URL records
      for (const url of urlList) {
        ingestedRecords.push({
          collectionName: collection_name,
          type: 'url',
          source: url,
          url: url,
          status: 'success',
        });
        sources.push(url);
      }
    }

    // Handle PDFs - Upload to GCS first
    if (pdfs && pdfs.length > 0) {
      logger.info(`Uploading ${pdfs.length} PDF files to GCS...`);
      const uploadedPdfs = await uploadFilesToGCS(pdfs, 'inbound-pdfs');
      
      // Download from GCS and add to FormData
      for (const pdf of uploadedPdfs) {
        try {
          const response = await axios.get(pdf.url, { responseType: 'arraybuffer' });
          formData.append('pdfs', Buffer.from(response.data), pdf.filename);
          
          ingestedRecords.push({
            collectionName: collection_name,
            type: 'pdf',
            source: pdf.url,
            filename: pdf.filename,
            status: 'success',
          });
          sources.push(pdf.url);
        } catch (error: any) {
          logger.error(`Failed to download PDF from GCS: ${error.message}`);
          ingestedRecords.push({
            collectionName: collection_name,
            type: 'pdf',
            source: pdf.url,
            filename: pdf.filename,
            status: 'failed',
            error: error.message,
          });
        }
      }
    }

    // Handle CSVs - Upload to GCS first
    if (csvs && csvs.length > 0) {
      logger.info(`Uploading ${csvs.length} CSV files to GCS...`);
      const uploadedCsvs = await uploadFilesToGCS(csvs, 'inbound-csvs');
      
      // Download from GCS and add to FormData
      for (const csv of uploadedCsvs) {
        try {
          const response = await axios.get(csv.url, { responseType: 'arraybuffer' });
          formData.append('csvs', Buffer.from(response.data), csv.filename);
          
          ingestedRecords.push({
            collectionName: collection_name,
            type: 'csv',
            source: csv.url,
            filename: csv.filename,
            status: 'success',
          });
          sources.push(csv.url);
        } catch (error: any) {
          logger.error(`Failed to download CSV from GCS: ${error.message}`);
          ingestedRecords.push({
            collectionName: collection_name,
            type: 'csv',
            source: csv.url,
            filename: csv.filename,
            status: 'failed',
            error: error.message,
          });
        }
      }
    }

    // Call RAG endpoint
    logger.info(`Calling RAG endpoint: ${RAG_ENDPOINT}/rag/ingest`);
    const response = await axios.post(`${RAG_ENDPOINT}/rag/ingest`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 120000, // 2 minutes timeout
    });

    logger.info('RAG ingestion successful:', response.data);

    // Save records to database
    await IngestedData.insertMany(ingestedRecords);

    return {
      message: response.data.message || 'Data ingested successfully',
      collection: collection_name,
      sources,
    };
  } catch (error: any) {
    logger.error(`RAG ingestion failed: ${error.message}`);
    if (error.response) {
      logger.error('Error response:', error.response.data);
    }
    throw new Error(`Failed to ingest data: ${error.message}`);
  }
}

/**
 * Get all ingested data records
 */
export async function getIngestedData(): Promise<any[]> {
  return IngestedData.find().sort({ ingestedAt: -1 }).lean();
}


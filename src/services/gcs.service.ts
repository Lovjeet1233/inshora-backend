import { Storage } from '@google-cloud/storage';
import { logger } from '../utils/logger';

let storage: Storage | null = null;
let bucketName: string = '';

/**
 * Initialize Google Cloud Storage
 */
export const initializeGCS = (): void => {
  try {
    const projectId = process.env.GCS_PROJECT_ID;
    bucketName = process.env.GCS_BUCKET_NAME || '';
    const clientEmail = process.env.GCS_CLIENT_EMAIL;
    const privateKey = process.env.GCS_PRIVATE_KEY;

    if (!projectId || !bucketName || !clientEmail || !privateKey) {
      logger.warn('GCS configuration missing. Image uploads will fail.');
      logger.warn('Required: GCS_PROJECT_ID, GCS_BUCKET_NAME, GCS_CLIENT_EMAIL, GCS_PRIVATE_KEY');
      return;
    }

    // Replace escaped newlines in private key
    const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

    storage = new Storage({
      projectId,
      credentials: {
        client_email: clientEmail,
        private_key: formattedPrivateKey,
      },
    });

    logger.info('✅ Google Cloud Storage initialized');
    logger.info(`📦 Bucket: ${bucketName}`);
  } catch (error: any) {
    logger.error(`❌ Failed to initialize GCS: ${error.message}`);
  }
};

/**
 * Upload a buffer to Google Cloud Storage
 */
export const uploadToGCS = async (
  buffer: Buffer,
  filename: string,
  contentType: string = 'image/png'
): Promise<string> => {
  if (!storage || !bucketName) {
    throw new Error('Google Cloud Storage is not initialized');
  }

  try {
    const bucket = storage.bucket(bucketName);
    const blob = bucket.file(`generated-images/${filename}`);

    logger.info(`📤 Uploading to GCS: ${filename}`);

    // Upload the file
    await blob.save(buffer, {
      contentType,
      metadata: {
        cacheControl: 'public, max-age=31536000',
      },
    });

    // Make the file publicly accessible using IAM (for uniform bucket-level access)
    try {
      await blob.makePublic();
      logger.info(`🔓 File made public: ${filename}`);
    } catch (publicError: any) {
      logger.warn(`⚠️  Could not make file public (may already be public): ${publicError.message}`);
    }

    // Get the public URL
    const publicUrl = `https://storage.googleapis.com/${bucketName}/generated-images/${filename}`;

    logger.info(`✅ Upload successful: ${publicUrl}`);

    return publicUrl;
  } catch (error: any) {
    logger.error(`❌ GCS upload failed: ${error.message}`);
    throw new Error(`Failed to upload to GCS: ${error.message}`);
  }
};

/**
 * Delete a file from Google Cloud Storage
 */
export const deleteFromGCS = async (filename: string): Promise<void> => {
  if (!storage || !bucketName) {
    throw new Error('Google Cloud Storage is not initialized');
  }

  try {
    const bucket = storage.bucket(bucketName);
    const blob = bucket.file(`generated-images/${filename}`);

    await blob.delete();

    logger.info(`🗑️  Deleted from GCS: ${filename}`);
  } catch (error: any) {
    logger.error(`❌ GCS delete failed: ${error.message}`);
    throw new Error(`Failed to delete from GCS: ${error.message}`);
  }
};

/**
 * Check if a file exists in Google Cloud Storage
 */
export const fileExistsInGCS = async (filename: string): Promise<boolean> => {
  if (!storage || !bucketName) {
    return false;
  }

  try {
    const bucket = storage.bucket(bucketName);
    const blob = bucket.file(`generated-images/${filename}`);
    const [exists] = await blob.exists();
    return exists;
  } catch (error: any) {
    logger.error(`❌ GCS exists check failed: ${error.message}`);
    return false;
  }
};

export default { initializeGCS, uploadToGCS, deleteFromGCS, fileExistsInGCS };


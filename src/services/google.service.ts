import { GoogleGenAI } from "@google/genai";
import { logger } from '../utils/logger';
import { uploadToGCS } from './gcs.service';

export interface GeneratedImage {
  url: string;
  prompt: string;
  buffer?: Buffer;
}

/**
 * Generate images using Google Gemini AI
 */
export const generateImages = async (
  idea: string,
  style: string = 'professional',
  platform: string = 'facebook',
  apiKey: string
): Promise<{ images: GeneratedImage[]; caption: string }> => {
  if (!apiKey) {
    throw new Error('Google API key is not configured. Please add it in Settings.');
  }

  try {
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info('🎨 GOOGLE GEMINI IMAGE GENERATION');
    logger.info(`💡 Idea: ${idea}`);
    logger.info(`🎭 Style: ${style}`);
    logger.info(`📱 Platform: ${platform}`);

    const ai = new GoogleGenAI({ apiKey });

    // Generate two different prompts based on the idea
    const prompts = [
      `Create a ${style} social media image for ${platform} about: ${idea}. Make it eye-catching and engaging with vibrant colors.`,
      `Design a modern ${style} graphic for ${platform} featuring: ${idea}. Include clear messaging and professional aesthetics.`
    ];

    logger.info(`📝 Generating ${prompts.length} images...`);

    // Generate images in parallel
    const imagePromises = prompts.map(async (prompt, index) => {
      logger.info(`🖼️  Generating image ${index + 1}/${prompts.length}`);
      logger.info(`   Prompt: ${prompt}`);

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: prompt,
      });

      logger.info(`✅ Image ${index + 1} generation response received`);

      // Extract image from response
      let imageBuffer: Buffer | undefined;
      let imageUrl = '';

      if (!response.candidates || !response.candidates[0] || !response.candidates[0].content || !response.candidates[0].content.parts) {
        throw new Error('Invalid response structure from Gemini');
      }

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          imageBuffer = Buffer.from(part.inlineData.data, "base64");
          
          // Upload to Google Cloud Storage
          const filename = `image-${Date.now()}-${index}.png`;
          
          try {
            imageUrl = await uploadToGCS(imageBuffer, filename, 'image/png');
            logger.info(`💾 Image ${index + 1} uploaded to GCS`);
            logger.info(`🔗 Public URL: ${imageUrl}`);
          } catch (error: any) {
            logger.error(`❌ Failed to upload image ${index + 1} to GCS: ${error.message}`);
            throw error;
          }
        }
      }

      return {
        url: imageUrl,
        prompt,
        buffer: imageBuffer
      };
    });

    const images = await Promise.all(imagePromises);

    logger.info(`✅ All ${images.length} images generated successfully`);

    // Generate a caption using Gemini
    logger.info('📝 Generating caption...');
    
    const captionResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are a social media expert. Create an engaging, concise caption for a ${platform} post about: ${idea}. Keep it concise and include relevant hashtags. Return only the caption text.`,
    });

    if (!captionResponse.candidates || !captionResponse.candidates[0] || !captionResponse.candidates[0].content || !captionResponse.candidates[0].content.parts) {
      throw new Error('Invalid caption response structure from Gemini');
    }

    const caption = captionResponse.candidates[0].content.parts[0].text || '';

    logger.info(`✅ Caption generated: ${caption.substring(0, 100)}...`);
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return { images, caption };
  } catch (error: any) {
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.error('❌ GOOGLE GEMINI IMAGE GENERATION FAILED');
    logger.error(`❌ Error: ${error.message}`);
    logger.error(`❌ Stack: ${error.stack}`);
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    throw new Error(`Failed to generate images: ${error.message}`);
  }
};

export default { generateImages };


import OpenAI from 'openai';
import { logger } from '../utils/logger';

export interface GeneratedImage {
  url: string;
  prompt: string;
}

// Lazy-load OpenAI client to ensure env vars are loaded first
const getOpenAIClient = (): OpenAI => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured. Please add OPENAI_API_KEY to your environment variables.');
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
};

export const generateImages = async (
  idea: string,
  style: string = 'professional',
  platform: string = 'facebook'
): Promise<{ images: GeneratedImage[]; caption: string }> => {
  const openai = getOpenAIClient();
  
  try {
    // Generate two different prompts based on the idea
    const prompts = [
      `Create a ${style} social media image for ${platform} about: ${idea}. Make it eye-catching and engaging.`,
      `Design a modern ${style} graphic for ${platform} featuring: ${idea}. Include vibrant colors and clear messaging.`
    ];

    // Generate images in parallel
    const imagePromises = prompts.map(async (prompt) => {
      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard'
      });

      return {
        url: response.data?.[0]?.url || '',
        prompt
      };
    });

    const images = await Promise.all(imagePromises);

    // Generate a caption using GPT
    const captionResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a social media expert. Create engaging, concise captions for social media posts.'
        },
        {
          role: 'user',
          content: `Create an engaging caption for a ${platform} post about: ${idea}. Keep it concise and include relevant hashtags.`
        }
      ],
      max_tokens: 150
    });

    const caption = captionResponse.choices[0].message.content || '';

    logger.info(`Generated ${images.length} images and caption for idea: ${idea}`);

    return { images, caption };
  } catch (error: any) {
    logger.error(`OpenAI image generation error: ${error.message}`);
    throw new Error(`Failed to generate images: ${error.message}`);
  }
};

export default { generateImages };

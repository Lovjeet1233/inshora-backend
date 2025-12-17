import axios from 'axios';
import FormData from 'form-data';
import { logger } from '../utils/logger';

const FACEBOOK_API_VERSION = process.env.FACEBOOK_API_VERSION || 'v21.0';
const FACEBOOK_GRAPH_URL = `https://graph.facebook.com/${FACEBOOK_API_VERSION}`;

export interface FacebookPostResponse {
  id: string;
  post_id: string;
}

export interface FacebookInsights {
  likes: number;
  comments: number;
  shares: number;
  engagement: number;
}

export interface FacebookTokenDebug {
  type: string;
  expires_at: number;
  scopes: string[];
  is_valid: boolean;
  app_id: string;
}

// 🔍 Validate Facebook token before posting
export const validateFacebookToken = async (
  accessToken: string
): Promise<FacebookTokenDebug> => {
  try {
    const response = await axios.get(`${FACEBOOK_GRAPH_URL}/debug_token`, {
      params: {
        input_token: accessToken,
        access_token: accessToken
      }
    });

    const debug = response.data.data;

    // Check if token is valid
    if (!debug.is_valid) {
      throw new Error('Facebook access token is invalid or expired');
    }

    // Check if it's a PAGE token (not USER token)
    if (debug.type !== 'PAGE') {
      throw new Error('Token must be a Page Access Token, not a User Access Token');
    }

    // Check for required permissions
    const requiredPermissions = ['pages_manage_posts', 'pages_read_engagement'];
    const hasRequiredPermissions = requiredPermissions.every(perm => 
      debug.scopes?.includes(perm)
    );

    if (!hasRequiredPermissions) {
      throw new Error(
        `Missing required permissions: ${requiredPermissions.join(', ')}. ` +
        `Current permissions: ${debug.scopes?.join(', ') || 'none'}`
      );
    }

    logger.info(`Facebook token validated: Type=${debug.type}, Expires=${
      debug.expires_at === 0 ? 'Never' : new Date(debug.expires_at * 1000)
    }`);

    return debug;
  } catch (error: any) {
    logger.error(`Facebook token validation error: ${error.response?.data || error.message}`);
    throw new Error(
      `Token validation failed: ${error.response?.data?.error?.message || error.message}`
    );
  }
};

export const postToFacebook = async (
  pageId: string,
  accessToken: string,
  imageUrl: string,
  caption: string,
  validateToken: boolean = true
): Promise<FacebookPostResponse> => {
  try {
    // Validate token first (can be disabled for performance if already validated)
    if (validateToken) {
      await validateFacebookToken(accessToken);
    }

    const form = new FormData();
    form.append('url', imageUrl);
    form.append('caption', caption);
    form.append('access_token', accessToken);

    const response = await axios.post(
      `${FACEBOOK_GRAPH_URL}/${pageId}/photos`,
      form,
      {
        headers: form.getHeaders()
      }
    );

    logger.info(`Posted to Facebook: ${response.data.id}`);

    return response.data;
  } catch (error: any) {
    logger.error(`Facebook post error: ${error.response?.data || error.message}`);
    throw new Error(`Failed to post to Facebook: ${error.response?.data?.error?.message || error.message}`);
  }
};

export const getPostInsights = async (
  postId: string,
  accessToken: string
): Promise<FacebookInsights> => {
  try {
    // Get post engagement data
    const [postData, insightsData] = await Promise.all([
      axios.get(`${FACEBOOK_GRAPH_URL}/${postId}`, {
        params: {
          fields: 'likes.summary(true),comments.summary(true),shares',
          access_token: accessToken
        }
      }),
      axios.get(`${FACEBOOK_GRAPH_URL}/${postId}/insights`, {
        params: {
          metric: 'post_engaged_users,post_impressions',
          access_token: accessToken
        }
      }).catch(() => ({ data: { data: [] } })) // Insights might not be available immediately
    ]);

    const likes = postData.data.likes?.summary?.total_count || 0;
    const comments = postData.data.comments?.summary?.total_count || 0;
    const shares = postData.data.shares?.count || 0;

    // Calculate engagement (interactions / impressions or just sum of interactions)
    const totalInteractions = likes + comments + shares;
    const impressions = insightsData.data.data?.find((d: any) => d.name === 'post_impressions')?.values?.[0]?.value || 1;
    const engagement = impressions > 0 ? (totalInteractions / impressions) * 100 : totalInteractions;

    logger.info(`Fetched insights for post ${postId}: ${likes} likes, ${comments} comments, ${shares} shares`);

    return { likes, comments, shares, engagement };
  } catch (error: any) {
    logger.error(`Facebook insights error: ${error.response?.data || error.message}`);
    throw new Error(`Failed to fetch insights: ${error.response?.data?.error?.message || error.message}`);
  }
};

export const updatePostCaption = async (
  postId: string,
  accessToken: string,
  caption: string
): Promise<boolean> => {
  try {
    await axios.post(`${FACEBOOK_GRAPH_URL}/${postId}`, null, {
      params: {
        message: caption,
        access_token: accessToken
      }
    });

    logger.info(`Updated caption for post ${postId}`);
    return true;
  } catch (error: any) {
    logger.error(`Facebook update error: ${error.response?.data || error.message}`);
    throw new Error(`Failed to update post: ${error.response?.data?.error?.message || error.message}`);
  }
};

export const deletePost = async (
  postId: string,
  accessToken: string
): Promise<boolean> => {
  try {
    await axios.delete(`${FACEBOOK_GRAPH_URL}/${postId}`, {
      params: {
        access_token: accessToken
      }
    });

    logger.info(`Deleted post ${postId}`);
    return true;
  } catch (error: any) {
    logger.error(`Facebook delete error: ${error.response?.data || error.message}`);
    throw new Error(`Failed to delete post: ${error.response?.data?.error?.message || error.message}`);
  }
};

export default {
  validateFacebookToken,
  postToFacebook,
  getPostInsights,
  updatePostCaption,
  deletePost
};

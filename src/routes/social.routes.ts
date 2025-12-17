import { Router } from 'express';
import {
  validateToken,
  generateSocialImages,
  postToFacebookPage,
  getPosts,
  getInsights,
  updatePost,
  deleteSocialPost
} from '../controllers/social.controller';
import { protect } from '../middleware/auth';
import {
  generateImagesValidator,
  postToFacebookValidator,
  updatePostValidator,
  paginationValidator
} from '../middleware/validator';
import { externalApiLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(protect);

router.get('/validate-token', validateToken);
router.post('/generate-images', externalApiLimiter, generateImagesValidator, generateSocialImages);
router.post('/post-to-facebook', postToFacebookValidator, postToFacebookPage);
router.get('/posts', paginationValidator, getPosts);
router.get('/post/:postId/insights', getInsights);
router.put('/post/:postId', updatePostValidator, updatePost);
router.delete('/post/:postId', deleteSocialPost);

export default router;

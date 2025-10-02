import { Router } from 'express';
import { PostController } from '../controllers/post.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();
const postController = new PostController();

// Public routes (no auth required)
router.get('/', postController.getPosts.bind(postController));
router.get('/:postId', postController.getPostById.bind(postController));
router.get('/user/:userId', postController.getUserPosts.bind(postController));
router.get('/:postId/comments', postController.getPostComments.bind(postController));

// Protected routes (auth required)
router.post('/', authenticateToken, postController.createPost.bind(postController));
router.put('/:postId', authenticateToken, postController.updatePost.bind(postController));
router.delete('/:postId', authenticateToken, postController.deletePost.bind(postController));
router.post('/:postId/like', authenticateToken, postController.likePost.bind(postController));
router.post('/:postId/comments', authenticateToken, postController.addComment.bind(postController));
router.put('/comments/:commentId', authenticateToken, postController.updateComment.bind(postController));
router.delete('/comments/:commentId', authenticateToken, postController.deleteComment.bind(postController));

export default router;

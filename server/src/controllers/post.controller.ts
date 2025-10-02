import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import {
  createCommentSchema,
  createPostSchema,
  getPostsSchema,
  updateCommentSchema,
  updatePostSchema
} from '../schemas/post.schema';
import { CreatePostInput, PostService, UpdatePostInput } from '../services/post.service';

const postService = new PostService();

export class PostController {
  async createPost(req: AuthenticatedRequest, res: Response) {
    try {
      const validatedData = createPostSchema.parse(req.body);
      const userId = req.user!.id;

      const post = await postService.createPost(userId, validatedData as CreatePostInput);

      res.status(201).json({
        success: true,
        message: 'Post created successfully',
        data: post
      });
    } catch (error) {
      console.error('Create post error:', error);

      if (error instanceof Error && error.message.includes('validation')) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create post',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getPosts(req: Request, res: Response) {
    try {
      const validatedQuery = getPostsSchema.parse({ query: req.query || {} });
      const { page, limit } = validatedQuery.query;

      // Get userId from auth if available (for isLiked status)
      const userId = (req as AuthenticatedRequest).user?.id;

      const result = await postService.getPosts(page, limit, userId);

      res.json({
        success: true,
        message: 'Posts retrieved successfully',
        data: result.posts,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Get posts error:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve posts',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getPostById(req: Request, res: Response) {
    try {
      const { postId } = req.params;
      const userId = (req as AuthenticatedRequest).user?.id;

      const post = await postService.getPostById(postId, userId);

      res.json({
        success: true,
        message: 'Post retrieved successfully',
        data: post
      });
    } catch (error) {
      console.error('Get post by ID error:', error);

      if (error instanceof Error && error.message === 'Post not found') {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve post',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updatePost(req: AuthenticatedRequest, res: Response) {
    try {
      const { postId } = req.params;
      const validatedData = updatePostSchema.parse(req.body);
      const userId = req.user!.id;

      const updatedPost = await postService.updatePost(
        postId,
        userId,
        validatedData as UpdatePostInput
      ); res.json({
        success: true,
        message: 'Post updated successfully',
        data: updatedPost
      });
    } catch (error) {
      console.error('Update post error:', error);

      if (error instanceof Error) {
        if (error.message === 'Post not found') {
          return res.status(404).json({
            success: false,
            message: 'Post not found'
          });
        }

        if (error.message === 'You can only edit your own posts') {
          return res.status(403).json({
            success: false,
            message: 'You can only edit your own posts'
          });
        }
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update post',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async deletePost(req: AuthenticatedRequest, res: Response) {
    try {
      const { postId } = req.params;
      const userId = req.user!.id;

      await postService.deletePost(postId, userId);

      res.json({
        success: true,
        message: 'Post deleted successfully'
      });
    } catch (error) {
      console.error('Delete post error:', error);

      if (error instanceof Error) {
        if (error.message === 'Post not found') {
          return res.status(404).json({
            success: false,
            message: 'Post not found'
          });
        }

        if (error.message === 'You can only delete your own posts') {
          return res.status(403).json({
            success: false,
            message: 'You can only delete your own posts'
          });
        }
      }

      res.status(500).json({
        success: false,
        message: 'Failed to delete post',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async likePost(req: AuthenticatedRequest, res: Response) {
    try {
      const { postId } = req.params;
      const userId = req.user!.id;

      const result = await postService.likePost(postId, userId);

      res.json({
        success: true,
        message: result.message,
        data: { isLiked: result.isLiked }
      });
    } catch (error) {
      console.error('Like post error:', error);

      if (error instanceof Error && error.message === 'Post not found') {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to like/unlike post',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async addComment(req: AuthenticatedRequest, res: Response) {
    try {
      const { postId } = req.params;
      const validatedData = createCommentSchema.parse(req.body);
      const userId = req.user!.id;

      const comment = await postService.addComment(postId, userId, validatedData.content, validatedData.parentId);

      res.status(201).json({
        success: true,
        message: 'Comment added successfully',
        data: comment
      });
    } catch (error) {
      console.error('Add comment error:', error);

      if (error instanceof Error && error.message === 'Post not found') {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }

      if (error instanceof Error && error.message === 'Parent comment not found') {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to add comment',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updateComment(req: AuthenticatedRequest, res: Response) {
    try {
      const { commentId } = req.params;
      const validatedData = updateCommentSchema.parse(req.body);
      const userId = req.user!.id;

      const updatedComment = await postService.updateComment(commentId, userId, validatedData.content);

      res.json({
        success: true,
        message: 'Comment updated successfully',
        data: updatedComment
      });
    } catch (error) {
      console.error('Update comment error:', error);

      if (error instanceof Error) {
        if (error.message === 'Comment not found') {
          return res.status(404).json({
            success: false,
            message: 'Comment not found'
          });
        }

        if (error.message === 'You can only edit your own comments') {
          return res.status(403).json({
            success: false,
            message: 'You can only edit your own comments'
          });
        }
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update comment',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async deleteComment(req: AuthenticatedRequest, res: Response) {
    try {
      const { commentId } = req.params;
      const userId = req.user!.id;

      await postService.deleteComment(commentId, userId);

      res.json({
        success: true,
        message: 'Comment deleted successfully'
      });
    } catch (error) {
      console.error('Delete comment error:', error);

      if (error instanceof Error) {
        if (error.message === 'Comment not found') {
          return res.status(404).json({
            success: false,
            message: 'Comment not found'
          });
        }

        if (error.message === 'You can only delete your own comments') {
          return res.status(403).json({
            success: false,
            message: 'You can only delete your own comments'
          });
        }
      }

      res.status(500).json({
        success: false,
        message: 'Failed to delete comment',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getPostComments(req: Request, res: Response) {
    try {
      const { postId } = req.params;

      const comments = await postService.getCommentsForPost(postId);

      res.json({
        success: true,
        message: 'Comments retrieved successfully',
        data: comments
      });
    } catch (error) {
      console.error('Get comments error:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve comments',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getUserPosts(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const validatedQuery = getPostsSchema.parse({ query: req.query || {} });
      const { page, limit } = validatedQuery.query;

      const result = await postService.getUserPosts(userId, page, limit);

      res.json({
        success: true,
        message: 'User posts retrieved successfully',
        data: result.posts,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Get user posts error:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user posts',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

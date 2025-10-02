import { z } from 'zod';

export const createPostSchema = z.object({
  type: z.enum(['TEXT', 'MEDIA', 'CODE'], {
    message: 'Post type must be TEXT, MEDIA, or CODE'
  }),
  content: z.string()
    .min(1, 'Content is required')
    .max(5000, 'Content must be less than 5000 characters'),
  codeSnippet: z.string()
    .max(10000, 'Code snippet must be less than 10000 characters')
    .optional(),
  language: z.string()
    .max(50, 'Language must be less than 50 characters')
    .optional(),
  mediaUrls: z.array(z.string().url('Invalid URL format'))
    .max(5, 'Maximum 5 media files allowed')
    .optional()
});

export const updatePostSchema = z.object({
  content: z.string()
    .min(1, 'Content is required')
    .max(5000, 'Content must be less than 5000 characters')
    .optional(),
  codeSnippet: z.string()
    .max(10000, 'Code snippet must be less than 10000 characters')
    .optional(),
  language: z.string()
    .max(50, 'Language must be less than 50 characters')
    .optional()
});

export const createCommentSchema = z.object({
  content: z.string()
    .min(1, 'Comment content is required')
    .max(1000, 'Comment must be less than 1000 characters'),
  parentId: z.string().uuid().optional() // For nested comments
});

export const updateCommentSchema = z.object({
  content: z.string()
    .min(1, 'Comment content is required')
    .max(1000, 'Comment must be less than 1000 characters')
});

export const getPostsSchema = z.object({
  query: z.object({
    page: z.string()
      .regex(/^\d+$/, 'Page must be a number')
      .transform(Number)
      .refine(val => val > 0, 'Page must be greater than 0')
      .optional()
      .default(() => 1),
    limit: z.string()
      .regex(/^\d+$/, 'Limit must be a number')
      .transform(Number)
      .refine(val => val > 0 && val <= 50, 'Limit must be between 1 and 50')
      .optional()
      .default(() => 10)
  }).optional().default(() => ({ page: 1, limit: 10 }))
});

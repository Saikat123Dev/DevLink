import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name must be less than 50 characters'),
    email: z.string()
      .email('Invalid email format')
      .toLowerCase(),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one lowercase letter, one uppercase letter, and one number')
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string()
      .email('Invalid email format')
      .toLowerCase(),
    password: z.string()
      .min(1, 'Password is required')
  })
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name must be less than 50 characters')
      .optional(),
    bio: z.string()
      .max(500, 'Bio must be less than 500 characters')
      .optional(),
    role: z.string()
      .max(50, 'Role must be less than 50 characters')
      .optional(),
    location: z.string()
      .max(100, 'Location must be less than 100 characters')
      .optional(),
    githubUrl: z.string()
      .url('Invalid GitHub URL')
      .optional()
      .or(z.literal('')),
    linkedinUrl: z.string()
      .url('Invalid LinkedIn URL')
      .optional()
      .or(z.literal('')),
    twitterUrl: z.string()
      .url('Invalid Twitter URL')
      .optional()
      .or(z.literal(''))
  })
});

export const createSkillSchema = z.object({
  body: z.object({
    name: z.string()
      .min(1, 'Skill name is required')
      .max(50, 'Skill name must be less than 50 characters'),
    level: z.enum(['PRIMARY', 'SECONDARY'], {
      message: 'Level must be either PRIMARY or SECONDARY'
    })
  })
});

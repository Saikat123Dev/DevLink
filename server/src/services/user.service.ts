import { PrismaClient } from '@prisma/client';
import { cacheService } from '../utils/cache.service';
import { cloudinaryService } from '../utils/cloudinary.util';
import { REDIS_KEYS, TTL } from '../utils/redis';

const prisma = new PrismaClient();

export interface UpdateProfileInput {
  name?: string;
  bio?: string;
  role?: string;
  location?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
}

export interface CreateSkillInput {
  name: string;
  level: 'PRIMARY' | 'SECONDARY';
}

export class UserService {
  async getUserById(userId: string) {
    const cacheKey = `${REDIS_KEYS.USER_PROFILE}${userId}`;

    return cacheService.getOrSet(
      cacheKey,
      async () => {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            email: true,
            bio: true,
            avatar: true,
            role: true,
            location: true,
            githubUrl: true,
            linkedinUrl: true,
            twitterUrl: true,
            createdAt: true,
            updatedAt: true,
            skills: {
              select: {
                id: true,
                name: true,
                level: true,
              },
              orderBy: [
                { level: 'asc' }, // PRIMARY first
                { name: 'asc' }
              ]
            },
            _count: {
              select: {
                posts: true,
                ownedProjects: true,
                sentConnections: {
                  where: { status: 'ACCEPTED' }
                },
                receivedConnections: {
                  where: { status: 'ACCEPTED' }
                }
              }
            }
          }
        });

        if (!user) {
          throw new Error('User not found');
        }

        return user;
      },
      TTL.USER_PROFILE
    );
  }

  async updateProfile(userId: string, data: UpdateProfileInput) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        avatar: true,
        role: true,
        location: true,
        githubUrl: true,
        linkedinUrl: true,
        twitterUrl: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    // Invalidate all user-related caches
    await cacheService.invalidateUserCache(userId);

    return user;
  }

  async addSkill(userId: string, skillData: CreateSkillInput) {
    // Check if user already has this skill
    const existingSkill = await prisma.skill.findFirst({
      where: {
        userId,
        name: {
          equals: skillData.name,
          mode: 'insensitive'
        }
      }
    });

    if (existingSkill) {
      throw new Error('You already have this skill');
    }

    const skill = await prisma.skill.create({
      data: {
        ...skillData,
        userId,
      },
      select: {
        id: true,
        name: true,
        level: true,
      }
    });

    // Invalidate user profile and skills cache
    await cacheService.invalidateUserCache(userId);

    return skill;
  }

  async removeSkill(userId: string, skillId: string) {
    const skill = await prisma.skill.findFirst({
      where: {
        id: skillId,
        userId,
      }
    });

    if (!skill) {
      throw new Error('Skill not found');
    }

    await prisma.skill.delete({
      where: { id: skillId }
    });

    // Invalidate user profile and skills cache
    await cacheService.invalidateUserCache(userId);

    return { message: 'Skill removed successfully' };
  }

  async searchUsers(query: string, currentUserId?: string, limit = 20) {
    const cacheKey = `${REDIS_KEYS.USER_SEARCH}${query}:${currentUserId || 'public'}:${limit}`;

    return cacheService.getOrSet(
      cacheKey,
      async () => {
        const users = await prisma.user.findMany({
          where: {
            AND: [
              {
                OR: [
                  {
                    name: {
                      contains: query,
                      mode: 'insensitive'
                    }
                  },
                  {
                    skills: {
                      some: {
                        name: {
                          contains: query,
                          mode: 'insensitive'
                        }
                      }
                    }
                  },
                  {
                    role: {
                      contains: query,
                      mode: 'insensitive'
                    }
                  }
                ]
              },
              currentUserId ? {
                id: {
                  not: currentUserId
                }
              } : {}
            ]
          },
          select: {
            id: true,
            name: true,
            email: true,
            bio: true,
            avatar: true,
            role: true,
            location: true,
            skills: {
              select: {
                id: true,
                name: true,
                level: true,
              },
              take: 5, // Limit skills shown in search results
            },
            _count: {
              select: {
                sentConnections: {
                  where: { status: 'ACCEPTED' }
                }
              }
            }
          },
          take: limit,
          orderBy: {
            name: 'asc'
          }
        });

        return users;
      },
      TTL.USER_SEARCH
    );
  }

  async getUserPosts(userId: string) {
    const cacheKey = `${REDIS_KEYS.USER_POSTS}${userId}`;

    return cacheService.getOrSet(
      cacheKey,
      async () => {
        const posts = await prisma.post.findMany({
          where: { authorId: userId },
          select: {
            id: true,
            type: true,
            content: true,
            codeSnippet: true,
            language: true,
            mediaUrls: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                likes: true,
                comments: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        return posts;
      },
      TTL.USER_POSTS
    );
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    // Get current user to check if they have an old avatar to delete
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true }
    });

    // Update user avatar
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        avatar: avatarUrl,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        avatar: true,
        role: true,
        location: true,
        githubUrl: true,
        linkedinUrl: true,
        twitterUrl: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    // Delete old avatar from Cloudinary if it exists and is from our CDN
    if (currentUser?.avatar && currentUser.avatar.includes('cloudinary.com')) {
      try {
        // Extract public ID from Cloudinary URL
        const urlParts = currentUser.avatar.split('/');
        const uploadIndex = urlParts.indexOf('upload');
        if (uploadIndex !== -1) {
          const publicIdWithExt = urlParts.slice(uploadIndex + 2).join('/');
          const publicId = publicIdWithExt.split('.')[0];
          await cloudinaryService.deleteResource(publicId, 'image');
        }
      } catch (error) {
        console.error('Failed to delete old avatar:', error);
        // Don't throw error, avatar update was successful
      }
    }

    // Invalidate all user-related caches
    await cacheService.invalidateUserCache(userId);

    return user;
  }
}

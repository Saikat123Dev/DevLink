import { PrismaClient } from '@prisma/client';

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

    return { message: 'Skill removed successfully' };
  }

  async searchUsers(query: string, currentUserId?: string, limit = 20) {
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
  }

  async getUserPosts(userId: string) {
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
  }
}

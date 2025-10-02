import { PrismaClient } from '@prisma/client';
import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

// Validation schemas
const createConversationSchema = z.object({
  type: z.enum(['DIRECT', 'GROUP']),
  participantIds: z.array(z.string().uuid()),
  name: z.string().optional()
});

const sendMessageSchema = z.object({
  content: z.string().min(1),
  type: z.enum(['TEXT', 'IMAGE', 'FILE']).default('TEXT'),
  fileUrl: z.string().optional(),
  fileName: z.string().optional()
});

export class MessageController {
  // Get user's conversations
  async getConversations(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;

      const conversations = await prisma.conversation.findMany({
        where: {
          members: {
            some: {
              userId,
              isArchived: false
            }
          }
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                  isOnline: true
                }
              }
            }
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              sender: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          _count: {
            select: {
              messages: {
                where: {
                  isRead: false,
                  senderId: { not: userId }
                }
              }
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });

      const formattedConversations = conversations.map(conv => {
        const otherMembers = conv.members.filter(m => m.userId !== userId);
        const userMember = conv.members.find(m => m.userId === userId);

        return {
          id: conv.id,
          type: conv.type,
          name: conv.type === 'GROUP' ? conv.name : otherMembers[0]?.user.name,
          participants: otherMembers.map(m => m.user),
          lastMessage: conv.messages[0] || null,
          unreadCount: conv._count.messages,
          isPinned: userMember?.isPinned || false,
          isArchived: userMember?.isArchived || false,
          updatedAt: conv.updatedAt
        };
      });

      res.json({
        success: true,
        data: formattedConversations
      });
    } catch (error: any) {
      console.error('Error getting conversations:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get conversations'
      });
    }
  }

  // Create new conversation
  async createConversation(req: AuthenticatedRequest, res: Response) {
    try {
      const { type, participantIds, name } = createConversationSchema.parse(req.body);
      const userId = req.user!.id;

      // Add current user to participants if not included
      const allParticipantIds = participantIds.includes(userId)
        ? participantIds
        : [...participantIds, userId];

      // For direct messages, check if conversation already exists
      if (type === 'DIRECT' && allParticipantIds.length === 2) {
        const existingConversation = await prisma.conversation.findFirst({
          where: {
            type: 'DIRECT',
            members: {
              every: {
                userId: { in: allParticipantIds }
              }
            }
          },
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatar: true,
                    isOnline: true
                  }
                }
              }
            }
          }
        });

        if (existingConversation) {
          return res.json({
            success: true,
            data: existingConversation
          });
        }
      }

      // Create new conversation
      const conversation = await prisma.conversation.create({
        data: {
          type,
          name: type === 'GROUP' ? name : null,
          isGroup: type === 'GROUP',
          members: {
            create: allParticipantIds.map(participantId => ({
              userId: participantId
            }))
          }
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                  isOnline: true
                }
              }
            }
          }
        }
      });

      res.json({
        success: true,
        data: conversation
      });
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create conversation'
      });
    }
  }

  // Get conversation messages
  async getMessages(req: AuthenticatedRequest, res: Response) {
    try {
      const { conversationId } = req.params;
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const skip = (page - 1) * limit;

      // Check if user is member of conversation
      const membership = await prisma.conversationMember.findFirst({
        where: {
          conversationId,
          userId
        }
      });

      if (!membership) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this conversation'
        });
      }

      const messages = await prisma.message.findMany({
        where: { conversationId },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      });

      // Mark messages as read
      await prisma.message.updateMany({
        where: {
          conversationId,
          senderId: { not: userId },
          isRead: false
        },
        data: { isRead: true }
      });

      // Update last read timestamp
      await prisma.conversationMember.update({
        where: {
          conversationId_userId: {
            conversationId,
            userId
          }
        },
        data: {
          lastReadAt: new Date()
        }
      });

      res.json({
        success: true,
        data: messages.reverse() // Return in chronological order
      });
    } catch (error: any) {
      console.error('Error getting messages:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get messages'
      });
    }
  }

  // Send message
  async sendMessage(req: AuthenticatedRequest, res: Response) {
    try {
      const { conversationId } = req.params;
      const { content, type, fileUrl, fileName } = sendMessageSchema.parse(req.body);
      const userId = req.user!.id;

      // Check if user is member of conversation
      const membership = await prisma.conversationMember.findFirst({
        where: {
          conversationId,
          userId
        }
      });

      if (!membership) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to send messages to this conversation'
        });
      }

      const message = await prisma.message.create({
        data: {
          conversationId,
          senderId: userId,
          content,
          type,
          fileUrl,
          fileName
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      });

      // Update conversation timestamp
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() }
      });

      res.json({
        success: true,
        data: message
      });
    } catch (error: any) {
      console.error('Error sending message:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to send message'
      });
    }
  }

  // Search conversations and messages
  async search(req: AuthenticatedRequest, res: Response) {
    try {
      const { q } = req.query;
      const userId = req.user!.id;

      if (!q || typeof q !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      const searchTerm = q.toLowerCase();

      // Search conversations
      const conversations = await prisma.conversation.findMany({
        where: {
          AND: [
            {
              members: {
                some: { userId }
              }
            },
            {
              OR: [
                {
                  name: {
                    contains: searchTerm,
                    mode: 'insensitive'
                  }
                },
                {
                  members: {
                    some: {
                      user: {
                        name: {
                          contains: searchTerm,
                          mode: 'insensitive'
                        }
                      }
                    }
                  }
                }
              ]
            }
          ]
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatar: true
                }
              }
            }
          }
        }
      });

      // Search messages
      const messages = await prisma.message.findMany({
        where: {
          AND: [
            {
              conversation: {
                members: {
                  some: { userId }
                }
              }
            },
            {
              content: {
                contains: searchTerm,
                mode: 'insensitive'
              }
            }
          ]
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          },
          conversation: {
            select: {
              id: true,
              type: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      });

      res.json({
        success: true,
        data: {
          conversations,
          messages
        }
      });
    } catch (error: any) {
      console.error('Error searching:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to search'
      });
    }
  }

  // Pin/unpin conversation
  async togglePin(req: AuthenticatedRequest, res: Response) {
    try {
      const { conversationId } = req.params;
      const userId = req.user!.id;

      const member = await prisma.conversationMember.findFirst({
        where: {
          conversationId,
          userId
        }
      });

      if (!member) {
        return res.status(404).json({
          success: false,
          message: 'Conversation membership not found'
        });
      }

      const updatedMember = await prisma.conversationMember.update({
        where: {
          conversationId_userId: {
            conversationId,
            userId
          }
        },
        data: {
          isPinned: !member.isPinned
        }
      });

      res.json({
        success: true,
        data: { isPinned: updatedMember.isPinned }
      });
    } catch (error: any) {
      console.error('Error toggling pin:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to toggle pin'
      });
    }
  }

  // Archive/unarchive conversation
  async toggleArchive(req: AuthenticatedRequest, res: Response) {
    try {
      const { conversationId } = req.params;
      const userId = req.user!.id;

      const member = await prisma.conversationMember.findFirst({
        where: {
          conversationId,
          userId
        }
      });

      if (!member) {
        return res.status(404).json({
          success: false,
          message: 'Conversation membership not found'
        });
      }

      const updatedMember = await prisma.conversationMember.update({
        where: {
          conversationId_userId: {
            conversationId,
            userId
          }
        },
        data: {
          isArchived: !member.isArchived
        }
      });

      res.json({
        success: true,
        data: { isArchived: updatedMember.isArchived }
      });
    } catch (error: any) {
      console.error('Error toggling archive:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to toggle archive'
      });
    }
  }
}

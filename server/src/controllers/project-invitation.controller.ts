import { PrismaClient } from '@prisma/client';
import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { NotificationService } from '../services/notification.service';

const prisma = new PrismaClient();
const notificationService = new NotificationService();

// Validation schemas
const createInvitationSchema = z.object({
  developerIds: z.array(z.string().uuid()),
  role: z.enum([
    'FRONTEND',
    'BACKEND',
    'FULLSTACK',
    'DESIGNER',
    'DEVOPS',
    'MOBILE',
    'TESTER'
  ]),
  message: z.string().optional()
});


const respondToInvitationSchema = z.object({
  status: z.enum(['ACCEPTED', 'DECLINED'])
});

export class ProjectInvitationController {
  // Send project invitations
  async sendInvitations(req: AuthenticatedRequest, res: Response) {
    try {
      const { developerIds, role, message } = createInvitationSchema.parse(req.body);
      const { projectId } = req.params;
      const userId = req.user!.id;

      if (!projectId) {
        return res.status(400).json({
          success: false,
          message: 'Project ID is required'
        });
      }

      // Check if user is project owner or admin
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          OR: [
            { ownerId: userId },
            {
              members: {
                some: {
                  userId: userId,
                  role: 'ADMIN'
                }
              }
            }
          ]
        },
        include: {
          owner: true,
          members: true
        }
      });

      if (!project) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to invite members to this project'
        });
      }

      // Check for existing invitations or memberships
      const existingInvitations = await prisma.projectInvitation.findMany({
        where: {
          projectId,
          developerId: { in: developerIds }
        }
      });

      const existingMembers = await prisma.projectMember.findMany({
        where: {
          projectId,
          userId: { in: developerIds }
        }
      });

      const existingDeveloperIds = [
        ...existingInvitations.map(inv => inv.developerId),
        ...existingMembers.map(member => member.userId)
      ];

      const validDeveloperIds = developerIds.filter(id => !existingDeveloperIds.includes(id));

      if (validDeveloperIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'All selected developers have already been invited or are members'
        });
      }

      // Create invitations
      const invitations = await Promise.all(
        validDeveloperIds.map(developerId =>
          prisma.projectInvitation.create({
            data: {
              projectId,
              developerId,
              role: role,
              message,
              sentAt: new Date()
            },
            include: {
              developer: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          })
        )
      );

      // Send notifications
      await Promise.all(
        invitations.map(invitation =>
          notificationService.createNotification({
            userId: invitation.developerId,
            type: 'PROJECT_INVITE',
            title: 'Project Invitation',
            message: `${project.owner.name} invited you to join "${project.name}" as ${role.toLowerCase()}`,
            data: {
              projectId,
              invitationId: invitation.id,
              projectName: project.name,
              ownerName: project.owner.name,
              role
            }
          })
        )
      );

      res.json({
        success: true,
        data: {
          invitationsSent: invitations.length,
          invitations: invitations.map(inv => ({
            id: inv.id,
            developer: {
              id: inv.developer.id,
              name: inv.developer.name,
              email: inv.developer.email
            },
            role: inv.role,
            status: inv.status,
            sentAt: inv.sentAt
          }))
        }
      });
    } catch (error: any) {
      console.error('Error sending invitations:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to send invitations'
      });
    }
  }

  // Get project invitations
  async getProjectInvitations(req: AuthenticatedRequest, res: Response) {
    try {
      const { projectId } = req.params;
      const userId = req.user!.id;

      // Check if user has access to view invitations
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          OR: [
            { ownerId: userId },
            {
              members: {
                some: {
                  userId: userId,
                  role: { in: ['ADMIN', 'MEMBER'] }
                }
              }
            }
          ]
        }
      });

      if (!project) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view project invitations'
        });
      }

      const invitations = await prisma.projectInvitation.findMany({
        where: { projectId },
        include: {
          developer: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              role: true,
              skills: true
            }
          }
        },
        orderBy: { sentAt: 'desc' }
      });

      // Transform the response to match frontend expectations
      const transformedInvitations = invitations.map(inv => ({
        ...inv,
        invitee: inv.developer
      }));

      res.json({
        success: true,
        data: transformedInvitations
      });
    } catch (error: any) {
      console.error('Error getting project invitations:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get project invitations'
      });
    }
  }

  // Get user's received invitations
  async getUserInvitations(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { status } = req.query;

      const whereClause: any = { developerId: userId };
      if (status && ['PENDING', 'ACCEPTED', 'DECLINED'].includes(status as string)) {
        whereClause.status = status;
      }

      const invitations = await prisma.projectInvitation.findMany({
        where: whereClause,
        include: {
          project: {
            include: {
              owner: {
                select: {
                  id: true,
                  name: true,
                  avatar: true
                }
              },
              _count: {
                select: {
                  members: true,
                  tasks: true
                }
              }
            }
          }
        },
        orderBy: { sentAt: 'desc' }
      });

      res.json({
        success: true,
        data: invitations
      });
    } catch (error: any) {
      console.error('Error getting user invitations:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get invitations'
      });
    }
  }

  // Respond to invitation
  async respondToInvitation(req: AuthenticatedRequest, res: Response) {
    try {
      const { invitationId } = req.params;
      const { status } = respondToInvitationSchema.parse(req.body);
      const userId = req.user!.id;

      const invitation = await prisma.projectInvitation.findFirst({
        where: {
          id: invitationId,
          developerId: userId,
          status: 'PENDING'
        },
        include: {
          project: {
            include: {
              owner: true
            }
          }
        }
      });

      if (!invitation) {
        return res.status(404).json({
          success: false,
          message: 'Invitation not found or already responded'
        });
      }

      // Update invitation status
      const updatedInvitation = await prisma.projectInvitation.update({
        where: { id: invitationId },
        data: {
          status,
          respondedAt: new Date()
        }
      });

      // If accepted, add user as project member
      if (status === 'ACCEPTED') {
        await prisma.projectMember.create({
          data: {
            projectId: invitation.projectId,
            userId,
            role: 'MEMBER'
          }
        });

        // Notify project owner
        await notificationService.createNotification({
          userId: invitation.project.ownerId,
          type: 'SYSTEM',
          title: 'Invitation Accepted',
          message: `${req.user!.name} accepted the invitation to join "${invitation.project.name}"`,
          data: {
            projectId: invitation.projectId,
            userId,
            userName: req.user!.name
          }
        });
      }

      res.json({
        success: true,
        data: updatedInvitation
      });
    } catch (error: any) {
      console.error('Error responding to invitation:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to respond to invitation'
      });
    }
  }

  // Cancel invitation (only by project owner/admin)
  async cancelInvitation(req: AuthenticatedRequest, res: Response) {
    try {
      const { invitationId } = req.params;
      const userId = req.user!.id;

      const invitation = await prisma.projectInvitation.findFirst({
        where: { id: invitationId },
        include: {
          project: {
            include: {
              members: {
                where: { userId }
              }
            }
          }
        }
      });

      if (!invitation) {
        return res.status(404).json({
          success: false,
          message: 'Invitation not found'
        });
      }

      // Check permissions
      const isOwner = invitation.project.ownerId === userId;
      const isAdmin = invitation.project.members.some(m => m.userId === userId && m.role === 'ADMIN');

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to cancel this invitation'
        });
      }

      await prisma.projectInvitation.delete({
        where: { id: invitationId }
      });

      res.json({
        success: true,
        message: 'Invitation cancelled successfully'
      });
    } catch (error: any) {
      console.error('Error cancelling invitation:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to cancel invitation'
      });
    }
  }
}

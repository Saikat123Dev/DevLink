import { PrismaClient } from '@prisma/client';
import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

// Validation schemas
const analyticsRangeSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  projectId: z.string().uuid().optional()
});

const recordEventSchema = z.object({
  type: z.string(),
  projectId: z.string().uuid().optional(),
  data: z.record(z.string(), z.any()).optional()
});

export class AnalyticsController {
  // Get project analytics
  async getProjectAnalytics(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { projectId } = req.params;
      const { startDate, endDate } = analyticsRangeSchema.parse(req.query);

      // Check if user has access to project
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          OR: [
            { ownerId: userId },
            {
              members: {
                some: { userId }
              }
            }
          ]
        }
      });

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found or access denied'
        });
      }

      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const end = endDate ? new Date(endDate) : new Date();

      // Get analytics for the project
      const analytics = await prisma.analytics.findMany({
        where: {
          projectId,
          createdAt: {
            gte: start,
            lte: end
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Get project members count
      const membersCount = await prisma.projectMember.count({
        where: { projectId }
      });

      // Parse analytics data from JSON field
      const analyticsData = analytics.map(a => a.data as any);

      // Get project completion stats
      const totalTasks = analyticsData.reduce((acc, a) => acc + (a.tasksCompleted || 0), 0);
      const totalCommits = analyticsData.reduce((acc, a) => acc + (a.commitsCount || 0), 0);
      const totalContributions = analyticsData.reduce((acc, a) => acc + (a.contributionsCount || 0), 0);

      // Calculate average metrics
      const avgProductivity = analyticsData.length > 0
        ? analyticsData.reduce((acc, a) => acc + (a.productivityScore || 0), 0) / analyticsData.length
        : 0;

      const avgCollaboration = analyticsData.length > 0
        ? analyticsData.reduce((acc, a) => acc + (a.collaborationScore || 0), 0) / analyticsData.length
        : 0;

      // Get daily activity data
      const dailyActivity = await this.getDailyActivity(projectId, start, end);

      // Get team performance
      const teamPerformance = await this.getTeamPerformance(projectId, start, end);

      res.json({
        success: true,
        data: {
          overview: {
            membersCount,
            totalTasks,
            totalCommits,
            totalContributions,
            avgProductivity: Math.round(avgProductivity),
            avgCollaboration: Math.round(avgCollaboration)
          },
          dailyActivity,
          teamPerformance,
          analytics: analyticsData
        }
      });
    } catch (error: any) {
      console.error('Error getting project analytics:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get project analytics'
      });
    }
  }

  // Get user dashboard analytics
  async getUserAnalytics(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { startDate, endDate } = analyticsRangeSchema.parse(req.query);

      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      // Get user's projects
      const userProjects = await prisma.project.findMany({
        where: {
          OR: [
            { ownerId: userId },
            {
              members: {
                some: { userId }
              }
            }
          ]
        },
        select: { id: true, name: true }
      });

      const projectIds = userProjects.map(p => p.id);

      // Get analytics for user's projects
      const analytics = await prisma.analytics.findMany({
        where: {
          projectId: { in: projectIds },
          createdAt: {
            gte: start,
            lte: end
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Parse analytics data
      const analyticsData = analytics.map(a => a.data as any);

      // Calculate totals
      const totalProjects = userProjects.length;
      const totalTasks = analyticsData.reduce((acc, a) => acc + (a.tasksCompleted || 0), 0);
      const totalCommits = analyticsData.reduce((acc, a) => acc + (a.commitsCount || 0), 0);
      const totalContributions = analyticsData.reduce((acc, a) => acc + (a.contributionsCount || 0), 0);

      // Get project distribution
      const projectStats = userProjects.map(project => {
        const projectAnalytics = analytics.filter(a => a.projectId === project.id);
        const projectData = projectAnalytics.map(a => a.data as any);
        const tasks = projectData.reduce((acc, a) => acc + (a.tasksCompleted || 0), 0);
        const commits = projectData.reduce((acc, a) => acc + (a.commitsCount || 0), 0);
        const contributions = projectData.reduce((acc, a) => acc + (a.contributionsCount || 0), 0);

        return {
          id: project.id,
          name: project.name,
          tasks,
          commits,
          contributions
        };
      });

      // Get activity timeline
      const activityTimeline = await this.getUserActivityTimeline(userId, start, end);

      // Get performance trends
      const performanceTrends = await this.getUserPerformanceTrends(userId, start, end);

      res.json({
        success: true,
        data: {
          overview: {
            totalProjects,
            totalTasks,
            totalCommits,
            totalContributions
          },
          projectStats,
          activityTimeline,
          performanceTrends
        }
      });
    } catch (error: any) {
      console.error('Error getting user analytics:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get user analytics'
      });
    }
  }

  // Get platform analytics (admin only)
  async getPlatformAnalytics(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;

      // Check if user is admin (you might want to add isAdmin field to User model)
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // For now, allow all authenticated users to view platform analytics
      // In production, you'd check for admin role

      const { startDate, endDate } = analyticsRangeSchema.parse(req.query);
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      // Get platform statistics
      const totalUsers = await prisma.user.count();
      const totalProjects = await prisma.project.count();
      const totalMessages = await prisma.message.count();
      const totalInvitations = await prisma.projectInvitation.count();

      // Get active users (users who have been online in the last 7 days)
      const activeUsers = await prisma.user.count({
        where: {
          lastActive: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      });

      // Get user growth over time (simplified for demo)
      const recentUsers = await prisma.user.count({
        where: {
          createdAt: {
            gte: start
          }
        }
      });

      // Get project creation over time (simplified for demo)
      const recentProjects = await prisma.project.count({
        where: {
          createdAt: {
            gte: start
          }
        }
      });

      res.json({
        success: true,
        data: {
          overview: {
            totalUsers,
            totalProjects,
            totalMessages,
            totalInvitations,
            activeUsers
          },
          growth: {
            recentUsers,
            recentProjects
          }
        }
      });
    } catch (error: any) {
      console.error('Error getting platform analytics:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get platform analytics'
      });
    }
  }

  // Record analytics data
  async recordAnalytics(req: AuthenticatedRequest, res: Response) {
    try {
      const { projectId } = req.params;
      const userId = req.user!.id;

      const analyticsDataSchema = z.object({
        type: z.string(),
        tasksCompleted: z.number().optional(),
        commitsCount: z.number().optional(),
        contributionsCount: z.number().optional(),
        productivityScore: z.number().min(0).max(100).optional(),
        collaborationScore: z.number().min(0).max(100).optional(),
        codeQualityScore: z.number().min(0).max(100).optional(),
        communicationScore: z.number().min(0).max(100).optional()
      });

      const { type, ...data } = analyticsDataSchema.parse(req.body);

      // Check if user has access to project
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          OR: [
            { ownerId: userId },
            {
              members: {
                some: { userId }
              }
            }
          ]
        }
      });

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found or access denied'
        });
      }

      const analytics = await prisma.analytics.create({
        data: {
          userId,
          projectId,
          type,
          data
        }
      });

      res.json({
        success: true,
        data: analytics
      });
    } catch (error: any) {
      console.error('Error recording analytics:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to record analytics'
      });
    }
  }

  // Helper method to get daily activity
  private async getDailyActivity(projectId: string, startDate: Date, endDate: Date) {
    const analytics = await prisma.analytics.findMany({
      where: {
        projectId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Group by day
    const dailyData = new Map<string, any>();

    analytics.forEach(record => {
      const date = record.createdAt.toISOString().split('T')[0];
      const data = record.data as any;

      if (!dailyData.has(date)) {
        dailyData.set(date, {
          date,
          tasks: 0,
          commits: 0,
          contributions: 0
        });
      }

      const day = dailyData.get(date);
      day.tasks += data.tasksCompleted || 0;
      day.commits += data.commitsCount || 0;
      day.contributions += data.contributionsCount || 0;
    });

    return Array.from(dailyData.values());
  }

  // Helper method to get team performance
  private async getTeamPerformance(projectId: string, startDate: Date, endDate: Date) {
    const members = await prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });

    const analytics = await prisma.analytics.findMany({
      where: {
        projectId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    return members.map(member => {
      // Get analytics for this specific user
      const userAnalytics = analytics.filter(a => a.userId === member.userId);
      const userData = userAnalytics.map(a => a.data as any);

      return {
        user: member.user,
        role: member.role,
        productivity: userData.length > 0
          ? Math.round(userData.reduce((acc, a) => acc + (a.productivityScore || 0), 0) / userData.length)
          : 0,
        collaboration: userData.length > 0
          ? Math.round(userData.reduce((acc, a) => acc + (a.collaborationScore || 0), 0) / userData.length)
          : 0,
        tasks: userData.reduce((acc, a) => acc + (a.tasksCompleted || 0), 0),
        commits: userData.reduce((acc, a) => acc + (a.commitsCount || 0), 0)
      };
    });
  }

  // Helper method to get user activity timeline
  private async getUserActivityTimeline(userId: string, startDate: Date, endDate: Date) {
    // Get user's project memberships
    const projectIds = await prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true }
    }).then(members => members.map(m => m.projectId));

    const analytics = await prisma.analytics.findMany({
      where: {
        userId,
        projectId: { in: projectIds },
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    // Get project names separately
    const projects = await prisma.project.findMany({
      where: { id: { in: projectIds } },
      select: { id: true, name: true }
    });

    const projectMap = new Map(projects.map(p => [p.id, p.name]));

    return analytics.map(record => {
      const data = record.data as any;
      return {
        date: record.createdAt,
        project: projectMap.get(record.projectId!) || 'Unknown',
        tasks: data.tasksCompleted || 0,
        commits: data.commitsCount || 0,
        contributions: data.contributionsCount || 0
      };
    });
  }

  // Helper method to get user performance trends
  private async getUserPerformanceTrends(userId: string, startDate: Date, endDate: Date) {
    const projectIds = await prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true }
    }).then(members => members.map(m => m.projectId));

    const analytics = await prisma.analytics.findMany({
      where: {
        userId,
        projectId: { in: projectIds },
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Group by week
    const weeklyData = new Map<string, any>();

    analytics.forEach(record => {
      const weekStart = new Date(record.createdAt);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      const data = record.data as any;

      if (!weeklyData.has(weekKey)) {
        weeklyData.set(weekKey, {
          week: weekKey,
          productivity: 0,
          collaboration: 0,
          codeQuality: 0,
          count: 0
        });
      }

      const week = weeklyData.get(weekKey);
      week.productivity += data.productivityScore || 0;
      week.collaboration += data.collaborationScore || 0;
      week.codeQuality += data.codeQualityScore || 0;
      week.count += 1;
    });

    return Array.from(weeklyData.values()).map(week => ({
      week: week.week,
      productivity: week.count > 0 ? Math.round(week.productivity / week.count) : 0,
      collaboration: week.count > 0 ? Math.round(week.collaboration / week.count) : 0,
      codeQuality: week.count > 0 ? Math.round(week.codeQuality / week.count) : 0
    }));
  }
}

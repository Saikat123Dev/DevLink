import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type NotificationType = 'CONNECTION_REQUEST' | 'PROJECT_INVITE' | 'COMMENT' | 'MENTION' | 'SYSTEM' | 'MESSAGE';

interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
}

export class NotificationService {
  async createNotification(data: CreateNotificationData) {
    try {
      return await prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          data: data.data || {}
        }
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async getUserNotifications(userId: string, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.notification.count({
          where: { userId }
        })
      ]);

      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  async markAsRead(notificationId: string, userId: string) {
    try {
      return await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId
        },
        data: {
          isRead: true
        }
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllAsRead(userId: string) {
    try {
      return await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false
        },
        data: {
          isRead: true
        }
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  async getUnreadCount(userId: string) {
    try {
      return await prisma.notification.count({
        where: {
          userId,
          isRead: false
        }
      });
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  async deleteNotification(notificationId: string, userId: string) {
    try {
      return await prisma.notification.deleteMany({
        where: {
          id: notificationId,
          userId
        }
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }
}

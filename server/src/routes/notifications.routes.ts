import express from 'express';
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth.middleware';
import { NotificationService } from '../services/notification.service';

const router = express.Router();
const notificationService = new NotificationService();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get user notifications
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const notifications = await notificationService.getUserNotifications(userId, page, limit);

    res.json({
      success: true,
      data: notifications
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get notifications'
    });
  }
});

// Get unread notifications count
router.get('/unread-count', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const count = await notificationService.getUnreadCount(userId);

    res.json({
      success: true,
      data: { count }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get unread count'
    });
  }
});

// Mark notification as read
router.patch('/:notificationId/read', async (req: AuthenticatedRequest, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user!.id;

    const notification = await notificationService.markAsRead(notificationId, userId);

    res.json({
      success: true,
      data: notification
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark notification as read'
    });
  }
});

// Mark all notifications as read
router.patch('/mark-all-read', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    await notificationService.markAllAsRead(userId);

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark all notifications as read'
    });
  }
});

// Delete notification
router.delete('/:notificationId', async (req: AuthenticatedRequest, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user!.id;

    await notificationService.deleteNotification(notificationId, userId);

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete notification'
    });
  }
});

export default router;

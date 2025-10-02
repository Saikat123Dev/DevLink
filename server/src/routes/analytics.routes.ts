import express from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();
const analyticsController = new AnalyticsController();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get project analytics
router.get('/projects/:projectId', analyticsController.getProjectAnalytics.bind(analyticsController));

// Get user analytics
router.get('/user', analyticsController.getUserAnalytics.bind(analyticsController));

// Get platform analytics (admin only)
router.get('/platform', analyticsController.getPlatformAnalytics.bind(analyticsController));

// Record analytics data
router.post('/projects/:projectId', analyticsController.recordAnalytics.bind(analyticsController));

export default router;

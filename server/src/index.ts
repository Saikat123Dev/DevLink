import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { errorHandler } from './middleware/error.middleware';
import authRoutes from './routes/auth.routes';
import connectionRoutes from './routes/connection.routes';
import postRoutes from './routes/post.routes';
import projectRoutes from './routes/project.routes';
import userRoutes from './routes/user.routes';
// New extended feature routes
import analyticsRoutes from './routes/analytics.routes';
import messageRoutes from './routes/messages.routes';
import notificationRoutes from './routes/notifications.routes';
import projectInvitationRoutes from './routes/project-invitations.routes';
import searchRoutes from './routes/search.routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Developer Collaboration Platform API is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/projects', projectRoutes);

// Extended feature routes
app.use('/api/projects', projectInvitationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✨ Extended features enabled: invitations, messaging, analytics, search`);
});

export default app;

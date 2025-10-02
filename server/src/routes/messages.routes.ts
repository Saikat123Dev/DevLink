import express from 'express';
import { MessageController } from '../controllers/message.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();
const messageController = new MessageController();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get user's conversations
router.get('/conversations', messageController.getConversations.bind(messageController));

// Create new conversation
router.post('/conversations', messageController.createConversation.bind(messageController));

// Get conversation messages
router.get('/conversations/:conversationId/messages', messageController.getMessages.bind(messageController));

// Send message
router.post('/conversations/:conversationId/messages', messageController.sendMessage.bind(messageController));

// Search conversations and messages
router.get('/search', messageController.search.bind(messageController));

// Pin/unpin conversation
router.patch('/conversations/:conversationId/pin', messageController.togglePin.bind(messageController));

// Archive/unarchive conversation
router.patch('/conversations/:conversationId/archive', messageController.toggleArchive.bind(messageController));

export default router;

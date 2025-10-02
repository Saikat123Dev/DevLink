import { Router } from 'express';
import { ConnectionController } from '../controllers/connection.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();
const connectionController = new ConnectionController();

// Connection management routes
router.post('/request', authenticateToken, connectionController.sendConnectionRequest);
router.put('/request/:requestId/accept', authenticateToken, connectionController.acceptConnectionRequest);
router.put('/request/:requestId/reject', authenticateToken, connectionController.rejectConnectionRequest);

// Get connections and requests
router.get('/', authenticateToken, connectionController.getMyConnections);
router.get('/requests', authenticateToken, connectionController.getConnectionRequests);

// Discovery routes
router.get('/discover', authenticateToken, connectionController.discoverDevelopers);
router.get('/suggestions', authenticateToken, connectionController.getConnectionSuggestions);

// Remove connection
router.delete('/:connectionId', authenticateToken, connectionController.removeConnection);

export default router;

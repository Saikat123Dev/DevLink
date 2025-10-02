import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ConnectionService } from '../services/connection.service';

const connectionService = new ConnectionService();

export class ConnectionController {
  async sendConnectionRequest(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const connection = await connectionService.sendConnectionRequest(userId, req.body);
      res.status(201).json({ success: true, data: connection });
    } catch (error: any) {
      console.error('Send connection request error:', error);
      if (error.message.includes('Cannot send connection request to yourself') ||
        error.message.includes('already exists') ||
        error.message.includes('already pending')) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: error.message || 'Failed to send connection request' });
    }
  }

  async acceptConnectionRequest(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { requestId } = req.params;
      const connection = await connectionService.acceptConnectionRequest(requestId, userId);
      res.json({ success: true, data: connection });
    } catch (error: any) {
      console.error('Accept connection request error:', error);
      if (error.message === 'Connection request not found') {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes('can only accept') || error.message.includes('no longer pending')) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: error.message || 'Failed to accept connection request' });
    }
  }

  async rejectConnectionRequest(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { requestId } = req.params;
      const connection = await connectionService.rejectConnectionRequest(requestId, userId);
      res.json({ success: true, data: connection });
    } catch (error: any) {
      console.error('Reject connection request error:', error);
      if (error.message === 'Connection request not found') {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes('can only reject') || error.message.includes('no longer pending')) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: error.message || 'Failed to reject connection request' });
    }
  }

  async getMyConnections(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await connectionService.getMyConnections(userId, page, limit);
      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('Get connections error:', error);
      res.status(500).json({ message: error.message || 'Failed to fetch connections' });
    }
  }

  async getConnectionRequests(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const result = await connectionService.getConnectionRequests(userId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('Get connection requests error:', error);
      res.status(500).json({ message: error.message || 'Failed to fetch connection requests' });
    }
  }

  async discoverDevelopers(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const filters = {
        skills: req.query.skills ? (req.query.skills as string).split(',') : undefined,
        location: req.query.location as string,
        role: req.query.role as string,
        search: req.query.search as string,
      };

      const result = await connectionService.discoverDevelopers(userId, page, limit, filters);
      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('Discover developers error:', error);
      res.status(500).json({ message: error.message || 'Failed to discover developers' });
    }
  }

  async getConnectionSuggestions(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const suggestions = await connectionService.getConnectionSuggestions(userId, limit);
      res.json({ success: true, data: suggestions });
    } catch (error: any) {
      console.error('Get connection suggestions error:', error);
      res.status(500).json({ message: error.message || 'Failed to fetch connection suggestions' });
    }
  }

  async removeConnection(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { connectionId } = req.params;
      const result = await connectionService.removeConnection(connectionId, userId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('Remove connection error:', error);
      if (error.message === 'Connection not found') {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes('can only remove')) {
        return res.status(403).json({ message: error.message });
      }
      res.status(500).json({ message: error.message || 'Failed to remove connection' });
    }
  }
}

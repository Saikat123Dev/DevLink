import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ProjectService } from '../services/project.service';

const projectService = new ProjectService();

export class ProjectController {
  async createProject(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const project = await projectService.createProject(userId, req.body);
      res.status(201).json({ success: true, data: project });
    } catch (error: any) {
      console.error('Create project error:', error);
      res.status(500).json({ message: error.message || 'Failed to create project' });
    }
  }

  async getProjects(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await projectService.getProjects(userId, page, limit);
      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('Get projects error:', error);
      res.status(500).json({ message: error.message || 'Failed to fetch projects' });
    }
  }

  async getProjectById(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { projectId } = req.params;
      const project = await projectService.getProjectById(projectId, userId);
      res.json({ success: true, data: project });
    } catch (error: any) {
      console.error('Get project error:', error);
      if (error.message === 'Project not found or access denied') {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: error.message || 'Failed to fetch project' });
    }
  }

  async updateProject(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { projectId } = req.params;
      const project = await projectService.updateProject(projectId, userId, req.body);
      res.json({ success: true, data: project });
    } catch (error: any) {
      console.error('Update project error:', error);
      if (error.message === 'Project not found or insufficient permissions') {
        return res.status(403).json({ message: error.message });
      }
      res.status(500).json({ message: error.message || 'Failed to update project' });
    }
  }

  async deleteProject(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { projectId } = req.params;
      const result = await projectService.deleteProject(projectId, userId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('Delete project error:', error);
      if (error.message === 'Project not found or only owner can delete project') {
        return res.status(403).json({ message: error.message });
      }
      res.status(500).json({ message: error.message || 'Failed to delete project' });
    }
  }

  async addProjectMember(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { projectId } = req.params;
      const member = await projectService.addProjectMember(projectId, userId, req.body);
      res.status(201).json({ success: true, data: member });
    } catch (error: any) {
      console.error('Add member error:', error);
      if (error.message.includes('not found') || error.message.includes('insufficient permissions')) {
        return res.status(403).json({ message: error.message });
      }
      if (error.message === 'User is already a member of this project') {
        return res.status(409).json({ message: error.message });
      }
      res.status(500).json({ message: error.message || 'Failed to add member' });
    }
  }

  async removeProjectMember(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { projectId, memberId } = req.params;
      const result = await projectService.removeProjectMember(projectId, userId, memberId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('Remove member error:', error);
      if (error.message.includes('not found') || error.message.includes('insufficient permissions') || error.message === 'Cannot remove project owner') {
        return res.status(403).json({ message: error.message });
      }
      res.status(500).json({ message: error.message || 'Failed to remove member' });
    }
  }

  async getProjectMembers(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { projectId } = req.params;
      const members = await projectService.getProjectMembers(projectId, userId);
      res.json({ success: true, data: members });
    } catch (error: any) {
      console.error('Get members error:', error);
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return res.status(403).json({ message: error.message });
      }
      res.status(500).json({ message: error.message || 'Failed to get members' });
    }
  }

  async updateMemberRole(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { projectId, memberId } = req.params;
      const { role } = req.body;
      const member = await projectService.updateMemberRole(projectId, userId, memberId, role);
      res.json({ success: true, data: member });
    } catch (error: any) {
      console.error('Update member role error:', error);
      if (error.message.includes('not found') || error.message.includes('insufficient permissions') || error.message === 'Cannot modify project owner role') {
        return res.status(403).json({ message: error.message });
      }
      res.status(500).json({ message: error.message || 'Failed to update member role' });
    }
  }

  // Task Management Controllers
  async createTask(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { projectId } = req.params;
      const task = await projectService.createTask(projectId, userId, req.body);
      res.status(201).json({ success: true, data: task });
    } catch (error: any) {
      console.error('Create task error:', error);
      if (error.message === 'Project not found or access denied') {
        return res.status(403).json({ message: error.message });
      }
      res.status(500).json({ message: error.message || 'Failed to create task' });
    }
  }

  async getProjectTasks(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { projectId } = req.params;
      const result = await projectService.getProjectTasks(projectId, userId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('Get tasks error:', error);
      if (error.message === 'Project not found or access denied') {
        return res.status(403).json({ message: error.message });
      }
      res.status(500).json({ message: error.message || 'Failed to fetch tasks' });
    }
  }

  async updateTask(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { taskId } = req.params;
      const task = await projectService.updateTask(taskId, userId, req.body);
      res.json({ success: true, data: task });
    } catch (error: any) {
      console.error('Update task error:', error);
      if (error.message === 'Task not found or access denied') {
        return res.status(403).json({ message: error.message });
      }
      res.status(500).json({ message: error.message || 'Failed to update task' });
    }
  }

  async deleteTask(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { taskId } = req.params;
      const result = await projectService.deleteTask(taskId, userId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('Delete task error:', error);
      if (error.message === 'Task not found or access denied') {
        return res.status(403).json({ message: error.message });
      }
      res.status(500).json({ message: error.message || 'Failed to delete task' });
    }
  }
}

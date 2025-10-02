import { Router } from 'express';
import { ProjectController } from '../controllers/project.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();
const projectController = new ProjectController();

// Project routes
router.post('/', authenticateToken, projectController.createProject);
router.get('/', authenticateToken, projectController.getProjects);
router.get('/:projectId', authenticateToken, projectController.getProjectById);
router.put('/:projectId', authenticateToken, projectController.updateProject);
router.delete('/:projectId', authenticateToken, projectController.deleteProject);

// Project member routes
router.get('/:projectId/members', authenticateToken, projectController.getProjectMembers);
router.post('/:projectId/members', authenticateToken, projectController.addProjectMember);
router.patch('/:projectId/members/:memberId', authenticateToken, projectController.updateMemberRole);
router.delete('/:projectId/members/:memberId', authenticateToken, projectController.removeProjectMember);

// Task routes
router.post('/:projectId/tasks', authenticateToken, projectController.createTask);
router.get('/:projectId/tasks', authenticateToken, projectController.getProjectTasks);
router.put('/tasks/:taskId', authenticateToken, projectController.updateTask);
router.delete('/tasks/:taskId', authenticateToken, projectController.deleteTask);

export default router;

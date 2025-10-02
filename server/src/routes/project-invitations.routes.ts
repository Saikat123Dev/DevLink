import express from 'express';
import { ProjectInvitationController } from '../controllers/project-invitation.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();
const projectInvitationController = new ProjectInvitationController();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Send project invitations
router.post('/:projectId/invitations', projectInvitationController.sendInvitations.bind(projectInvitationController));

// Get project invitations
router.get('/:projectId/invitations', projectInvitationController.getProjectInvitations.bind(projectInvitationController));

// Get user's received invitations
router.get('/invitations/received', projectInvitationController.getUserInvitations.bind(projectInvitationController));

// Respond to invitation
router.patch('/invitations/:invitationId/respond', projectInvitationController.respondToInvitation.bind(projectInvitationController));

// Cancel invitation (project owner only)
router.delete('/invitations/:invitationId', projectInvitationController.cancelInvitation.bind(projectInvitationController));

export default router;

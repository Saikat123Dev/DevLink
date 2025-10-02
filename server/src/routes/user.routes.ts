import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createSkillSchema, updateProfileSchema } from '../schemas/auth.schema';

const router = Router();
const userController = new UserController();

// All user routes require authentication
router.use(authenticateToken);

// User profile routes
router.get('/search', userController.searchUsers.bind(userController));
router.get('/:userId', userController.getUser.bind(userController));
router.get('/:userId/posts', userController.getUserPosts.bind(userController));
router.put('/:userId', validate(updateProfileSchema), userController.updateProfile.bind(userController));

// Skills routes
router.post('/:userId/skills', validate(createSkillSchema), userController.addSkill.bind(userController));
router.delete('/:userId/skills/:skillId', userController.removeSkill.bind(userController));

export default router;

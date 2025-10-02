import express from 'express';
import multer from 'multer';
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth.middleware';
import { UserService } from '../services/user.service';
import { cloudinaryService } from '../utils/cloudinary.util';

const router = express.Router();
const userService = new UserService();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max for avatars
  },
  fileFilter: (req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Only allow images for avatars
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed for avatars.'));
    }
  },
});

// Upload avatar
router.post('/upload', authenticateToken, upload.single('avatar'), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No avatar file uploaded',
      });
    }

    const userId = req.user!.id;
    const file = req.file;
    const fileBuffer = file.buffer;
    const fileName = `avatar-${userId}-${Date.now()}`;

    // Upload to Cloudinary with avatar-specific transformations
    const uploadResult = await cloudinaryService.uploadAvatar(fileBuffer, fileName);

    // Update user's avatar in database
    const user = await userService.updateAvatar(userId, uploadResult.url);

    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        user,
        upload: uploadResult,
      },
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload avatar',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Delete avatar (set to default)
router.delete('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    // Set avatar to empty/default
    const user = await userService.updateAvatar(userId, '');

    res.status(200).json({
      success: true,
      message: 'Avatar removed successfully',
      data: user,
    });
  } catch (error) {
    console.error('Avatar delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove avatar',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

import express from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth.middleware';
import { cloudinaryService } from '../utils/cloudinary.util';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
  fileFilter: (req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Allow images, videos, and common document types
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      'video/webm',
      'application/pdf',
      'application/zip',
      'text/plain',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, videos, and documents are allowed.'));
    }
  },
});

// Upload single file
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    const file = req.file;
    const fileBuffer = file.buffer;
    const fileName = file.originalname;

    let uploadResult;

    // Determine file type and upload accordingly
    if (file.mimetype.startsWith('image/')) {
      uploadResult = await cloudinaryService.uploadImage(fileBuffer, fileName);
    } else if (file.mimetype.startsWith('video/')) {
      uploadResult = await cloudinaryService.uploadVideo(fileBuffer, fileName);
    } else {
      uploadResult = await cloudinaryService.uploadFile(fileBuffer, fileName);
    }

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      data: uploadResult,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload file',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Upload multiple files
router.post('/upload-multiple', authenticateToken, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded',
      });
    }

    const uploadPromises = (req.files as Express.Multer.File[]).map(async (file) => {
      const fileBuffer = file.buffer;
      const fileName = file.originalname;

      if (file.mimetype.startsWith('image/')) {
        return cloudinaryService.uploadImage(fileBuffer, fileName);
      } else if (file.mimetype.startsWith('video/')) {
        return cloudinaryService.uploadVideo(fileBuffer, fileName);
      } else {
        return cloudinaryService.uploadFile(fileBuffer, fileName);
      }
    });

    const uploadResults = await Promise.all(uploadPromises);

    res.status(200).json({
      success: true,
      message: 'Files uploaded successfully',
      data: uploadResults,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload files',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Delete file
router.delete('/upload/:publicId', authenticateToken, async (req, res) => {
  try {
    const { publicId } = req.params;
    const { resourceType } = req.query;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: 'Public ID is required',
      });
    }

    const decodedPublicId = decodeURIComponent(publicId);
    const type = (resourceType as 'image' | 'video' | 'raw') || 'image';

    await cloudinaryService.deleteResource(decodedPublicId, type);

    res.status(200).json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete file',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

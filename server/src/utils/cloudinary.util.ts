import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
  url: string;
  publicId: string;
  resourceType: 'image' | 'video' | 'raw';
  format: string;
  width?: number;
  height?: number;
  duration?: number;
  bytes: number;
}

export class CloudinaryService {
  /**
   * Upload an image to Cloudinary
   */
  async uploadImage(fileBuffer: Buffer, fileName: string, folder: string = 'devlink/posts/images'): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          public_id: `${Date.now()}-${fileName}`,
          transformation: [
            { width: 1920, height: 1080, crop: 'limit' },
            { quality: 'auto:good' },
            { fetch_format: 'auto' }
          ],
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              resourceType: 'image',
              format: result.format,
              width: result.width,
              height: result.height,
              bytes: result.bytes,
            });
          }
        }
      );

      uploadStream.end(fileBuffer);
    });
  }

  /**
   * Upload a video to Cloudinary
   */
  async uploadVideo(fileBuffer: Buffer, fileName: string): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'devlink/posts/videos',
          resource_type: 'video',
          public_id: `${Date.now()}-${fileName}`,
          transformation: [
            { width: 1280, height: 720, crop: 'limit' },
            { quality: 'auto:good' },
          ],
          eager: [
            { width: 300, height: 300, crop: 'thumb', gravity: 'center', format: 'jpg' }
          ],
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              resourceType: 'video',
              format: result.format,
              width: result.width,
              height: result.height,
              duration: result.duration,
              bytes: result.bytes,
            });
          }
        }
      );

      uploadStream.end(fileBuffer);
    });
  }

  /**
   * Upload a file (document, etc.) to Cloudinary
   */
  async uploadFile(fileBuffer: Buffer, fileName: string): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'devlink/posts/files',
          resource_type: 'raw',
          public_id: `${Date.now()}-${fileName}`,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              resourceType: 'raw',
              format: result.format,
              bytes: result.bytes,
            });
          }
        }
      );

      uploadStream.end(fileBuffer);
    });
  }

  /**
   * Upload an avatar image to Cloudinary with avatar-specific transformations
   */
  async uploadAvatar(fileBuffer: Buffer, fileName: string): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'devlink/avatars',
          resource_type: 'image',
          public_id: `${Date.now()}-${fileName}`,
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto:good' },
            { fetch_format: 'auto' }
          ],
          // Generate smaller thumbnails
          eager: [
            { width: 150, height: 150, crop: 'fill', gravity: 'face' },
            { width: 50, height: 50, crop: 'fill', gravity: 'face' }
          ],
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              resourceType: 'image',
              format: result.format,
              width: result.width,
              height: result.height,
              bytes: result.bytes,
            });
          }
        }
      );

      uploadStream.end(fileBuffer);
    });
  }

  /**
   * Delete a resource from Cloudinary
   */
  async deleteResource(publicId: string, resourceType: 'image' | 'video' | 'raw' = 'image'): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    } catch (error) {
      console.error('Error deleting resource from Cloudinary:', error);
      throw error;
    }
  }

  /**
   * Get optimized URL for an image
   */
  getOptimizedImageUrl(publicId: string, options?: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string;
  }): string {
    return cloudinary.url(publicId, {
      transformation: [
        { width: options?.width || 800, height: options?.height, crop: options?.crop || 'limit' },
        { quality: options?.quality || 'auto:good' },
        { fetch_format: 'auto' }
      ]
    });
  }

  /**
   * Get video thumbnail URL
   */
  getVideoThumbnail(publicId: string): string {
    return cloudinary.url(publicId, {
      resource_type: 'video',
      transformation: [
        { width: 400, height: 300, crop: 'fill', gravity: 'center' },
        { format: 'jpg' }
      ]
    });
  }
}

export const cloudinaryService = new CloudinaryService();

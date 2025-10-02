# File & Video Upload Feature - Setup Guide

## Overview

The DevLink platform now supports file and video uploads for posts using **Cloudinary** as the media storage provider. Users can upload images, videos, and files directly when creating media posts.

## Features

✅ **Image Upload** - Support for JPEG, PNG, GIF, WebP formats  
✅ **Video Upload** - Support for MP4, MPEG, QuickTime, WebM formats  
✅ **File Upload** - Support for PDFs, ZIP files, and text documents  
✅ **Multiple Files** - Upload up to 5 files per post (50MB per file)  
✅ **Real-time Progress** - Visual upload progress indicators  
✅ **Cloudinary Integration** - Automatic image optimization and video transcoding  
✅ **Responsive UI** - Beautiful grid layouts for media display  
✅ **Video Controls** - Native browser video player with controls

---

## Server Setup

### 1. Install Dependencies

Cloudinary and multer are already installed in the server dependencies:

```bash
cd server
npm install cloudinary multer @types/multer
```

### 2. Configure Cloudinary

Get your Cloudinary credentials from [Cloudinary Console](https://cloudinary.com/console):

1. Sign up or log in to Cloudinary
2. Go to Dashboard
3. Copy your Cloud Name, API Key, and API Secret

Add to `server/.env`:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

### 3. File Structure

The following files have been created/updated:

**New Files:**

- `server/src/utils/cloudinary.util.ts` - Cloudinary service with upload/delete methods
- `server/src/routes/upload.routes.ts` - Upload endpoints (single & multiple files)
- `server/.env.example` - Environment variables template

**Updated Files:**

- `server/src/index.ts` - Registered upload routes
- `client/src/components/PostCreator.tsx` - Added file upload UI
- `client/src/components/PostCard.tsx` - Enhanced media display

---

## API Endpoints

### Upload Single File

```http
POST /api/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

Body:
- file: File (required)
```

**Response:**

```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "url": "https://res.cloudinary.com/...",
    "publicId": "devlink/posts/images/1234567890-filename",
    "resourceType": "image",
    "format": "jpg",
    "width": 1920,
    "height": 1080,
    "bytes": 245760
  }
}
```

### Upload Multiple Files

```http
POST /api/upload-multiple
Authorization: Bearer {token}
Content-Type: multipart/form-data

Body:
- files: File[] (max 10 files)
```

**Response:**

```json
{
  "success": true,
  "message": "Files uploaded successfully",
  "data": [
    { "url": "...", "publicId": "...", ... },
    { "url": "...", "publicId": "...", ... }
  ]
}
```

### Delete File

```http
DELETE /api/upload/:publicId?resourceType=image
Authorization: Bearer {token}
```

---

## Client Usage

### PostCreator Component

The `PostCreator` component now includes:

- **File Upload Button** - Click to select files
- **Drag & Drop** (coming soon)
- **Upload Progress Bar** - Shows upload percentage
- **File Previews** - Image/video/file thumbnails
- **Remove Files** - Delete before posting
- **Limits** - Max 5 files, 50MB each

### Creating a Post with Media

```typescript
// User flow:
1. Click "Media" tab in PostCreator
2. Add caption (optional)
3. Click upload button or drag files
4. Wait for upload (progress shown)
5. Preview uploaded files
6. Click "Create Post"
```

### File Types Supported

**Images:**

- `image/jpeg`
- `image/jpg`
- `image/png`
- `image/gif`
- `image/webp`

**Videos:**

- `video/mp4`
- `video/mpeg`
- `video/quicktime`
- `video/webm`

**Documents:**

- `application/pdf`
- `application/zip`
- `text/plain`

---

## Cloudinary Features

### Automatic Optimization

Images are automatically optimized:

- Max dimensions: 1920x1080
- Quality: Auto (good)
- Format: Auto (WebP for supported browsers)

### Video Transcoding

Videos are automatically processed:

- Max dimensions: 1280x720
- Quality: Auto
- Thumbnail: Generated automatically

### Folder Structure

```
cloudinary/
├── devlink/
│   ├── posts/
│   │   ├── images/
│   │   │   └── {timestamp}-{filename}
│   │   ├── videos/
│   │   │   └── {timestamp}-{filename}
│   │   └── files/
│   │       └── {timestamp}-{filename}
```

---

## Security

### Authentication

All upload endpoints require authentication via Bearer token.

### File Validation

- **Size Limit**: 50MB per file
- **Type Validation**: Only allowed MIME types accepted
- **Count Limit**: Max 10 files per upload request

### Rate Limiting

Upload endpoints are subject to the global rate limiter (100 requests per 15 minutes).

---

## UI Components

### Upload Button

```tsx
<Button
  type="button"
  onClick={() => fileInputRef.current?.click()}
  disabled={uploadedFiles.length >= 5 || isUploading}
  className="w-full h-24 rounded-xl border-2 border-dashed"
>
  {isUploading ? (
    <>
      <Loader2 className="animate-spin" />
      <Progress value={uploadProgress} />
    </>
  ) : (
    <>
      <Upload className="h-8 w-8" />
      <span>Click to upload</span>
    </>
  )}
</Button>
```

### File Previews

- **Images**: Full image preview with hover effects
- **Videos**: Video player with Film icon overlay
- **Files**: File icon with name and size
- **Remove Button**: Appears on hover

### Media Display (PostCard)

- **Responsive Grid**: 1-4 columns based on file count
- **Video Controls**: Native HTML5 video player
- **Click to Expand**: Images open in new tab
- **Lazy Loading**: Images load as they scroll into view
- **Error Handling**: Fallback placeholder for broken media

---

## Testing

### Test Upload Flow

```bash
# Start the server
cd server
npm run dev

# In another terminal, start the client
cd client
npm run dev
```

1. Log in to the application
2. Navigate to dashboard or feed
3. Click "Create a Post"
4. Select "Media" tab
5. Click upload button
6. Select images/videos
7. Watch upload progress
8. See previews
9. Add caption
10. Click "Create Post"
11. Verify media displays in feed

### Manual API Testing

```bash
# Upload a file
curl -X POST http://localhost:5000/api/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/image.jpg"
```

---

## Troubleshooting

### "Failed to upload file"

- Check Cloudinary credentials in `.env`
- Verify file size is under 50MB
- Confirm file type is supported

### "Access token required"

- Ensure user is logged in
- Check Bearer token in request headers

### Videos not playing

- Verify video format is supported
- Check browser console for errors
- Try a different video codec (H.264 recommended)

### Images not loading

- Check Cloudinary URL is accessible
- Verify CORS settings on Cloudinary
- Check network tab for 404 errors

---

## Performance Tips

1. **Compress files before uploading** - Smaller files upload faster
2. **Use modern formats** - WebP for images, MP4 for videos
3. **Limit concurrent uploads** - Upload files sequentially for stability
4. **Clear unused media** - Periodically clean up old Cloudinary assets
5. **Use Cloudinary transformations** - Serve optimized versions

---

## Future Enhancements

- [ ] Drag & drop file upload
- [ ] Image cropping before upload
- [ ] Video trimming
- [ ] File type icons
- [ ] Bulk upload
- [ ] Upload from URL
- [ ] Camera capture (mobile)
- [ ] Gallery lightbox view
- [ ] Image filters/effects
- [ ] Video thumbnails selection

---

## Cost Management

Cloudinary free tier includes:

- 25 GB storage
- 25 GB bandwidth/month
- 25,000 transformations/month

Monitor usage at: [Cloudinary Dashboard](https://cloudinary.com/console/media_library)

---

## Support

For Cloudinary documentation:

- [Cloudinary Docs](https://cloudinary.com/documentation)
- [Upload API](https://cloudinary.com/documentation/image_upload_api_reference)
- [Video Transformations](https://cloudinary.com/documentation/video_manipulation_and_delivery)

For DevLink issues:

- Check server logs for errors
- Verify environment variables
- Test API endpoints with Postman
- Review browser console for client errors

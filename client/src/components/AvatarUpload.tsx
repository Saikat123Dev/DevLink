'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { apiClient } from '@/lib/api-client';
import { Camera, Loader2, Trash2, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

interface AvatarUploadProps {
  currentAvatar?: string;
  userName: string;
  onAvatarUpdated?: (newAvatarUrl: string) => void;
}

export function AvatarUpload({ currentAvatar, userName, onAvatarUpdated }: AvatarUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('avatar', selectedFile);

      const response = await apiClient.post('/avatar/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 100)
          );
          setUploadProgress(percentCompleted);
        },
      });

      const newAvatarUrl = response.data.data.user.avatar;
      
      // Update local storage
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      userData.avatar = newAvatarUrl;
      localStorage.setItem('user', JSON.stringify(userData));

      toast.success('Avatar updated successfully!');
      onAvatarUpdated?.(newAvatarUrl);
      handleClose();
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload avatar');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setIsUploading(true);
      
      await apiClient.delete('/avatar');

      // Update local storage
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      userData.avatar = '';
      localStorage.setItem('user', JSON.stringify(userData));

      toast.success('Avatar removed successfully');
      onAvatarUpdated?.('');
      handleClose();
    } catch (error: any) {
      console.error('Avatar remove error:', error);
      toast.error(error.response?.data?.message || 'Failed to remove avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedFile(null);
    setPreviewUrl('');
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <div className="relative group">
        <Avatar className="h-32 w-32 ring-4 ring-border transition-all group-hover:ring-primary">
          <AvatarImage src={currentAvatar} alt={userName} />
          <AvatarFallback className="text-3xl bg-gradient-to-r from-blue-500 to-purple-500 text-white">
            {userName.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <Button
          size="sm"
          onClick={() => setIsOpen(true)}
          className="absolute bottom-0 right-0 rounded-full h-10 w-10 p-0 shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Camera className="h-5 w-5" />
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Profile Picture</DialogTitle>
            <DialogDescription>
              Upload a new photo or remove your current profile picture
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Preview */}
            <div className="flex justify-center">
              <Avatar className="h-48 w-48 ring-4 ring-border">
                <AvatarImage src={previewUrl || currentAvatar} alt={userName} />
                <AvatarFallback className="text-6xl bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                  {userName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Uploading...</span>
                  <span className="font-medium">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2">
              {!selectedFile ? (
                <>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Photo
                  </Button>
                  {currentAvatar && (
                    <Button
                      variant="outline"
                      onClick={handleRemoveAvatar}
                      disabled={isUploading}
                      className="w-full hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                    >
                      {isUploading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      Remove Current Photo
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Photo
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl('');
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </>
              )}
            </div>

            {/* Info */}
            <p className="text-xs text-center text-muted-foreground">
              Recommended: Square image, at least 400x400px, max 5MB
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

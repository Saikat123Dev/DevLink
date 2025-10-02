'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api-client';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Code,
    File as FileIcon,
    FileText,
    Film,
    ImageIcon,
    Loader2,
    Plus,
    Upload,
    X
} from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

interface PostCreatorProps {
  onPostCreated?: () => void;
}

interface UploadedFile {
  url: string;
  publicId: string;
  resourceType: 'image' | 'video' | 'raw';
  format: string;
  bytes: number;
  width?: number;
  height?: number;
  duration?: number;
  fileName?: string;
}

export function PostCreator({ onPostCreated }: PostCreatorProps) {
  const [activeTab, setActiveTab] = useState<'TEXT' | 'MEDIA' | 'CODE'>('TEXT');
  const [content, setContent] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [language, setLanguage] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    // Check if adding these files would exceed the limit
    if (uploadedFiles.length + fileArray.length > 5) {
      toast.error('Maximum 5 files allowed per post');
      return;
    }

    // Filter valid files
    const validFiles = fileArray.filter(file => {
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 50MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadPromises = validFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiClient.post('/upload', formData, {
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

        return {
          ...response.data.data,
          fileName: file.name,
        } as UploadedFile;
      });

      const results = await Promise.all(uploadPromises);
      setUploadedFiles([...uploadedFiles, ...results]);
      toast.success(`${results.length} file(s) uploaded successfully`);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload files');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    await processFiles(files);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if leaving the drop zone entirely
    if (e.currentTarget === dropZoneRef.current) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processFiles(files);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const files: File[] = [];

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) files.push(file);
      }
    }

    if (files.length > 0) {
      e.preventDefault();
      await processFiles(files);
      toast.success('Image pasted from clipboard');
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error('Content is required');
      return;
    }

    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (!token) {
      toast.error('Please log in to create a post');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const postData: any = {
        type: activeTab,
        content: content.trim(),
      };

      if (activeTab === 'CODE') {
        if (codeSnippet.trim()) {
          postData.codeSnippet = codeSnippet.trim();
        }
        if (language.trim()) {
          postData.language = language.trim();
        }
      }

      if (activeTab === 'MEDIA' && uploadedFiles.length > 0) {
        postData.mediaUrls = uploadedFiles.map(file => file.url);
      }

      await apiClient.post('/posts', postData);

      setContent('');
      setCodeSnippet('');
      setLanguage('');
      setUploadedFiles([]);
      setActiveTab('TEXT');

      toast.success('Post created successfully!');
      onPostCreated?.();
    } catch (error: any) {
      console.error('Failed to create post:', error);
      toast.error(error.response?.data?.message || 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = content.trim().length > 0;

  const renderFilePreview = (file: UploadedFile, index: number) => {
    const isImage = file.resourceType === 'image';
    const isVideo = file.resourceType === 'video';

    return (
      <motion.div
        key={index}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative group rounded-xl overflow-hidden border-2 border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-800 shadow-md"
      >
        {isImage && (
          <img
            src={file.url}
            alt={file.fileName || 'Upload'}
            className="w-full h-40 object-cover"
          />
        )}
        {isVideo && (
          <div className="relative w-full h-40 bg-gray-900 flex items-center justify-center">
            <video src={file.url} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <Film className="h-12 w-12 text-white" />
            </div>
          </div>
        )}
        {!isImage && !isVideo && (
          <div className="w-full h-40 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-950 dark:to-blue-950 flex flex-col items-center justify-center">
            <FileIcon className="h-12 w-12 text-purple-600 dark:text-purple-400 mb-2" />
            <span className="text-sm text-gray-600 dark:text-gray-400 px-2 text-center truncate max-w-full">
              {file.fileName || 'File'}
            </span>
          </div>
        )}
        <button
          onClick={() => handleRemoveFile(index)}
          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
          <p className="text-xs text-white truncate">{file.fileName || file.format}</p>
          <p className="text-xs text-gray-300">{(file.bytes / 1024 / 1024).toFixed(2)} MB</p>
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Card className="w-full border-0 shadow-xl bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-950/20 dark:to-purple-950/20 backdrop-blur-sm">
        <CardHeader className="pb-4 space-y-1">
          <CardTitle className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <FileText className="h-5 w-5 text-white" />
            </div>
            Create a Post
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400 pl-11">
            Share your thoughts, media, or code with the community
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as any)}>
            <TabsList className="grid w-full grid-cols-3 bg-gray-100/80 dark:bg-gray-800/80 p-1.5 rounded-xl shadow-inner backdrop-blur-sm">
              <TabsTrigger
                value="TEXT"
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg py-2.5 transition-all duration-300"
              >
                <FileText className="h-4 w-4" />
                <span className="font-medium">Text</span>
              </TabsTrigger>
              <TabsTrigger
                value="MEDIA"
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg py-2.5 transition-all duration-300"
              >
                <ImageIcon className="h-4 w-4" />
                <span className="font-medium">Media</span>
              </TabsTrigger>
              <TabsTrigger
                value="CODE"
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg py-2.5 transition-all duration-300"
              >
                <Code className="h-4 w-4" />
                <span className="font-medium">Code</span>
              </TabsTrigger>
            </TabsList>

            {/* TEXT TAB */}
            <TabsContent value="TEXT" className="space-y-4 pt-5">
              <div className="relative">
                <Label htmlFor="content" className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
                  <div className="h-1.5 w-1.5 bg-blue-500 rounded-full"></div>
                  What's on your mind?
                </Label>
                <Textarea
                  id="content"
                  placeholder="Share your thoughts, ideas, or questions with the community..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[140px] resize-none rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 transition-colors bg-white dark:bg-gray-800 shadow-sm"
                  maxLength={5000}
                />
                <div className="absolute bottom-3 right-3 text-xs font-medium text-gray-400 dark:text-gray-500 bg-white/80 dark:bg-gray-800/80 px-2 py-1 rounded-md backdrop-blur-sm">
                  {content.length}/5000
                </div>
              </div>
            </TabsContent>

            {/* MEDIA TAB */}
            <TabsContent value="MEDIA" className="space-y-4 pt-5">
              <div className="relative">
                <Label className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
                  <div className="h-1.5 w-1.5 bg-purple-500 rounded-full"></div>
                  Caption
                </Label>
                <Textarea
                  placeholder="Add a caption to your media..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[110px] resize-none rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-500 transition-colors bg-white dark:bg-gray-800 shadow-sm"
                  maxLength={5000}
                />
                <div className="absolute bottom-3 right-3 text-xs font-medium text-gray-400 dark:text-gray-500 bg-white/80 dark:bg-gray-800/80 px-2 py-1 rounded-md backdrop-blur-sm">
                  {content.length}/5000
                </div>
              </div>

              <div>
                <Label className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-3">
                  <div className="h-1.5 w-1.5 bg-purple-500 rounded-full"></div>
                  Upload Files ({uploadedFiles.length}/5)
                </Label>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <div
                  ref={dropZoneRef}
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onPaste={handlePaste}
                  className={`relative w-full h-32 rounded-xl border-2 border-dashed transition-all duration-300 ${
                    isDragging
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30 scale-105'
                      : 'border-purple-300 dark:border-purple-700 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/30'
                  } ${uploadedFiles.length >= 5 || isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  onClick={() => !isUploading && uploadedFiles.length < 5 && fileInputRef.current?.click()}
                >
                  {isUploading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                      <span className="text-sm font-medium text-purple-600">Uploading... {uploadProgress}%</span>
                      <Progress value={uploadProgress} className="w-32" />
                    </div>
                  ) : isDragging ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 animate-pulse">
                      <Upload className="h-12 w-12 text-purple-600" />
                      <span className="text-lg font-bold text-purple-600">Drop files here!</span>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <Upload className="h-8 w-8 text-purple-600" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Drag & drop, click, or paste images/videos
                      </span>
                      <span className="text-xs text-gray-500">Max 5 files, 50MB each</span>
                    </div>
                  )}
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                    <AnimatePresence>
                      {uploadedFiles.map((file, index) => renderFilePreview(file, index))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* CODE TAB */}
            <TabsContent value="CODE" className="space-y-4 pt-5">
              <div className="relative">
                <Label className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
                  <div className="h-1.5 w-1.5 bg-green-500 rounded-full"></div>
                  Description
                </Label>
                <Textarea
                  placeholder="Describe your code snippet..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[90px] resize-none rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:border-green-500 dark:focus:border-green-500 transition-colors bg-white dark:bg-gray-800 shadow-sm"
                  maxLength={5000}
                />
                <div className="absolute bottom-3 right-3 text-xs font-medium text-gray-400 dark:text-gray-500 bg-white/80 dark:bg-gray-800/80 px-2 py-1 rounded-md backdrop-blur-sm">
                  {content.length}/5000
                </div>
              </div>

              <div>
                <Label className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
                  <div className="h-1.5 w-1.5 bg-green-500 rounded-full"></div>
                  Programming Language
                </Label>
                <Input
                  placeholder="e.g., JavaScript, Python, TypeScript, Go..."
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  maxLength={50}
                  className="rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:border-green-500 dark:focus:border-green-500 transition-colors shadow-sm"
                />
              </div>

              <div className="relative">
                <Label className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
                  <div className="h-1.5 w-1.5 bg-green-500 rounded-full"></div>
                  Code Snippet
                </Label>
                <Textarea
                  placeholder="Paste your code here..."
                  value={codeSnippet}
                  onChange={(e) => setCodeSnippet(e.target.value)}
                  className="min-h-[220px] font-mono text-sm resize-none rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:border-green-500 dark:focus:border-green-500 transition-colors bg-gray-50 dark:bg-gray-900 shadow-inner"
                  maxLength={10000}
                />
                <div className="absolute bottom-3 right-3 text-xs font-medium text-gray-400 dark:text-gray-500 bg-white/90 dark:bg-gray-800/90 px-2 py-1 rounded-md backdrop-blur-sm">
                  {codeSnippet.length}/10000
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              {activeTab === 'TEXT' && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <FileText className="h-3.5 w-3.5 text-blue-600" />
                  <span className="font-medium">Text Post</span>
                </span>
              )}
              {activeTab === 'MEDIA' && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                  <ImageIcon className="h-3.5 w-3.5 text-purple-600" />
                  <span className="font-medium">{uploadedFiles.length} file(s)</span>
                </span>
              )}
              {activeTab === 'CODE' && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-950/30 rounded-lg">
                  <Code className="h-3.5 w-3.5 text-green-600" />
                  <span className="font-medium">Code Post</span>
                </span>
              )}
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid || isSubmitting || isUploading}
              className="min-w-[140px] rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Publishing...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Post
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

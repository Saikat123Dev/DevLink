'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api-client';
import { motion } from 'framer-motion';
import {
  Code,
  FileText,
  Image,
  Loader2,
  Plus,
  X
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface PostCreatorProps {
  onPostCreated?: () => void;
}

export function PostCreator({ onPostCreated }: PostCreatorProps) {
  const [activeTab, setActiveTab] = useState<'TEXT' | 'MEDIA' | 'CODE'>('TEXT');
  const [content, setContent] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [language, setLanguage] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddMediaUrl = () => {
    if (newMediaUrl.trim() && mediaUrls.length < 5) {
      setMediaUrls([...mediaUrls, newMediaUrl.trim()]);
      setNewMediaUrl('');
    }
  };

  const handleRemoveMediaUrl = (index: number) => {
    setMediaUrls(mediaUrls.filter((_, i) => i !== index));
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

      if (activeTab === 'MEDIA' && mediaUrls.length > 0) {
        postData.mediaUrls = mediaUrls;
      }

      await apiClient.post('/posts', postData);

      setContent('');
      setCodeSnippet('');
      setLanguage('');
      setMediaUrls([]);
      setNewMediaUrl('');
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
            Share your thoughts with the community
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
                <Image className="h-4 w-4" />
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
                <Label className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
                  <div className="h-1.5 w-1.5 bg-purple-500 rounded-full"></div>
                  Media URLs ({mediaUrls.length}/5)
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter image/video URL (https://...)"
                    value={newMediaUrl}
                    onChange={(e) => setNewMediaUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddMediaUrl()}
                    className="rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-500 transition-colors shadow-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddMediaUrl}
                    disabled={!newMediaUrl.trim() || mediaUrls.length >= 5}
                    className="rounded-xl border-2 hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:border-purple-500 transition-all"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {mediaUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4 p-4 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl border border-purple-200 dark:border-purple-800">
                    {mediaUrls.map((url, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Badge
                          variant="secondary"
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <Image className="h-3.5 w-3.5 text-purple-600" />
                          <span className="truncate max-w-[180px] text-xs font-medium">{url}</span>
                          <button
                            onClick={() => handleRemoveMediaUrl(index)}
                            className="ml-1 hover:text-red-600 transition-colors p-0.5 hover:bg-red-50 dark:hover:bg-red-950/30 rounded"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </Badge>
                      </motion.div>
                    ))}
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
                  <Image className="h-3.5 w-3.5 text-purple-600" />
                  <span className="font-medium">Media Post</span>
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
              disabled={!isFormValid || isSubmitting}
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

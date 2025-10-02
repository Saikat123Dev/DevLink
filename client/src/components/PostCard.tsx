'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api-client';
import { formatDistanceToNow } from 'date-fns';
import {
    Calendar,
    Check,
    Code,
    Edit,
    Heart,
    Loader2,
    MessageCircle,
    Share2,
    Trash2,
    User,
    X
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { CommentsList } from './CommentsList';

interface User {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: User;
  parentId?: string;
  replies: Comment[];
  isEdited?: boolean;
}

interface Post {
  id: string;
  type: 'TEXT' | 'MEDIA' | 'CODE';
  content: string;
  codeSnippet?: string;
  language?: string;
  mediaUrls?: string[];
  createdAt: string;
  updatedAt: string;
  isEdited?: boolean;
  author: User;
  comments: Comment[];
  isLiked: boolean;
  _count: {
    likes: number;
    comments: number;
  };
}

interface PostCardProps {
  post: Post;
  onPostUpdate?: () => void;
}

export function PostCard({ post, onPostUpdate }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post._count.likes);
  const [showComments, setShowComments] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editCodeSnippet, setEditCodeSnippet] = useState(post.codeSnippet || '');
  const [editLanguage, setEditLanguage] = useState(post.language || '');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Get current user from localStorage to check if they can edit
  const currentUser = typeof window !== 'undefined' ? 
    JSON.parse(localStorage.getItem('user') || '{}') : {};
  const canEdit = currentUser.id === post.author.id;

  const handleLike = async () => {
    if (isLiking) return;
    
    setIsLiking(true);
    const previousState = { isLiked, likesCount };
    
    // Optimistic update
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);

    try {
      await apiClient.post(`/posts/${post.id}/like`);
    } catch (error: any) {
      // Revert optimistic update on error
      setIsLiked(previousState.isLiked);
      setLikesCount(previousState.likesCount);
      console.error('Failed to like post:', error);
      toast.error('Failed to like post');
    } finally {
      setIsLiking(false);
    }
  };

  const handleEditPost = async () => {
    if (!editContent.trim() || isSubmittingEdit) return;

    setIsSubmittingEdit(true);
    try {
      const updateData: any = {
        content: editContent.trim()
      };

      if (post.type === 'CODE') {
        if (editCodeSnippet.trim()) {
          updateData.codeSnippet = editCodeSnippet.trim();
        }
        if (editLanguage.trim()) {
          updateData.language = editLanguage.trim();
        }
      }

      await apiClient.put(`/posts/${post.id}`, updateData);
      
      setIsEditing(false);
      toast.success('Post updated successfully');
      onPostUpdate?.();
    } catch (error: any) {
      console.error('Failed to update post:', error);
      toast.error(error.response?.data?.message || 'Failed to update post');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(post.content);
    setEditCodeSnippet(post.codeSnippet || '');
    setEditLanguage(post.language || '');
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      await apiClient.delete(`/posts/${post.id}`);
      toast.success('Post deleted successfully');
      onPostUpdate?.();
    } catch (error: any) {
      console.error('Failed to delete post:', error);
      toast.error(error.response?.data?.message || 'Failed to delete post');
    }
  };

  const renderContent = () => {
    if (isEditing && canEdit) {
      return (
        <div className="space-y-4">
          <div>
            <Textarea
              value={editContent}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditContent(e.target.value)}
              className="min-h-[100px] resize-none"
              placeholder="Edit your post content..."
              maxLength={5000}
            />
            <div className="text-sm text-muted-foreground text-right mt-1">
              {editContent.length}/5000
            </div>
          </div>
          
          {post.type === 'CODE' && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Programming Language</label>
                <Input
                  value={editLanguage}
                  onChange={(e) => setEditLanguage(e.target.value)}
                  className="mt-1"
                  placeholder="e.g., JavaScript, Python, TypeScript"
                  maxLength={50}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Code Snippet</label>
                <Textarea
                  value={editCodeSnippet}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditCodeSnippet(e.target.value)}
                  className="min-h-[200px] font-mono text-sm resize-none mt-1"
                  placeholder="Edit your code snippet..."
                  maxLength={10000}
                />
                <div className="text-sm text-muted-foreground text-right mt-1">
                  {editCodeSnippet.length}/10000
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleCancelEdit}
              disabled={isSubmittingEdit}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button 
              size="sm"
              onClick={handleEditPost}
              disabled={!editContent.trim() || isSubmittingEdit}
            >
              {isSubmittingEdit ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Check className="h-4 w-4 mr-1" />
              )}
              Save
            </Button>
          </div>
        </div>
      );
    }

    switch (post.type) {
      case 'CODE':
        return (
          <div className="space-y-3">
            <p className="text-sm leading-relaxed">{post.content}</p>
            {post.codeSnippet && (
              <div className="bg-muted rounded-lg p-4 overflow-x-auto">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    {post.language && (
                      <Badge variant="secondary" className="text-xs">
                        {post.language}
                      </Badge>
                    )}
                  </div>
                </div>
                <pre className="text-sm font-mono whitespace-pre-wrap">
                  <code>{post.codeSnippet}</code>
                </pre>
              </div>
            )}
          </div>
        );
      
      case 'MEDIA':
        return (
          <div className="space-y-3">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
            {post.mediaUrls && post.mediaUrls.length > 0 && (
              <div className={`grid gap-2 ${
                post.mediaUrls.length === 1 ? 'grid-cols-1' : 
                post.mediaUrls.length === 2 ? 'grid-cols-2' : 
                post.mediaUrls.length === 3 ? 'grid-cols-2 md:grid-cols-3' : 
                'grid-cols-2 md:grid-cols-2'
              }`}>
                {post.mediaUrls.map((url, index) => {
                  // Cloudinary videos and common video formats
                  const isVideo = url.includes('/video/') || 
                                  url.includes('.mp4') || 
                                  url.includes('.webm') || 
                                  url.includes('.mov') ||
                                  url.includes('.avi');
                  
                  if (isVideo) {
                    return (
                      <div key={index} className="relative rounded-xl overflow-hidden bg-gray-900">
                        <video
                          controls
                          className="w-full h-auto max-h-96 object-contain"
                          preload="metadata"
                          onError={(e) => {
                            console.error('Video failed to load:', url);
                            e.currentTarget.style.display = 'none';
                          }}
                        >
                          <source src={url} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    );
                  }
                  
                  return (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Media ${index + 1}`}
                        className="rounded-xl w-full h-auto max-h-96 object-cover cursor-pointer hover:opacity-95 transition-all shadow-md hover:shadow-xl"
                        loading="lazy"
                        onError={(e) => {
                          console.error('Image failed to load:', url);
                          const target = e.currentTarget;
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzljYTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD4KPC9zdmc+';
                          target.classList.add('opacity-50');
                        }}
                        onClick={() => window.open(url, '_blank')}
                      />
                      {/* Hover overlay for opening in new tab */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-xl pointer-events-none" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      
      default:
        return <p className="text-sm leading-relaxed">{post.content}</p>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.author.avatar} />
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-semibold text-sm">{post.author.name}</h4>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {post.author.role && (
                  <Badge variant="outline" className="text-xs">
                    {post.author.role}
                  </Badge>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                  {post.isEdited && (
                    <span className="text-xs text-muted-foreground ml-1">(edited)</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          {canEdit && (
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                disabled={isSubmittingEdit}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleDeletePost}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {renderContent()}
        
        {/* Action buttons */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={isLiking}
              className={`flex items-center gap-2 ${isLiked ? 'text-red-500' : ''}`}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              {likesCount}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              {post._count.comments}
            </Button>
            
            <Button variant="ghost" size="sm">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Comments section */}
        {showComments && (
          <div className="border-t pt-4">
            <CommentsList 
              postId={post.id} 
              initialComments={post.comments}
              onCommentsUpdate={onPostUpdate}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

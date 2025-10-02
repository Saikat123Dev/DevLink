'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api-client';
import {
    Loader2,
    MessageCircle,
    RefreshCw,
    User
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CommentItem } from './CommentItem';

interface User {
  id: string;
  name: string;
  avatar?: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isEdited?: boolean;
  user: User;
  replies: Comment[];
}

interface CommentsListProps {
  postId: string;
  initialComments?: Comment[];
  onCommentsUpdate?: () => void;
}

export function CommentsList({ postId, initialComments = [], onCommentsUpdate }: CommentsListProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Get current user
  const currentUser = typeof window !== 'undefined' ? 
    JSON.parse(localStorage.getItem('user') || '{}') : {};

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get(`/posts/${postId}/comments`);
      
      if (response.data.success) {
        setComments(response.data.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || isSubmitting) return;

    // Check authentication
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (!token) {
      toast.error('Please log in to comment');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.post(`/posts/${postId}/comments`, {
        content: newComment.trim()
      });

      if (response.data.success) {
        setNewComment('');
        toast.success('Comment added successfully');
        fetchComments(); // Refresh comments
        onCommentsUpdate?.();
      }
    } catch (error: any) {
      console.error('Failed to add comment:', error);
      toast.error(error.response?.data?.message || 'Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommentUpdate = () => {
    fetchComments();
    onCommentsUpdate?.();
  };

  useEffect(() => {
    if (initialComments.length === 0) {
      fetchComments();
    } else {
      setComments(initialComments);
    }
  }, [postId, initialComments]);

  if (isLoading && comments.length === 0) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <span className="text-sm text-muted-foreground">Loading comments...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Comments Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          <span className="font-medium text-sm">
            {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
          </span>
        </div>
        
        {comments.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchComments}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </div>

      {/* Add New Comment */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={currentUser.avatar} />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewComment(e.target.value)}
              className="min-h-[80px] resize-none"
              maxLength={1000}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddComment();
                }
              }}
            />
            
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {newComment.length}/1000
              </div>
              
              <Button
                onClick={handleAddComment}
                disabled={!newComment.trim() || isSubmitting}
                size="sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Posting...
                  </>
                ) : (
                  'Post Comment'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Comments List */}
      {comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              onCommentUpdate={handleCommentUpdate}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No comments yet. Be the first to comment!</p>
        </div>
      )}
    </div>
  );
}

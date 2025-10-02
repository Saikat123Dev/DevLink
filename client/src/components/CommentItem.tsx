'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api-client';
import { formatDistanceToNow } from 'date-fns';
import {
    Calendar,
    Check,
    Edit,
    Loader2,
    MessageCircle,
    Reply,
    Trash2,
    User,
    X
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

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

interface CommentItemProps {
  comment: Comment;
  postId: string;
  depth?: number;
  onCommentUpdate?: () => void;
}

export function CommentItem({ comment, postId, depth = 0, onCommentUpdate }: CommentItemProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [editContent, setEditContent] = useState(comment.content);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [showReplies, setShowReplies] = useState(true);

  // Get current user to check permissions
  const currentUser = typeof window !== 'undefined' ? 
    JSON.parse(localStorage.getItem('user') || '{}') : {};
  const canEdit = currentUser.id === comment.user.id;

  const maxDepth = 3; // Maximum nesting depth
  const canReply = depth < maxDepth;

  const handleReply = async () => {
    if (!replyContent.trim() || isSubmittingReply) return;

    setIsSubmittingReply(true);
    try {
      await apiClient.post(`/posts/${postId}/comments`, {
        content: replyContent.trim(),
        parentId: comment.id
      });

      setReplyContent('');
      setIsReplying(false);
      toast.success('Reply added successfully');
      onCommentUpdate?.();
    } catch (error: any) {
      console.error('Failed to add reply:', error);
      toast.error(error.response?.data?.message || 'Failed to add reply');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleEdit = async () => {
    if (!editContent.trim() || isSubmittingEdit) return;

    setIsSubmittingEdit(true);
    try {
      await apiClient.put(`/posts/comments/${comment.id}`, {
        content: editContent.trim()
      });

      setIsEditing(false);
      toast.success('Comment updated successfully');
      onCommentUpdate?.();
    } catch (error: any) {
      console.error('Failed to update comment:', error);
      toast.error(error.response?.data?.message || 'Failed to update comment');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      await apiClient.delete(`/posts/comments/${comment.id}`);
      toast.success('Comment deleted successfully');
      onCommentUpdate?.();
    } catch (error: any) {
      console.error('Failed to delete comment:', error);
      toast.error(error.response?.data?.message || 'Failed to delete comment');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(comment.content);
  };

  const handleCancelReply = () => {
    setIsReplying(false);
    setReplyContent('');
  };

  return (
    <div className={`flex gap-3 ${depth > 0 ? 'ml-6 border-l border-muted pl-4' : ''}`}>
      <Avatar className="h-6 w-6 flex-shrink-0">
        <AvatarImage src={comment.user.avatar} />
        <AvatarFallback>
          <User className="h-3 w-3" />
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 space-y-2">
        {/* Comment Header */}
        <div className="flex items-center gap-2 text-xs">
          <span className="font-medium">{comment.user.name}</span>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            {comment.isEdited && (
              <span className="text-xs">(edited)</span>
            )}
          </div>
        </div>

        {/* Comment Content */}
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editContent}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditContent(e.target.value)}
              className="min-h-[60px] resize-none text-sm"
              placeholder="Edit your comment..."
              maxLength={1000}
            />
            <div className="text-xs text-muted-foreground text-right">
              {editContent.length}/1000
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelEdit}
                disabled={isSubmittingEdit}
              >
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleEdit}
                disabled={!editContent.trim() || isSubmittingEdit}
              >
                {isSubmittingEdit ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Check className="h-3 w-3 mr-1" />
                )}
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-muted rounded-lg p-3">
            <p className="text-sm">{comment.content}</p>
          </div>
        )}

        {/* Comment Actions */}
        {!isEditing && (
          <div className="flex items-center gap-2">
            {canReply && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsReplying(!isReplying)}
                className="h-6 px-2 text-xs"
              >
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </Button>
            )}
            
            {canEdit && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="h-6 px-2 text-xs"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="h-6 px-2 text-xs text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </>
            )}
            
            {(comment.replies?.length || 0) > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplies(!showReplies)}
                className="h-6 px-2 text-xs"
              >
                <MessageCircle className="h-3 w-3 mr-1" />
                {showReplies ? 'Hide' : 'Show'} {comment.replies?.length || 0} {(comment.replies?.length || 0) === 1 ? 'reply' : 'replies'}
              </Button>
            )}
          </div>
        )}

        {/* Reply Input */}
        {isReplying && (
          <div className="space-y-2 pt-2">
            <Textarea
              value={replyContent}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReplyContent(e.target.value)}
              className="min-h-[60px] resize-none text-sm"
              placeholder="Write a reply..."
              maxLength={1000}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleReply();
                }
              }}
            />
            <div className="text-xs text-muted-foreground text-right">
              {replyContent.length}/1000
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelReply}
                disabled={isSubmittingReply}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleReply}
                disabled={!replyContent.trim() || isSubmittingReply}
              >
                {isSubmittingReply ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  'Reply'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Nested Replies */}
        {showReplies && depth < maxDepth && comment.replies && comment.replies.length > 0 && (
          <div className="space-y-3 pt-2">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                postId={postId}
                depth={depth + 1}
                onCommentUpdate={onCommentUpdate}
              />
            ))}
          </div>
        )}

        {/* Depth limit notice */}
        {depth >= maxDepth && (comment.replies?.length || 0) > 0 && (
          <div className="text-xs text-muted-foreground italic pt-2">
            Maximum reply depth reached. Continue this conversation in a new thread.
          </div>
        )}
      </div>
    </div>
  );
}

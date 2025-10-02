'use client';

import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';
import { Loader2, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PostCard } from './PostCard';

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
  user: User;
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

interface PostFeedProps {
  refreshTrigger?: number;
}

export function PostFeed({ refreshTrigger }: PostFeedProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPosts = async (pageNum = 1, isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await apiClient.get(`/posts?page=${pageNum}&limit=10`);
      
      if (response.data.success) {
        const newPosts = response.data.data;
        const pagination = response.data.pagination;

        if (pageNum === 1 || isRefresh) {
          setPosts(newPosts);
        } else {
          setPosts(prev => [...prev, ...newPosts]);
        }

        setHasNextPage(pagination.hasNextPage);
        setPage(pageNum);
      }
    } catch (error: any) {
      console.error('Failed to fetch posts:', error);
      toast.error(error.response?.data?.message || 'Failed to load posts');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchPosts(1, true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasNextPage) {
      fetchPosts(page + 1);
    }
  };

  const handlePostUpdate = () => {
    // Refresh the current page to get updated data
    fetchPosts(1, true);
  };

  useEffect(() => {
    fetchPosts(1);
  }, []);

  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchPosts(1, true);
    }
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading posts...</span>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">No posts yet. Be the first to share something!</p>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Refresh button */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Recent Posts</h2>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Posts list */}
      <div className="space-y-6">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onPostUpdate={handlePostUpdate}
          />
        ))}
      </div>

      {/* Load more button */}
      {hasNextPage && (
        <div className="flex justify-center pt-4">
          <Button
            onClick={handleLoadMore}
            variant="outline"
            disabled={loadingMore}
          >
            {loadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading more...
              </>
            ) : (
              'Load More Posts'
            )}
          </Button>
        </div>
      )}

      {!hasNextPage && posts.length > 0 && (
        <div className="text-center pt-4">
          <p className="text-sm text-muted-foreground">
            You've reached the end of the feed
          </p>
        </div>
      )}
    </div>
  );
}

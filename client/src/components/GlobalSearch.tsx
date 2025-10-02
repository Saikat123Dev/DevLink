'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import { apiClient } from '@/lib/api-client';
import { Code, FileText, Loader2, Search, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface SearchResult {
  users: Array<{
    id: string;
    name: string;
    avatar?: string;
    role?: string;
    skills: Array<{ name: string; level: string }>;
  }>;
  posts: Array<{
    id: string;
    content: string;
    type: string;
    author: {
      id: string;
      name: string;
      avatar?: string;
    };
  }>;
  projects: Array<{
    id: string;
    name: string;
    description?: string;
    owner: {
      id: string;
      name: string;
      avatar?: string;
    };
  }>;
}

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery.trim()) {
      performSearch(debouncedQuery);
    } else {
      setResults(null);
    }
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const performSearch = async (searchQuery: string) => {
    try {
      setIsLoading(true);
      const response = await apiClient.get(`/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.data.success) {
        setResults(response.data.data);
        setIsOpen(true);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResultClick = (type: string, id: string) => {
    setIsOpen(false);
    setQuery('');
    
    switch (type) {
      case 'user':
        router.push(`/profile/${id}`);
        break;
      case 'post':
        router.push(`/dashboard`); // Could implement post-specific navigation
        break;
      case 'project':
        router.push(`/projects/${id}`);
        break;
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-lg">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users, posts, projects..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && results && setIsOpen(true)}
          className="pl-9 pr-10"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {isOpen && results && (
        <Card className="absolute top-full mt-2 w-full z-50 max-h-96 overflow-y-auto">
          <CardContent className="p-0">
            {/* Users */}
            {results.users.length > 0 && (
              <div className="p-2">
                <h3 className="text-sm font-medium text-muted-foreground mb-2 px-2">Users</h3>
                {results.users.slice(0, 3).map((user) => (
                  <div
                    key={user.id}
                    onClick={() => handleResultClick('user', user.id)}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      {user.role && (
                        <p className="text-xs text-muted-foreground truncate">{user.role}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {user.skills.slice(0, 2).map((skill, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {skill.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Projects */}
            {results.projects.length > 0 && (
              <div className="p-2 border-t">
                <h3 className="text-sm font-medium text-muted-foreground mb-2 px-2">Projects</h3>
                {results.projects.slice(0, 3).map((project) => (
                  <div
                    key={project.id}
                    onClick={() => handleResultClick('project', project.id)}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                  >
                    <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Code className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{project.name}</p>
                      {project.description && (
                        <p className="text-xs text-muted-foreground truncate">{project.description}</p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">by {project.owner.name}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Posts */}
            {results.posts.length > 0 && (
              <div className="p-2 border-t">
                <h3 className="text-sm font-medium text-muted-foreground mb-2 px-2">Posts</h3>
                {results.posts.slice(0, 2).map((post) => (
                  <div
                    key={post.id}
                    onClick={() => handleResultClick('post', post.id)}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                  >
                    <div className="h-8 w-8 bg-secondary/50 rounded-lg flex items-center justify-center">
                      <FileText className="h-4 w-4 text-secondary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm line-clamp-2">{post.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">by {post.author.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {results.users.length === 0 && results.posts.length === 0 && results.projects.length === 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No results found for "{query}"
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

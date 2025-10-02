'use client';

import { DashboardNav } from '@/components/DashboardNav';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient } from '@/lib/api-client';
import { Github, Linkedin, Loader2, MapPin, Search, User, UserPlus, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Skill {
  name: string;
  level: 'PRIMARY' | 'SECONDARY';
}

interface Developer {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
  bio?: string;
  location?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  skills: Skill[];
  connectionsCount: number;
  _count: {
    posts: number;
  };
}

export default function DiscoverPage() {
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [sendingRequests, setSendingRequests] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const router = useRouter();
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem("authToken");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setIsAuthLoading(false);
      fetchDevelopers();
    } catch (error) {
      console.error("Error parsing user data:", error);
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchDevelopers();
    }
  }, [user]);

  const fetchDevelopers = async (reset = false) => {
    try {
      setLoading(reset);
      
      const params = new URLSearchParams({
        page: reset ? '1' : page.toString(),
        limit: '12'
      });

      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (selectedRole) params.append('role', selectedRole);
      if (selectedLocation.trim()) params.append('location', selectedLocation.trim());

      const response = await apiClient.get(`/connections/discover?${params}`);
      
      if (response.data.success) {
        const newDevelopers = response.data.data.users;
        setDevelopers(prev => reset ? newDevelopers : [...prev, ...newDevelopers]);
        setHasMore(response.data.data.pagination.hasNext);
        
        if (reset) {
          setPage(2);
        } else {
          setPage(prev => prev + 1);
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch developers:', error);
      toast.error('Failed to load developers');
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  const handleSearch = () => {
    setSearching(true);
    setPage(1);
    fetchDevelopers(true);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedRole('');
    setSelectedLocation('');
    setPage(1);
    fetchDevelopers(true);
  };

  const handleSendConnectionRequest = async (developerId: string) => {
    try {
      setSendingRequests(prev => new Set(prev).add(developerId));
      
      await apiClient.post('/connections/request', {
        receiverId: developerId
      });

      toast.success('Connection request sent successfully');
      
      // Remove the developer from the list
      setDevelopers(prev => prev.filter(dev => dev.id !== developerId));
      
    } catch (error: any) {
      console.error('Failed to send connection request:', error);
      toast.error(error.response?.data?.message || 'Failed to send connection request');
    } finally {
      setSendingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(developerId);
        return newSet;
      });
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchDevelopers();
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (loading && developers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <DashboardNav user={user} />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Discover Developers</h1>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-muted rounded-full"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-muted rounded w-24"></div>
                          <div className="h-3 bg-muted rounded w-16"></div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="h-12 bg-muted rounded"></div>
                        <div className="flex gap-2">
                          <div className="h-6 bg-muted rounded w-16"></div>
                          <div className="h-6 bg-muted rounded w-16"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardNav user={user} />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Discover Developers</h1>
          <p className="text-muted-foreground">
            Connect with talented developers from around the world
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search developers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            
            <Select value={selectedRole || "all"} onValueChange={(value) => setSelectedRole(value === "all" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="Frontend Developer">Frontend Developer</SelectItem>
                <SelectItem value="Backend Developer">Backend Developer</SelectItem>
                <SelectItem value="Full Stack Developer">Full Stack Developer</SelectItem>
                <SelectItem value="Mobile Developer">Mobile Developer</SelectItem>
                <SelectItem value="DevOps Engineer">DevOps Engineer</SelectItem>
                <SelectItem value="Data Scientist">Data Scientist</SelectItem>
                <SelectItem value="UI/UX Designer">UI/UX Designer</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Location"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />

            <div className="flex gap-2">
              <Button 
                onClick={handleSearch} 
                disabled={searching}
                className="flex-1"
              >
                {searching ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Search
              </Button>
              <Button variant="outline" onClick={handleClearFilters}>
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {developers.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
              <Users className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Developers Found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search criteria to find more developers
            </p>
            <Button onClick={handleClearFilters}>
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {developers.map((developer) => (
              <Card key={developer.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={developer.avatar} />
                      <AvatarFallback>
                        <User className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold">{developer.name}</h3>
                      {developer.role && (
                        <p className="text-sm text-muted-foreground">{developer.role}</p>
                      )}
                      {developer.location && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {developer.location}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {developer.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {developer.bio}
                    </p>
                  )}
                  
                  {developer.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {developer.skills.slice(0, 3).map((skill, index) => (
                        <Badge 
                          key={index} 
                          variant={skill.level === 'PRIMARY' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {skill.name}
                        </Badge>
                      ))}
                      {developer.skills.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{developer.skills.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{developer.connectionsCount} connections</span>
                    <span>{developer._count.posts} posts</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {developer.githubUrl && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={developer.githubUrl} target="_blank" rel="noopener noreferrer">
                          <Github className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {developer.linkedinUrl && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={developer.linkedinUrl} target="_blank" rel="noopener noreferrer">
                          <Linkedin className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>

                  <Button 
                    onClick={() => handleSendConnectionRequest(developer.id)}
                    disabled={sendingRequests.has(developer.id)}
                    className="w-full"
                  >
                    {sendingRequests.has(developer.id) ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Connect
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {hasMore && (
            <div className="text-center">
              <Button onClick={loadMore} disabled={loading} variant="outline">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </Button>
            </div>
          )}
        </>
      )}
          </div>
        </div>
      </main>
    </div>
  );
}

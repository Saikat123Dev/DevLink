'use client';

import { DashboardNav } from '@/components/DashboardNav';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import {
    Briefcase,
    ChevronDown,
    Github,
    Heart,
    MapPin,
    MessageSquare,
    Search,
    SlidersHorizontal,
    Star,
    Users,
    X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface SearchFilters {
  query: string;
  type: 'all' | 'developers' | 'projects' | 'posts';
  location: string;
  skills: string[];
  experience: string;
  rating: number[];
  availability: string;
  projectType: string;
  sortBy: string;
}

interface Developer {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  role: string;
  location?: string;
  skills: Array<{ name: string; level?: string }> | string[];
  rating: number;
  experience: string;
  bio?: string;
  isOnline?: boolean;
  isAvailable: boolean;
  hourlyRate?: number;
  completedProjects: number;
  joinedAt?: string;
  projectsCount?: number;
}

interface Project {
  id: string;
  name: string;
  description: string;
  owner: {
    id: string;
    name: string;
    avatar?: string;
    rating?: number;
  };
  technologies?: string[];
  status: 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
  teamSize?: number;
  membersCount?: number;
  tasksCount?: number;
  budget?: string;
  duration?: string;
  createdAt: string;
  githubUrl?: string;
  isRemote: boolean;
}

interface Post {
  id: string;
  type: 'TEXT' | 'CODE' | 'MEDIA' | 'text' | 'code' | 'media';
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
  };
  tags?: string[];
  likes?: number;
  likesCount?: number;
  comments?: number;
  commentsCount?: number;
  createdAt: string;
  language?: string;
  codeSnippet?: string;
  mediaUrls?: string[];
}

export default function AdvancedSearchPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    type: 'all',
    location: '',
    skills: [],
    experience: 'any',
    rating: [0],
    availability: '',
    projectType: '',
    sortBy: 'relevance'
  });

  const [results, setResults] = useState({
    developers: [] as Developer[],
    projects: [] as Project[],
    posts: [] as Post[]
  });

  const [availableSkills, setAvailableSkills] = useState<string[]>([]);
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);

  // Load filter options from API
  const loadFilterOptions = async () => {
    try {
      const response = await apiClient.search.getFilters();
      if (response.data.success) {
        const filterData = response.data.data;
        setAvailableSkills(filterData.skills || []);
        setAvailableLocations(filterData.locations || []);
      }
    } catch (error) {
      console.error('Failed to load filter options:', error);
      // Fallback to default skills
      setAvailableSkills([
        'JavaScript', 'TypeScript', 'React', 'Next.js', 'Vue.js', 'Angular',
        'Node.js', 'Express', 'Python', 'Django', 'Flask', 'Java', 'Spring',
        'C#', '.NET', 'PHP', 'Laravel', 'Ruby', 'Rails', 'Go', 'Rust',
        'Swift', 'Kotlin', 'Flutter', 'React Native', 'iOS', 'Android',
        'HTML', 'CSS', 'SASS', 'TailwindCSS', 'Bootstrap', 'Material-UI',
        'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes',
        'AWS', 'Azure', 'GCP', 'Git', 'CI/CD', 'DevOps', 'UI/UX', 'Figma'
      ]);
    }
  };

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
      loadFilterOptions();
      performSearch();
    } catch (error) {
      console.error("Error parsing user data:", error);
      router.push("/login");
    }
  }, [router]);

  // Debounced search when filters change
  useEffect(() => {
    if (!isAuthLoading && user) {
      const debounceTimer = setTimeout(() => {
        performSearch();
      }, 300);

      return () => clearTimeout(debounceTimer);
    }
  }, [filters, isAuthLoading, user]);

  const performSearch = async () => {
    setLoading(true);
    
    try {
      // Build search parameters
      const searchParams: any = {
        q: filters.query,
        type: filters.type,
      };

      // Add filters only if they have values
      if (filters.skills.length > 0) {
        searchParams.skills = filters.skills;
      }
      
      if (filters.location) {
        searchParams.location = filters.location;
      }

      if (filters.experience && filters.experience !== 'any') {
        searchParams.experience = filters.experience;
      }

      if (filters.rating && filters.rating[0] > 0) {
        searchParams.rating = filters.rating;
      }

      if (filters.availability !== '') {
        searchParams.availability = filters.availability === 'available';
      }

      if (filters.projectType) {
        searchParams.projectType = filters.projectType;
      }

      if (filters.sortBy) {
        searchParams.sortBy = filters.sortBy;
      }

      // Perform the search
      const response = await apiClient.search.search(searchParams);
      
      if (response.data.success) {
        const searchResults = response.data.data;
        setResults({
          developers: searchResults.developers || [],
          projects: searchResults.projects || [],
          posts: searchResults.posts || []
        });
        
        // Save search query for analytics
        const totalResults = (searchResults.developers?.length || 0) + 
                           (searchResults.projects?.length || 0) + 
                           (searchResults.posts?.length || 0);
        
        apiClient.search.saveSearchQuery({
          query: filters.query,
          type: filters.type,
          resultsCount: totalResults
        }).catch(console.error); // Don't block on analytics
      }
    } catch (error) {
      console.error('Search failed:', error);
      setResults({
        developers: [],
        projects: [],
        posts: []
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleSkill = (skill: string) => {
    setFilters(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      type: 'all',
      location: '',
      skills: [],
      experience: 'any',
      rating: [0],
      availability: '',
      projectType: '',
      sortBy: 'relevance'
    });
  };

  const getResultCount = () => {
    const { developers, projects, posts } = results;
    if (filters.type === 'developers') return developers.length;
    if (filters.type === 'projects') return projects.length;
    if (filters.type === 'posts') return posts.length;
    return developers.length + projects.length + posts.length;
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardNav user={user} />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Search Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-4">Advanced Search</h1>
            
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search developers, projects, posts..."
                  value={filters.query}
                  onChange={(e) => updateFilter('query', e.target.value)}
                  className="pl-12 h-12 text-lg"
                />
              </div>
              
              <Button 
                variant="outline" 
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 h-12"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {showFilters ? <ChevronDown className="h-4 w-4 rotate-180" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              
              <Button onClick={performSearch} className="h-12 px-8">
                Search
              </Button>
            </div>

            {/* Active Filters */}
            {(filters.skills.length > 0 || filters.location || (filters.experience && filters.experience !== 'any')) && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-sm text-gray-500">Active filters:</span>
                
                {filters.skills.map(skill => (
                  <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                    {skill}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => toggleSkill(skill)}
                    />
                  </Badge>
                ))}
                
                {filters.location && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {filters.location}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => updateFilter('location', '')}
                    />
                  </Badge>
                )}
                
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear all
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Filters Sidebar */}
            <div className={cn(
              "lg:col-span-1 space-y-6",
              showFilters ? "block" : "hidden lg:block"
            )}>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Filters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* Search Type */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Search Type</label>
                    <Select value={filters.type} onValueChange={(value) => updateFilter('type', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Results</SelectItem>
                        <SelectItem value="developers">Developers</SelectItem>
                        <SelectItem value="projects">Projects</SelectItem>
                        <SelectItem value="posts">Posts</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Location</label>
                    <Input
                      placeholder="Enter location..."
                      value={filters.location}
                      onChange={(e) => updateFilter('location', e.target.value)}
                    />
                  </div>

                  {/* Skills */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Skills ({filters.skills.length} selected)
                    </label>
                    <ScrollArea className="h-48 border rounded p-3">
                      <div className="space-y-2">
                        {availableSkills.map(skill => (
                          <div key={skill} className="flex items-center space-x-2">
                            <Checkbox
                              id={skill}
                              checked={filters.skills.includes(skill)}
                              onCheckedChange={() => toggleSkill(skill)}
                            />
                            <label htmlFor={skill} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              {skill}
                            </label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Experience Level */}
                  {filters.type === 'all' || filters.type === 'developers' ? (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Experience Level</label>
                      <Select value={filters.experience} onValueChange={(value) => updateFilter('experience', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Any experience" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any experience</SelectItem>
                          <SelectItem value="entry">Entry Level (0-2 years)</SelectItem>
                          <SelectItem value="mid">Mid Level (3-5 years)</SelectItem>
                          <SelectItem value="senior">Senior Level (5+ years)</SelectItem>
                          <SelectItem value="lead">Lead/Principal (8+ years)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}

                  {/* Rating */}
                  {filters.type === 'all' || filters.type === 'developers' ? (
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Minimum Rating: {filters.rating[0].toFixed(1)}★
                      </label>
                      <Slider
                        value={filters.rating}
                        onValueChange={(value) => updateFilter('rating', value)}
                        max={5}
                        min={0}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>
                  ) : null}

                  {/* Sort By */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Sort By</label>
                    <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">Relevance</SelectItem>
                        <SelectItem value="rating">Highest Rated</SelectItem>
                        <SelectItem value="recent">Most Recent</SelectItem>
                        <SelectItem value="popular">Most Popular</SelectItem>
                        <SelectItem value="alphabetical">Alphabetical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                </CardContent>
              </Card>
            </div>

            {/* Results */}
            <div className="lg:col-span-3">
              
              {/* Results Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold">Search Results</h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {loading ? 'Searching...' : `${getResultCount()} results found`}
                  </p>
                </div>
              </div>

              {/* Results Tabs */}
              <Tabs value={filters.type} onValueChange={(value) => updateFilter('type', value)}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">
                    All ({results.developers.length + results.projects.length + results.posts.length})
                  </TabsTrigger>
                  <TabsTrigger value="developers">
                    Developers ({results.developers.length})
                  </TabsTrigger>
                  <TabsTrigger value="projects">
                    Projects ({results.projects.length})
                  </TabsTrigger>
                  <TabsTrigger value="posts">
                    Posts ({results.posts.length})
                  </TabsTrigger>
                </TabsList>

                {/* All Results */}
                <TabsContent value="all" className="space-y-6 mt-6">
                  {results.developers.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Developers
                      </h3>
                      <div className="grid gap-4">
                        {results.developers.slice(0, 3).map(developer => (
                          <DeveloperCard key={developer.id} developer={developer} />
                        ))}
                      </div>
                    </div>
                  )}

                  {results.projects.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Briefcase className="h-5 w-5" />
                        Projects
                      </h3>
                      <div className="grid gap-4">
                        {results.projects.slice(0, 3).map(project => (
                          <ProjectCard key={project.id} project={project} />
                        ))}
                      </div>
                    </div>
                  )}

                  {results.posts.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Posts
                      </h3>
                      <div className="grid gap-4">
                        {results.posts.slice(0, 3).map(post => (
                          <PostCard key={post.id} post={post} />
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Developers Results */}
                <TabsContent value="developers" className="space-y-4 mt-6">
                  {results.developers.map(developer => (
                    <DeveloperCard key={developer.id} developer={developer} />
                  ))}
                </TabsContent>

                {/* Projects Results */}
                <TabsContent value="projects" className="space-y-4 mt-6">
                  {results.projects.map(project => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </TabsContent>

                {/* Posts Results */}
                <TabsContent value="posts" className="space-y-4 mt-6">
                  {results.posts.map(post => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Component for displaying developer results
function DeveloperCard({ developer }: { developer: Developer }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="relative">
            <Avatar className="h-16 w-16">
              <AvatarImage src={developer.avatar} />
              <AvatarFallback>
                {developer.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            {developer.isOnline && (
              <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-lg">{developer.name}</h3>
                <p className="text-gray-600 dark:text-gray-400">{developer.role}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="font-medium">{developer.rating}</span>
                </div>
                {developer.isAvailable && (
                  <Badge variant="secondary">Available</Badge>
                )}
              </div>
            </div>

            {developer.location && (
              <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
                <MapPin className="h-3 w-3" />
                {developer.location}
              </p>
            )}

            <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
              {developer.bio}
            </p>

            <div className="flex flex-wrap gap-2 mb-3">
              {developer.skills.slice(0, 5).map((skill, index) => {
                const skillName = typeof skill === 'string' ? skill : skill.name;
                return (
                  <Badge key={`${skillName}-${index}`} variant="outline" className="text-xs">
                    {skillName}
                  </Badge>
                );
              })}
              {developer.skills.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{developer.skills.length - 5} more
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-4">
                <span>{developer.experience} experience</span>
                <span>•</span>
                <span>{developer.completedProjects} projects</span>
                {developer.hourlyRate && (
                  <>
                    <span>•</span>
                    <span>${developer.hourlyRate}/hr</span>
                  </>
                )}
              </div>
              
              <Button size="sm" variant="outline">
                View Profile
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Component for displaying project results  
function ProjectCard({ project }: { project: Project }) {
  const getStatusColor = (status: Project['status']) => {
    const colors = {
      PLANNING: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      COMPLETED: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      ON_HOLD: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    };
    return colors[status] || colors.PLANNING;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">{project.name}</h3>
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={project.owner.avatar} />
                <AvatarFallback className="text-xs">
                  {project.owner.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-gray-600">{project.owner.name}</span>
              <span className="text-gray-400">•</span>
              <span className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>
          
          <Badge className={getStatusColor(project.status)}>
            {project.status.replace('_', ' ').toLowerCase()}
          </Badge>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {project.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-3">
          {project.technologies?.map(tech => (
            <Badge key={tech} variant="outline" className="text-xs">
              {tech}
            </Badge>
          )) || <span className="text-sm text-gray-500">No technologies listed</span>}
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{project.teamSize || project.membersCount || 0} members</span>
            </div>
            {project.budget && (
              <span>{project.budget}</span>
            )}
            {project.isRemote && (
              <Badge variant="secondary" className="text-xs">Remote</Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {project.githubUrl && (
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <Github className="h-4 w-4" />
              </Button>
            )}
            <Button size="sm" variant="outline">
              View Project
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Component for displaying post results
function PostCard({ post }: { post: Post }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.author.avatar} />
            <AvatarFallback>
              {post.author.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold">{post.author.name}</h3>
              <span className="text-sm text-gray-500">{post.author.role}</span>
              <span className="text-gray-400">•</span>
              <span className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </span>
            </div>

            <p className="text-gray-800 dark:text-gray-200 mb-3">
              {post.content}
            </p>

            <div className="flex flex-wrap gap-2 mb-3">
              {post.tags?.map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  #{tag}
                </Badge>
              ))}
              {post.language && (
                <Badge variant="secondary" className="text-xs">
                  {post.language}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                <span>{post.likes || post.likesCount || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                <span>{post.comments || post.commentsCount || 0}</span>
              </div>
              <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700">
                View Post
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

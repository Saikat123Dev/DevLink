'use client';

import { DashboardNav } from '@/components/DashboardNav';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api-client';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import {
    Code2,
    ExternalLink,
    Github,
    ListChecks,
    Plus,
    Trash2,
    TrendingUp,
    User,
    Users
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProjectMember {
  id: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  user: User;
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  githubUrl?: string;
  owner: User;
  members: ProjectMember[];
  createdAt: string;
  updatedAt: string;
  _count: {
    members: number;
    tasks: number;
  };
}

interface CreateProjectData {
  name: string;
  description: string;
  githubUrl: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const router = useRouter();

  const [createForm, setCreateForm] = useState<CreateProjectData>({
    name: '',
    description: '',
    githubUrl: ''
  });

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
      setCurrentUser(parsedUser);
      setIsAuthLoading(false);
      fetchProjects();
    } catch (error) {
      console.error("Error parsing user data:", error);
      router.push("/login");
    }
  }, [router]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/projects');
      if (response.data.success) {
        setProjects(response.data.data.projects);
      }
    } catch (error: any) {
      console.error('Failed to fetch projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!createForm.name.trim()) {
      toast.error('Project name is required');
      return;
    }

    try {
      setIsCreating(true);
      const response = await apiClient.post('/projects', {
        name: createForm.name.trim(),
        description: createForm.description.trim() || undefined,
        githubUrl: createForm.githubUrl.trim() || undefined
      });

      if (response.data.success) {
        toast.success('Project created successfully');
        setProjects(prev => [response.data.data, ...prev]);
        setIsCreateModalOpen(false);
        setCreateForm({ name: '', description: '', githubUrl: '' });
      }
    } catch (error: any) {
      console.error('Failed to create project:', error);
      toast.error(error.response?.data?.message || 'Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      await apiClient.delete(`/projects/${projectId}`);
      toast.success('Project deleted successfully');
      setProjects(prev => prev.filter(p => p.id !== projectId));
    } catch (error: any) {
      console.error('Failed to delete project:', error);
      toast.error(error.response?.data?.message || 'Failed to delete project');
    }
  };

  const isProjectOwner = (project: Project) => {
    return currentUser?.id === project.owner.id;
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <DashboardNav user={currentUser} />
        <main className="w-full py-8 px-6">
          <div className="space-y-6 animate-pulse">
            <div className="flex justify-between items-center">
              <div>
                <div className="h-10 bg-muted rounded w-48 mb-2"></div>
                <div className="h-5 bg-muted rounded w-96"></div>
              </div>
              <div className="h-10 bg-muted rounded w-36"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="rounded-2xl shadow-lg border-gray-200 dark:border-gray-800">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="h-16 bg-muted rounded"></div>
                      <div className="flex gap-2">
                        <div className="h-6 bg-muted rounded w-20"></div>
                        <div className="h-6 bg-muted rounded w-20"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <DashboardNav user={currentUser} />
      <main className="w-full py-8 px-6">
        <motion.div 
          className="space-y-8"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Projects
          </h1>
          <p className="text-muted-foreground text-lg">
            Collaborate on projects and manage tasks with your team
          </p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Create New Project
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-5 py-2">
              <div>
                <Label htmlFor="name" className="text-sm font-medium">Project Name *</Label>
                <Input
                  id="name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="My Awesome Project"
                  maxLength={100}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                <Textarea
                  id="description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your project..."
                  maxLength={500}
                  rows={4}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="githubUrl" className="text-sm font-medium">
                  <Github className="h-4 w-4 inline mr-1.5" />
                  GitHub Repository
                </Label>
                <Input
                  id="githubUrl"
                  value={createForm.githubUrl}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, githubUrl: e.target.value }))}
                  placeholder="https://github.com/username/repo"
                  className="mt-1.5"
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateProject} 
                  disabled={isCreating}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {isCreating ? 'Creating...' : 'Create Project'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Empty State */}
      {projects.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="text-center py-20 shadow-lg border-2 border-dashed border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
            <CardContent>
              <div className="mx-auto w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl">
                <Code2 className="h-16 w-16 text-white" />
              </div>
              <h3 className="text-3xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                No Projects Yet
              </h3>
              <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
                Create your first project to start collaborating with your team
              </p>
              <Button 
                onClick={() => setIsCreateModalOpen(true)} 
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Project
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        /* Project Cards */
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.08 } }
          }}
        >
          {projects.map((project, index) => (
            <motion.div 
              key={project.id}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 }
              }}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="relative overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm h-full flex flex-col">
                {/* Gradient Header */}
                <div className={`h-2 bg-gradient-to-r ${
                  index % 3 === 0 ? 'from-blue-500 to-purple-500' :
                  index % 3 === 1 ? 'from-purple-500 to-pink-500' :
                  'from-green-500 to-blue-500'
                }`}></div>
                
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Project Icon */}
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                        index % 3 === 0 ? 'from-blue-500 to-purple-500' :
                        index % 3 === 1 ? 'from-purple-500 to-pink-500' :
                        'from-green-500 to-blue-500'
                      } flex items-center justify-center shadow-lg shrink-0`}>
                        <Code2 className="w-6 h-6 text-white" />
                      </div>
                      
                      {/* Project Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg line-clamp-1 mb-1">{project.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Avatar className="h-5 w-5 ring-2 ring-white dark:ring-gray-800">
                            <AvatarImage src={project.owner.avatar} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-[10px]">
                              {project.owner.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate">{project.owner.name}</span>
                        </div>
                      </div>
                    </div>
                    
                    {isProjectOwner(project) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          handleDeleteProject(project.id);
                        }}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4 flex-1 flex flex-col">
                  {/* Description */}
                  {project.description ? (
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No description</p>
                  )}
                  
                  {/* Stats */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0">
                      <Users className="h-3 w-3 mr-1" />
                      {project._count.members + 1} {project._count.members === 0 ? 'member' : 'members'}
                    </Badge>
                    <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-0">
                      <ListChecks className="h-3 w-3 mr-1" />
                      {project._count.tasks} tasks
                    </Badge>
                  </div>

                  {/* GitHub Link */}
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
                    >
                      <Github className="h-4 w-4" />
                      <span>Repository</span>
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  )}

                  {/* Footer */}
                  <div className="mt-auto pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5" />
                      <span>{formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}</span>
                    </div>
                    <Button asChild size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-8">
                      <Link href={`/projects/${project.id}`}>
                        View
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
        </motion.div>
      </main>
    </div>
  );
}

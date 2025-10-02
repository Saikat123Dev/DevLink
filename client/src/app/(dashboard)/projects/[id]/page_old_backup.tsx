'use client';

import { DashboardNav } from '@/components/DashboardNav';
import { MonacoEditor } from '@/components/MonacoEditor';
import { ProjectMembers } from '@/components/projects/ProjectMembers';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api-client';
import { formatDistanceToNow } from 'date-fns';
import {
    ArrowLeft,
    Calendar,
    ChevronDown,
    ChevronRight,
    Clock,
    Code2,
    FileIcon,
    FileText,
    Folder,
    FolderOpen,
    Github,
    ListChecks,
    Loader2,
    Plus,
    RefreshCw,
    User,
    Users
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
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

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  assigneeId?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  project: {
    id: string;
    name: string;
  };
}

interface Project {
  id: string;
  name: string;
  description?: string;
  githubUrl?: string;
  owner: User;
  members: ProjectMember[];
  tasks: Task[];
  createdAt: string;
  updatedAt: string;
  _count: {
    members: number;
    tasks: number;
  };
}

interface CreateTaskData {
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  assigneeId?: string;
  dueDate?: string;
}

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  content?: string;
  children?: FileNode[];
  size?: number;
}

interface RepoStructure {
  owner: string;
  repo: string;
  branch: string;
  files: FileNode[];
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [tasksByStatus, setTasksByStatus] = useState<{
    TODO: Task[];
    IN_PROGRESS: Task[];
    DONE: Task[];
  }>({ TODO: [], IN_PROGRESS: [], DONE: [] });

  const [createTaskForm, setCreateTaskForm] = useState<CreateTaskData>({
    title: '',
    description: '',
    priority: 'MEDIUM',
    assigneeId: '',
    dueDate: ''
  });

  // GitHub repository integration state
  const [repoStructure, setRepoStructure] = useState<RepoStructure | null>(null);
  const [loadingRepo, setLoadingRepo] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [fileContent, setFileContent] = useState<string>('');
  const [loadingFileContent, setLoadingFileContent] = useState(false);

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
      fetchProject();
    } catch (error) {
      console.error("Error parsing user data:", error);
      router.push("/login");
    }
  }, [projectId, router]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/projects/${projectId}`);
      if (response.data.success) {
        setProject(response.data.data);
        // Group tasks by status
        const tasks = response.data.data.tasks || [];
        setTasksByStatus({
          TODO: tasks.filter((task: Task) => task.status === 'TODO'),
          IN_PROGRESS: tasks.filter((task: Task) => task.status === 'IN_PROGRESS'),
          DONE: tasks.filter((task: Task) => task.status === 'DONE'),
        });
      }
    } catch (error: any) {
      console.error('Failed to fetch project:', error);
      if (error.response?.status === 404) {
        toast.error('Project not found');
        router.push('/projects');
      } else {
        toast.error('Failed to load project');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!createTaskForm.title.trim()) {
      toast.error('Task title is required');
      return;
    }

    try {
      setIsCreatingTask(true);
      const response = await apiClient.post(`/projects/${projectId}/tasks`, {
        title: createTaskForm.title.trim(),
        description: createTaskForm.description.trim() || undefined,
        priority: createTaskForm.priority,
        assigneeId: createTaskForm.assigneeId || undefined,
        dueDate: createTaskForm.dueDate || undefined
      });

      if (response.data.success) {
        toast.success('Task created successfully');
        await fetchProject(); // Refresh project data
        setIsCreateTaskModalOpen(false);
        setCreateTaskForm({
          title: '',
          description: '',
          priority: 'MEDIUM',
          assigneeId: '',
          dueDate: ''
        });
      }
    } catch (error: any) {
      console.error('Failed to create task:', error);
      toast.error(error.response?.data?.message || 'Failed to create task');
    } finally {
      setIsCreatingTask(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      await apiClient.put(`/projects/tasks/${taskId}`, {
        status: newStatus
      });
      
      // Update local state optimistically
      setTasksByStatus(prev => {
        const allTasks = [...prev.TODO, ...prev.IN_PROGRESS, ...prev.DONE];
        const task = allTasks.find(t => t.id === taskId);
        if (!task) return prev;
        
        const updatedTask = { ...task, status: newStatus as any };
        
        return {
          TODO: newStatus === 'TODO' ? 
            [...prev.TODO.filter(t => t.id !== taskId), updatedTask] : 
            prev.TODO.filter(t => t.id !== taskId),
          IN_PROGRESS: newStatus === 'IN_PROGRESS' ? 
            [...prev.IN_PROGRESS.filter(t => t.id !== taskId), updatedTask] : 
            prev.IN_PROGRESS.filter(t => t.id !== taskId),
          DONE: newStatus === 'DONE' ? 
            [...prev.DONE.filter(t => t.id !== taskId), updatedTask] : 
            prev.DONE.filter(t => t.id !== taskId),
        };
      });
      
      toast.success('Task status updated');
    } catch (error: any) {
      console.error('Failed to update task:', error);
      toast.error('Failed to update task status');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'default';
      case 'LOW': return 'secondary';
      default: return 'default';
    }
  };

  const isProjectOwner = () => {
    return currentUser?.id === project?.owner.id;
  };

  const canManageProject = () => {
    if (!project || !currentUser) return false;
    return project.owner.id === currentUser.id || 
           project.members.some(m => m.user.id === currentUser.id && m.role === 'ADMIN');
  };

  const parseGitHubUrl = (url: string) => {
    try {
      const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (match) {
        return { owner: match[1], repo: match[2].replace('.git', '') };
      }
    } catch (error) {
      console.error('Error parsing GitHub URL:', error);
    }
    return null;
  };

  const fetchRepoStructure = async () => {
    if (!project?.githubUrl) {
      toast.error('No GitHub URL configured for this project');
      return;
    }

    const parsed = parseGitHubUrl(project.githubUrl);
    if (!parsed) {
      toast.error('Invalid GitHub URL format');
      return;
    }

    try {
      setLoadingRepo(true);
      // Fetch repository tree from GitHub API
      const response = await fetch(
        `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/git/trees/main?recursive=1`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch repository structure');
      }

      const data = await response.json();
      
      // Build file tree structure
      const files: FileNode[] = [];
      const folderMap = new Map<string, FileNode>();

      data.tree.forEach((item: any) => {
        if (item.type === 'blob' || item.type === 'tree') {
          const node: FileNode = {
            name: item.path.split('/').pop() || item.path,
            path: item.path,
            type: item.type === 'blob' ? 'file' : 'directory',
            size: item.size
          };

          const pathParts = item.path.split('/');
          if (pathParts.length === 1) {
            files.push(node);
          } else {
            const parentPath = pathParts.slice(0, -1).join('/');
            if (!folderMap.has(parentPath)) {
              const parentNode: FileNode = {
                name: pathParts[pathParts.length - 2],
                path: parentPath,
                type: 'directory',
                children: []
              };
              folderMap.set(parentPath, parentNode);
            }
            const parent = folderMap.get(parentPath);
            if (parent && parent.children) {
              parent.children.push(node);
            }
          }

          if (node.type === 'directory') {
            folderMap.set(item.path, node);
          }
        }
      });

      setRepoStructure({
        owner: parsed.owner,
        repo: parsed.repo,
        branch: 'main',
        files: data.tree.slice(0, 100).map((item: any) => ({
          name: item.path.split('/').pop() || item.path,
          path: item.path,
          type: item.type === 'blob' ? 'file' : 'directory',
          size: item.size
        }))
      });

      toast.success('Repository structure loaded successfully');
    } catch (error: any) {
      console.error('Failed to fetch repo structure:', error);
      toast.error('Failed to load repository structure');
    } finally {
      setLoadingRepo(false);
    }
  };

  const fetchFileContent = async (file: FileNode) => {
    if (!repoStructure || file.type !== 'file') return;

    try {
      setLoadingFileContent(true);
      setSelectedFile(file);

      const response = await fetch(
        `https://api.github.com/repos/${repoStructure.owner}/${repoStructure.repo}/contents/${file.path}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch file content');
      }

      const data = await response.json();
      const content = atob(data.content); // Decode base64 content
      setFileContent(content);
    } catch (error: any) {
      console.error('Failed to fetch file content:', error);
      toast.error('Failed to load file content');
      setFileContent('// Failed to load file content');
    } finally {
      setLoadingFileContent(false);
    }
  };

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const getFileExtension = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    return ext || '';
  };

  const getLanguageFromExtension = (filename: string) => {
    const ext = getFileExtension(filename);
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'cpp',
      'cs': 'csharp',
      'go': 'go',
      'rs': 'rust',
      'php': 'php',
      'rb': 'ruby',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'md': 'markdown',
      'yaml': 'yaml',
      'yml': 'yaml',
      'sql': 'sql',
      'sh': 'shell'
    };
    return languageMap[ext] || 'plaintext';
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <DashboardNav user={currentUser} />
        <main className="w-full py-8 px-6">
          <div className="space-y-6">
            <div className="h-8 w-32 bg-muted rounded animate-pulse"></div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="p-6">
                  <div className="h-24 bg-muted rounded animate-pulse"></div>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <DashboardNav user={currentUser} />
        <main className="w-full py-8 px-6">
          <div className="flex flex-col items-center justify-center py-20">
            <Code2 className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Project not found</h2>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              The project you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button asChild>
              <Link href="/projects">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Projects
              </Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardNav user={currentUser} />
      
      <main className="w-full py-8 px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/projects">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{project.name}</h1>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                <div className="flex items-center gap-2">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={project.owner.avatar} />
                    <AvatarFallback>
                      <User className="h-3 w-3" />
                    </AvatarFallback>
                  </Avatar>
                  <span>{project.owner.name}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}</span>
                </div>
              </div>
            </div>
          </div>

          {canManageProject() && (
            <Dialog open={isCreateTaskModalOpen} onOpenChange={setIsCreateTaskModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Task
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="taskTitle">Task Title *</Label>
                    <Input
                      id="taskTitle"
                      value={createTaskForm.title}
                      onChange={(e) => setCreateTaskForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="What needs to be done?"
                      maxLength={100}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="taskDescription">Description</Label>
                    <Textarea
                      id="taskDescription"
                      value={createTaskForm.description}
                      onChange={(e) => setCreateTaskForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Add more details..."
                      maxLength={500}
                      rows={4}
                      className="mt-1.5"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select 
                        value={createTaskForm.priority} 
                        onValueChange={(value: string) => setCreateTaskForm(prev => ({ ...prev, priority: value as 'LOW' | 'MEDIUM' | 'HIGH' }))}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">Low</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="dueDate">Due Date</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={createTaskForm.dueDate}
                        onChange={(e) => setCreateTaskForm(prev => ({ ...prev, dueDate: e.target.value }))}
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end pt-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsCreateTaskModalOpen(false)}
                      disabled={isCreatingTask}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateTask} 
                      disabled={isCreatingTask}
                    >
                      {isCreatingTask ? 'Creating...' : 'Create Task'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Members</p>
                  <p className="text-2xl font-bold mt-1">{project._count.members + 1}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Tasks</p>
                  <p className="text-2xl font-bold mt-1">{project._count.tasks}</p>
                </div>
                <ListChecks className="h-8 w-8 text-muted-foreground opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold mt-1">{tasksByStatus.DONE.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold mt-1">{tasksByStatus.IN_PROGRESS.length}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-1 shadow-lg border border-gray-200 dark:border-gray-700">
                <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="tasks" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                  Tasks
                </TabsTrigger>
                <TabsTrigger value="code" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                  Code
                </TabsTrigger>
                <TabsTrigger value="members" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                  Members
                </TabsTrigger>
              </TabsList>

            <TabsContent value="overview" className="space-y-6">
                {/* Description Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="shadow-lg border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                          <Code2 className="w-4 h-4 text-white" />
                        </div>
                        Project Description
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {project.description ? (
                        <p className="text-muted-foreground leading-relaxed">{project.description}</p>
                      ) : (
                        <p className="text-muted-foreground italic">No description provided yet</p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Progress Overview */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="shadow-lg border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-white" />
                        </div>
                        Progress Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Progress Bar */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Completion Rate</span>
                          <span className="text-sm font-bold text-green-600 dark:text-green-400">
                            {project._count.tasks > 0 ? Math.round((tasksByStatus.DONE.length / project._count.tasks) * 100) : 0}%
                          </span>
                        </div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ 
                              width: project._count.tasks > 0 
                                ? `${(tasksByStatus.DONE.length / project._count.tasks) * 100}%` 
                                : '0%' 
                            }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                          ></motion.div>
                        </div>
                      </div>

                      {/* Task Distribution */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-200 dark:border-yellow-800">
                          <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{tasksByStatus.TODO.length}</div>
                          <div className="text-xs text-yellow-600 dark:text-yellow-500 font-medium">To Do</div>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                          <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{tasksByStatus.IN_PROGRESS.length}</div>
                          <div className="text-xs text-blue-600 dark:text-blue-500 font-medium">In Progress</div>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                          <div className="text-2xl font-bold text-green-700 dark:text-green-400">{tasksByStatus.DONE.length}</div>
                          <div className="text-xs text-green-600 dark:text-green-500 font-medium">Done</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

            <TabsContent value="tasks" className="space-y-6">
                {/* Kanban Board */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  {(['TODO', 'IN_PROGRESS', 'DONE'] as const).map((status, index) => (
                    <motion.div
                      key={status}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="min-h-[500px] shadow-lg border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                        <CardHeader className="pb-4 border-b">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                              {status === 'TODO' && <div className="w-2 h-2 rounded-full bg-yellow-500"></div>}
                              {status === 'IN_PROGRESS' && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                              {status === 'DONE' && <div className="w-2 h-2 rounded-full bg-green-500"></div>}
                              {status === 'TODO' ? 'To Do' : 
                               status === 'IN_PROGRESS' ? 'In Progress' : 'Done'}
                            </CardTitle>
                            <Badge 
                              variant="secondary" 
                              className={
                                status === 'TODO' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              }
                            >
                              {tasksByStatus[status].length}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-3">
                          {tasksByStatus[status].map((task) => (
                            <motion.div
                              key={task.id}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              whileHover={{ scale: 1.02 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Card className="p-4 hover:shadow-md transition-all cursor-pointer border-l-4" 
                                style={{
                                  borderLeftColor: 
                                    task.priority === 'HIGH' ? '#ef4444' :
                                    task.priority === 'MEDIUM' ? '#f59e0b' :
                                    '#10b981'
                                }}
                              >
                                <div className="space-y-3">
                                  <div className="flex items-start justify-between gap-2">
                                    <h4 className="font-semibold text-sm line-clamp-2 flex-1">{task.title}</h4>
                                    <Badge 
                                      variant={getPriorityColor(task.priority)} 
                                      className="text-xs shrink-0"
                                    >
                                      {task.priority}
                                    </Badge>
                                  </div>
                                  
                                  {task.description && (
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                      {task.description}
                                    </p>
                                  )}
                                  
                                  <div className="flex items-center justify-between pt-2 border-t">
                                    {task.dueDate ? (
                                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <Clock className="h-3.5 w-3.5" />
                                        {new Date(task.dueDate).toLocaleDateString('en-US', { 
                                          month: 'short', 
                                          day: 'numeric' 
                                        })}
                                      </div>
                                    ) : (
                                      <div></div>
                                    )}
                                    
                                    {canManageProject() && (
                                      <Select value={task.status} onValueChange={(value: string) => updateTaskStatus(task.id, value)}>
                                        <SelectTrigger className="h-7 w-24 text-xs">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="TODO">To Do</SelectItem>
                                          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                          <SelectItem value="DONE">Done</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    )}
                                  </div>
                                </div>
                              </Card>
                            </motion.div>
                          ))}
                          
                          {tasksByStatus[status].length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                              <div className="mb-2 opacity-20">
                                {status === 'TODO' && <ListChecks className="h-12 w-12 mx-auto" />}
                                {status === 'IN_PROGRESS' && <Clock className="h-12 w-12 mx-auto" />}
                                {status === 'DONE' && <Calendar className="h-12 w-12 mx-auto" />}
                              </div>
                              <p className="text-sm">No tasks {status === 'TODO' ? 'to do' : status === 'IN_PROGRESS' ? 'in progress' : 'completed'}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              </TabsContent>

              <TabsContent value="code" className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="shadow-lg border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b">
                      <CardTitle className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                          <Code2 className="w-4 h-4 text-white" />
                        </div>
                        Code Snippet
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">Share code examples or important snippets for this project</p>
                    </CardHeader>
                    <CardContent className="p-0">
                      <MonacoEditor
                        value={`// Example: Project setup\n\nfunction setupProject() {\n  // Initialize project configuration\n  const config = {\n    name: "${project.name}",\n    version: "1.0.0",\n    description: "${project.description || 'A collaborative development project'}"\n  };\n\n  return config;\n}\n\nsetupProject();`}
                        language="javascript"
                        height="450px"
                        showLanguageSelector={true}
                        showCopyButton={true}
                      />
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Additional Code Examples */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="shadow-lg border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-base">Quick Commands</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 font-mono text-sm">
                          <div className="text-xs text-muted-foreground mb-1">Clone repository</div>
                          {project.githubUrl && (
                            <code className="text-blue-600 dark:text-blue-400">git clone {project.githubUrl}</code>
                          )}
                          {!project.githubUrl && (
                            <code className="text-muted-foreground">No repository URL configured</code>
                          )}
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 font-mono text-sm">
                          <div className="text-xs text-muted-foreground mb-1">Install dependencies</div>
                          <code className="text-blue-600 dark:text-blue-400">npm install</code>
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 font-mono text-sm">
                          <div className="text-xs text-muted-foreground mb-1">Run development server</div>
                          <code className="text-blue-600 dark:text-blue-400">npm run dev</code>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="members" className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="shadow-lg border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b">
                      <CardTitle className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <Users className="w-4 h-4 text-white" />
                        </div>
                        Team Members
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <ProjectMembers 
                        projectId={projectId}
                        projectName={project.name}
                        currentUserId={currentUser.id}
                        isOwner={isProjectOwner()}
                        isAdmin={project.members.some(m => m.user.id === currentUser.id && m.role === 'ADMIN')}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="shadow-lg border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {project.githubUrl && (
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                        <Github className="h-4 w-4 mr-2" />
                        View Repository
                      </a>
                    </Button>
                  )}
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href={`/projects`}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      All Projects
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Project Timeline */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="shadow-lg border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">Created</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">Last Updated</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Task Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="shadow-lg border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Task Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-center gap-2">
                      <ListChecks className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      <span className="text-sm font-medium">To Do</span>
                    </div>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400">
                      {tasksByStatus.TODO.length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium">In Progress</span>
                    </div>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">
                      {tasksByStatus.IN_PROGRESS.length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium">Completed</span>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
                      {tasksByStatus.DONE.length}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}

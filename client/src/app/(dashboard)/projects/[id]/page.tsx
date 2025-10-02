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
import { themeDisplayNames, ThemeName } from '@/lib/monaco-themes';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  Code2,
  Copy,
  FileText,
  Folder,
  FolderOpen,
  Github,
  GripVertical,
  ListChecks,
  Loader2,
  Monitor,
  Moon,
  Plus,
  RefreshCw,
  Sun,
  User,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
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
  assignee?: User;
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

// Sortable Task Card Component
function SortableTaskCard({ 
  task, 
  canManage, 
  onEdit, 
  onAssign, 
  members 
}: { 
  task: Task; 
  canManage: boolean; 
  onEdit: (task: Task) => void;
  onAssign: (taskId: string, memberId: string) => void;
  members: User[];
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return '#ef4444';
      case 'MEDIUM': return '#f59e0b';
      case 'LOW': return '#10b981';
      default: return '#6b7280';
    }
  };

  return (
    <Card 
      ref={setNodeRef} 
      style={style}
      className="p-4 hover:shadow-md transition-all cursor-grab active:cursor-grabbing border-l-4" 
      {...attributes}
      {...listeners}
    >
      <div 
        className="space-y-3"
        style={{ borderLeftColor: getPriorityColor(task.priority) }}
      >
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-sm line-clamp-2 flex-1">{task.title}</h4>
          <Badge 
            variant={task.priority === 'HIGH' ? 'destructive' : 'default'}
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
        
        <div className="flex items-center justify-between pt-2 border-t gap-2">
          <div className="flex items-center gap-2 flex-1">
            {task.dueDate && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {new Date(task.dueDate).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </div>
            )}
            {task.assignee && (
              <div className="flex items-center gap-1.5">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={task.assignee.avatar} />
                  <AvatarFallback className="text-xs">
                    {task.assignee.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                  {task.assignee.name.split(' ')[0]}
                </span>
              </div>
            )}
          </div>
          
          {canManage && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 px-2"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task);
              }}
            >
              Edit
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

// Task Column Component with Droppable Zone
function TaskColumn({
  status,
  tasks,
  canManage,
  onEditTask,
  onAssignTask,
  members
}: {
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  tasks: Task[];
  canManage: boolean;
  onEditTask: (task: Task) => void;
  onAssignTask: (taskId: string, memberId: string) => void;
  members: User[];
}) {
  const { setNodeRef } = useSortable({ id: status });

  const getStatusInfo = () => {
    switch (status) {
      case 'TODO':
        return { label: 'To Do', color: 'bg-yellow-500', icon: ListChecks };
      case 'IN_PROGRESS':
        return { label: 'In Progress', color: 'bg-blue-500', icon: Clock };
      case 'DONE':
        return { label: 'Done', color: 'bg-green-500', icon: Calendar };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <Card ref={setNodeRef} className="min-h-[500px]">
      <CardHeader className="pb-4 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${statusInfo.color}`}></div>
            {statusInfo.label}
          </CardTitle>
          <Badge variant="secondary">
            {tasks.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              canManage={canManage}
              onEdit={onEditTask}
              onAssign={onAssignTask}
              members={members}
            />
          ))}
        </SortableContext>
        
        {tasks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <div className="mb-2 opacity-20">
              <StatusIcon className="h-12 w-12 mx-auto" />
            </div>
            <p className="text-sm">
              No tasks {status === 'TODO' ? 'to do' : status === 'IN_PROGRESS' ? 'in progress' : 'completed'}
            </p>
            <p className="text-xs mt-1">Drag tasks here</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Drag Overlay Component
function TaskCardOverlay({ task }: { task: Task }) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return '#ef4444';
      case 'MEDIUM': return '#f59e0b';
      case 'LOW': return '#10b981';
      default: return '#6b7280';
    }
  };

  return (
    <Card 
      className="p-4 shadow-lg border-l-4 rotate-3 opacity-90" 
      style={{ borderLeftColor: getPriorityColor(task.priority) }}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-sm line-clamp-2 flex-1">{task.title}</h4>
          <Badge 
            variant={task.priority === 'HIGH' ? 'destructive' : 'default'}
            className="text-xs shrink-0"
          >
            {task.priority}
          </Badge>
        </div>
      </div>
    </Card>
  );
}

// Recursive File Tree Node Component
function FileTreeNode({
  node,
  level,
  expandedFolders,
  selectedFile,
  onToggleFolder,
  onSelectFile
}: {
  node: FileNode;
  level: number;
  expandedFolders: Set<string>;
  selectedFile: FileNode | null;
  onToggleFolder: (path: string) => void;
  onSelectFile: (file: FileNode) => void;
}) {
  const isExpanded = expandedFolders.has(node.path);
  const paddingLeft = level * 16;
  const isSelected = selectedFile?.path === node.path;

  if (node.type === 'directory') {
    return (
      <div>
        <div
          className={`flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors group ${
            isExpanded ? 'bg-gray-50 dark:bg-gray-900' : ''
          }`}
          style={{ paddingLeft: `${paddingLeft + 8}px` }}
          onClick={() => onToggleFolder(node.path)}
        >
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-500" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-500" />
          )}
          {isExpanded ? (
            <FolderOpen className="h-4 w-4 text-blue-500 shrink-0" />
          ) : (
            <Folder className="h-4 w-4 text-blue-500 shrink-0" />
          )}
          <span className="text-sm truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {node.name}
          </span>
          {node.children && (
            <span className="text-xs text-muted-foreground ml-auto">
              {node.children.length}
            </span>
          )}
        </div>
        {isExpanded && node.children && (
          <div className="mt-0.5">
            {node.children.map((child) => (
              <FileTreeNode
                key={child.path}
                node={child}
                level={level + 1}
                expandedFolders={expandedFolders}
                selectedFile={selectedFile}
                onToggleFolder={onToggleFolder}
                onSelectFile={onSelectFile}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-all group ${
        isSelected
          ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-medium'
          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
      style={{ paddingLeft: `${paddingLeft + 24}px` }}
      onClick={() => onSelectFile(node)}
    >
      <FileText className={`h-4 w-4 shrink-0 ${
        isSelected ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
      }`} />
      <span className="text-sm truncate flex-1">{node.name}</span>
      {node.size && node.size > 0 && (
        <span className="text-xs text-muted-foreground shrink-0">
          {(node.size / 1024).toFixed(1)} KB
        </span>
      )}
    </div>
  );
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
  
  // GitHub URL management
  const [isAddRepoModalOpen, setIsAddRepoModalOpen] = useState(false);
  const [githubUrlInput, setGithubUrlInput] = useState('');
  const [isUpdatingRepo, setIsUpdatingRepo] = useState(false);

  // Drag and drop
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Task editing
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);

  // Monaco editor theme
  const [editorTheme, setEditorTheme] = useState<ThemeName>('vs-dark');

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

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const allTasks = [...tasksByStatus.TODO, ...tasksByStatus.IN_PROGRESS, ...tasksByStatus.DONE];
    const task = allTasks.find(t => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as string;

    // Check if it's a valid status
    if (!['TODO', 'IN_PROGRESS', 'DONE'].includes(newStatus)) return;

    // Find the task
    const allTasks = [...tasksByStatus.TODO, ...tasksByStatus.IN_PROGRESS, ...tasksByStatus.DONE];
    const task = allTasks.find(t => t.id === taskId);
    
    if (!task || task.status === newStatus) return;

    // Update task status
    await updateTaskStatus(taskId, newStatus);
  };

  const handleAssignTask = async (taskId: string, memberId: string) => {
    try {
      await apiClient.put(`/projects/tasks/${taskId}`, {
        assigneeId: memberId || null
      });
      
      // Refresh project data to get updated assignee info
      await fetchProject();
      toast.success('Task assigned successfully');
    } catch (error: any) {
      console.error('Failed to assign task:', error);
      toast.error('Failed to assign task');
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsEditTaskModalOpen(true);
  };

  const handleUpdateTask = async () => {
    if (!editingTask) return;

    try {
      await apiClient.put(`/projects/tasks/${editingTask.id}`, {
        title: editingTask.title,
        description: editingTask.description,
        priority: editingTask.priority,
        assigneeId: editingTask.assigneeId || null,
        dueDate: editingTask.dueDate || null
      });

      toast.success('Task updated successfully');
      await fetchProject();
      setIsEditTaskModalOpen(false);
      setEditingTask(null);
    } catch (error: any) {
      console.error('Failed to update task:', error);
      toast.error('Failed to update task');
    }
  };

  const getProjectMembers = () => {
    if (!project) return [];
    return [project.owner, ...project.members.map(m => m.user)];
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
      // Fetch repository tree from GitHub API with recursive flag
      const response = await fetch(
        `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/git/trees/main?recursive=1`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch repository structure');
      }

      const data = await response.json();
      
      // Build a hierarchical tree structure
      const buildTree = (items: any[]): FileNode[] => {
        const root: FileNode[] = [];
        const map = new Map<string, FileNode>();

        // First pass: create all nodes
        items.forEach((item: any) => {
          const node: FileNode = {
            name: item.path.split('/').pop() || item.path,
            path: item.path,
            type: item.type === 'blob' ? 'file' : 'directory',
            size: item.size,
            children: item.type === 'tree' ? [] : undefined
          };
          map.set(item.path, node);
        });

        // Second pass: build hierarchy
        items.forEach((item: any) => {
          const node = map.get(item.path);
          if (!node) return;

          const pathParts = item.path.split('/');
          if (pathParts.length === 1) {
            // Top-level item
            root.push(node);
          } else {
            // Nested item - find parent
            const parentPath = pathParts.slice(0, -1).join('/');
            const parent = map.get(parentPath);
            if (parent && parent.children) {
              parent.children.push(node);
            }
          }
        });

        // Sort: directories first, then files
        const sortNodes = (nodes: FileNode[]) => {
          nodes.sort((a, b) => {
            if (a.type !== b.type) {
              return a.type === 'directory' ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
          });
          nodes.forEach(node => {
            if (node.children) {
              sortNodes(node.children);
            }
          });
        };
        sortNodes(root);

        return root;
      };

      const tree = buildTree(data.tree);
      
      setRepoStructure({
        owner: parsed.owner,
        repo: parsed.repo,
        branch: 'main',
        files: tree
      });

      toast.success('Repository structure loaded successfully');
    } catch (error: any) {
      console.error('Failed to fetch repo structure:', error);
      toast.error('Failed to load repository structure. Make sure the repository is public.');
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

  const handleAddRepository = async () => {
    if (!githubUrlInput.trim()) {
      toast.error('Please enter a GitHub repository URL');
      return;
    }

    // Validate GitHub URL format
    const parsed = parseGitHubUrl(githubUrlInput.trim());
    if (!parsed) {
      toast.error('Invalid GitHub URL format. Please use: https://github.com/owner/repo');
      return;
    }

    try {
      setIsUpdatingRepo(true);
      const response = await apiClient.put(`/projects/${projectId}`, {
        githubUrl: githubUrlInput.trim()
      });

      if (response.data.success) {
        toast.success('GitHub repository added successfully');
        await fetchProject(); // Refresh project data
        setIsAddRepoModalOpen(false);
        setGithubUrlInput('');
        // Clear any existing repo structure to force reload
        setRepoStructure(null);
        setSelectedFile(null);
        setFileContent('');
      }
    } catch (error: any) {
      console.error('Failed to add repository:', error);
      toast.error(error.response?.data?.message || 'Failed to add repository');
    } finally {
      setIsUpdatingRepo(false);
    }
  };

  const handleRemoveRepository = async () => {
    if (!confirm('Are you sure you want to remove the GitHub repository link from this project?')) {
      return;
    }

    try {
      const response = await apiClient.put(`/projects/${projectId}`, {
        githubUrl: null
      });

      if (response.data.success) {
        toast.success('GitHub repository removed');
        await fetchProject(); // Refresh project data
        // Clear repo structure
        setRepoStructure(null);
        setSelectedFile(null);
        setFileContent('');
      }
    } catch (error: any) {
      console.error('Failed to remove repository:', error);
      toast.error('Failed to remove repository');
    }
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
                  <div>
                    <Label htmlFor="assignee">Assign To</Label>
                    <Select 
                      value={createTaskForm.assigneeId || 'unassigned'} 
                      onValueChange={(value: string) => setCreateTaskForm(prev => ({ ...prev, assigneeId: value === 'unassigned' ? '' : value }))}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Select a team member" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {getProjectMembers().map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            <div className="flex items-center gap-2">
                              {member.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
        <div className="grid grid-cols-1 gap-6">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="code">Code Repository</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Project Description</CardTitle>
                </CardHeader>
                <CardContent>
                  {project.description ? (
                    <p className="text-muted-foreground leading-relaxed">{project.description}</p>
                  ) : (
                    <p className="text-muted-foreground italic">No description provided yet</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Github className="h-5 w-5" />
                      GitHub Repository
                    </CardTitle>
                    {canManageProject() && (
                      <div className="flex gap-2">
                        {project.githubUrl ? (
                          <Button variant="outline" size="sm" onClick={handleRemoveRepository}>
                            Remove
                          </Button>
                        ) : null}
                        <Dialog open={isAddRepoModalOpen} onOpenChange={setIsAddRepoModalOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => {
                              setGithubUrlInput(project.githubUrl || '');
                              setIsAddRepoModalOpen(true);
                            }}>
                              <Github className="h-4 w-4 mr-2" />
                              {project.githubUrl ? 'Update' : 'Add'} Repository
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>
                                {project.githubUrl ? 'Update' : 'Add'} GitHub Repository
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="githubUrl">GitHub Repository URL</Label>
                                <Input
                                  id="githubUrl"
                                  value={githubUrlInput}
                                  onChange={(e) => setGithubUrlInput(e.target.value)}
                                  placeholder="https://github.com/owner/repository"
                                  className="mt-1.5"
                                />
                                <p className="text-xs text-muted-foreground mt-2">
                                  Enter the full URL of your GitHub repository (must be public)
                                </p>
                              </div>
                              <div className="flex gap-3 justify-end">
                                <Button 
                                  variant="outline" 
                                  onClick={() => {
                                    setIsAddRepoModalOpen(false);
                                    setGithubUrlInput('');
                                  }}
                                  disabled={isUpdatingRepo}
                                >
                                  Cancel
                                </Button>
                                <Button 
                                  onClick={handleAddRepository} 
                                  disabled={isUpdatingRepo}
                                >
                                  {isUpdatingRepo ? 'Saving...' : 'Save'}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {project.githubUrl ? (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2"
                    >
                      {project.githubUrl}
                      <Github className="h-4 w-4" />
                    </a>
                  ) : (
                    <p className="text-muted-foreground italic">
                      No GitHub repository linked yet. {canManageProject() && 'Click "Add Repository" to link one.'}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Progress Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Completion Rate</span>
                      <span className="text-sm font-bold text-green-600 dark:text-green-400">
                        {project._count.tasks > 0 ? Math.round((tasksByStatus.DONE.length / project._count.tasks) * 100) : 0}%
                      </span>
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all duration-1000"
                        style={{
                          width: project._count.tasks > 0 
                            ? `${(tasksByStatus.DONE.length / project._count.tasks) * 100}%` 
                            : '0%'
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border">
                      <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{tasksByStatus.TODO.length}</div>
                      <div className="text-xs text-yellow-600 dark:text-yellow-500 font-medium">To Do</div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border">
                      <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{tasksByStatus.IN_PROGRESS.length}</div>
                      <div className="text-xs text-blue-600 dark:text-blue-500 font-medium">In Progress</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border">
                      <div className="text-2xl font-bold text-green-700 dark:text-green-400">{tasksByStatus.DONE.length}</div>
                      <div className="text-xs text-green-600 dark:text-green-500 font-medium">Done</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-6">
              <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(['TODO', 'IN_PROGRESS', 'DONE'] as const).map((status) => (
                    <TaskColumn
                      key={status}
                      status={status}
                      tasks={tasksByStatus[status]}
                      canManage={canManageProject()}
                      onEditTask={handleEditTask}
                      onAssignTask={handleAssignTask}
                      members={getProjectMembers()}
                    />
                  ))}
                </div>
                <DragOverlay>
                  {activeTask ? (
                    <TaskCardOverlay task={activeTask} />
                  ) : null}
                </DragOverlay>
              </DndContext>

              {/* Edit Task Modal */}
              <Dialog open={isEditTaskModalOpen} onOpenChange={setIsEditTaskModalOpen}>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Edit Task</DialogTitle>
                  </DialogHeader>
                  {editingTask && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="editTaskTitle">Task Title *</Label>
                        <Input
                          id="editTaskTitle"
                          value={editingTask.title}
                          onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                          placeholder="What needs to be done?"
                          maxLength={100}
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label htmlFor="editTaskDescription">Description</Label>
                        <Textarea
                          id="editTaskDescription"
                          value={editingTask.description || ''}
                          onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                          placeholder="Add more details..."
                          maxLength={500}
                          rows={4}
                          className="mt-1.5"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="editPriority">Priority</Label>
                          <Select 
                            value={editingTask.priority} 
                            onValueChange={(value: string) => setEditingTask({ ...editingTask, priority: value as 'LOW' | 'MEDIUM' | 'HIGH' })}
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
                          <Label htmlFor="editDueDate">Due Date</Label>
                          <Input
                            id="editDueDate"
                            type="date"
                            value={editingTask.dueDate || ''}
                            onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                            className="mt-1.5"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="editAssignee">Assign To</Label>
                        <Select 
                          value={editingTask.assigneeId || 'unassigned'} 
                          onValueChange={(value: string) => setEditingTask({ ...editingTask, assigneeId: value === 'unassigned' ? undefined : value })}
                        >
                          <SelectTrigger className="mt-1.5">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {getProjectMembers().map((member) => (
                              <SelectItem key={member.id} value={member.id}>
                                {member.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-3 justify-end pt-2">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setIsEditTaskModalOpen(false);
                            setEditingTask(null);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleUpdateTask}>
                          Update Task
                        </Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </TabsContent>

            <TabsContent value="code" className="space-y-6">
              {/* GitHub Repository Integration */}
              <Card className="overflow-hidden">
                <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                        <Github className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Repository Browser</CardTitle>
                        {repoStructure && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {repoStructure.owner}/{repoStructure.repo} • {repoStructure.branch}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {repoStructure && (
                        <Select value={editorTheme} onValueChange={(value: ThemeName) => setEditorTheme(value)}>
                          <SelectTrigger className="w-[200px] h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="vs-dark">
                              <div className="flex items-center gap-2">
                                <Moon className="h-4 w-4" />
                                {themeDisplayNames['vs-dark']}
                              </div>
                            </SelectItem>
                            <SelectItem value="vs-light">
                              <div className="flex items-center gap-2">
                                <Sun className="h-4 w-4" />
                                {themeDisplayNames['vs-light']}
                              </div>
                            </SelectItem>
                            <SelectItem value="hc-black">
                              <div className="flex items-center gap-2">
                                <Monitor className="h-4 w-4" />
                                {themeDisplayNames['hc-black']}
                              </div>
                            </SelectItem>
                            <SelectItem value="hc-light">
                              <div className="flex items-center gap-2">
                                <Monitor className="h-4 w-4" />
                                {themeDisplayNames['hc-light']}
                              </div>
                            </SelectItem>
                            <SelectItem value="monokai">{themeDisplayNames['monokai']}</SelectItem>
                            <SelectItem value="github-dark">{themeDisplayNames['github-dark']}</SelectItem>
                            <SelectItem value="solarized-dark">{themeDisplayNames['solarized-dark']}</SelectItem>
                            <SelectItem value="dracula">{themeDisplayNames['dracula']}</SelectItem>
                            <SelectItem value="nord">{themeDisplayNames['nord']}</SelectItem>
                            <SelectItem value="one-dark">{themeDisplayNames['one-dark']}</SelectItem>
                            <SelectItem value="night-owl">{themeDisplayNames['night-owl']}</SelectItem>
                            <SelectItem value="cappuccino">{themeDisplayNames['cappuccino']}</SelectItem>
                            <SelectItem value="espresso">{themeDisplayNames['espresso']}</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      {canManageProject() && !project.githubUrl && (
                        <Dialog open={isAddRepoModalOpen} onOpenChange={setIsAddRepoModalOpen}>
                          <DialogTrigger asChild>
                            <Button onClick={() => setIsAddRepoModalOpen(true)}>
                              <Github className="h-4 w-4 mr-2" />
                              Add Repository
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add GitHub Repository</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="githubUrl">GitHub Repository URL</Label>
                                <Input
                                  id="githubUrl"
                                  value={githubUrlInput}
                                  onChange={(e) => setGithubUrlInput(e.target.value)}
                                  placeholder="https://github.com/owner/repository"
                                  className="mt-1.5"
                                />
                                <p className="text-xs text-muted-foreground mt-2">
                                  Enter the full URL of your GitHub repository (must be public)
                                </p>
                              </div>
                              <div className="flex gap-3 justify-end">
                                <Button 
                                  variant="outline" 
                                  onClick={() => {
                                    setIsAddRepoModalOpen(false);
                                    setGithubUrlInput('');
                                  }}
                                  disabled={isUpdatingRepo}
                                >
                                  Cancel
                                </Button>
                                <Button 
                                  onClick={handleAddRepository} 
                                  disabled={isUpdatingRepo}
                                >
                                  {isUpdatingRepo ? 'Saving...' : 'Save'}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      {project.githubUrl && !repoStructure && (
                        <Button onClick={fetchRepoStructure} disabled={loadingRepo}>
                          {loadingRepo ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Load Repository
                            </>
                          )}
                        </Button>
                      )}
                      {repoStructure && (
                        <Button onClick={fetchRepoStructure} variant="outline" size="sm" disabled={loadingRepo}>
                          {loadingRepo ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {!project.githubUrl ? (
                    <div className="text-center py-20 px-4">
                      <div className="inline-flex p-4 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                        <Github className="h-12 w-12 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">No Repository Connected</h3>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Connect a GitHub repository to browse code, view files, and manage your project's codebase.
                      </p>
                      {canManageProject() && (
                        <Button onClick={() => setIsAddRepoModalOpen(true)} size="lg">
                          <Github className="h-4 w-4 mr-2" />
                          Connect Repository
                        </Button>
                      )}
                    </div>
                  ) : !repoStructure ? (
                    <div className="text-center py-20 px-4">
                      <div className="inline-flex p-4 rounded-full bg-blue-100 dark:bg-blue-900/20 mb-4">
                        <Code2 className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Ready to Explore</h3>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Load the repository to browse files, view code with syntax highlighting, and explore the project structure.
                      </p>
                      <Button onClick={fetchRepoStructure} disabled={loadingRepo} size="lg">
                        {loadingRepo ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Loading Repository...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Load Repository
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="h-[700px]">
                      <PanelGroup direction="horizontal">
                        {/* File Tree Panel */}
                        <Panel defaultSize={30} minSize={20} maxSize={50}>
                          <div className="h-full border-r bg-gray-50/50 dark:bg-gray-900/50">
                            <div className="sticky top-0 bg-white dark:bg-gray-950 border-b px-4 py-3 z-10">
                              <div className="flex items-center gap-2">
                                <Folder className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                <h3 className="font-semibold text-sm">Explorer</h3>
                                <Badge variant="secondary" className="ml-auto text-xs">
                                  {repoStructure.files.length}
                                </Badge>
                              </div>
                            </div>
                            <div className="overflow-y-auto h-[calc(100%-53px)] p-2">
                              <div className="space-y-0.5">
                                {repoStructure.files.map((file) => (
                                  <FileTreeNode
                                    key={file.path}
                                    node={file}
                                    level={0}
                                    expandedFolders={expandedFolders}
                                    selectedFile={selectedFile}
                                    onToggleFolder={toggleFolder}
                                    onSelectFile={fetchFileContent}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        </Panel>

                        {/* Resize Handle */}
                        <PanelResizeHandle className="w-1 bg-border hover:bg-blue-500 transition-colors relative group">
                          <div className="absolute inset-y-0 -left-1 -right-1 flex items-center justify-center">
                            <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </PanelResizeHandle>

                        {/* Code Editor Panel */}
                        <Panel defaultSize={70} minSize={50}>
                          <div className="h-full flex flex-col">
                            {loadingFileContent ? (
                              <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-950">
                                <div className="text-center">
                                  <Loader2 className="h-10 w-10 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-3" />
                                  <p className="text-sm text-muted-foreground">Loading file...</p>
                                </div>
                              </div>
                            ) : selectedFile ? (
                              <>
                                {/* File Header */}
                                <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-950 border-b">
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-gray-500" />
                                    <span className="font-medium text-sm">{selectedFile.name}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {getLanguageFromExtension(selectedFile.name)}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {selectedFile.size && (
                                      <span className="text-xs text-muted-foreground">
                                        {(selectedFile.size / 1024).toFixed(2)} KB
                                      </span>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7"
                                      onClick={() => {
                                        navigator.clipboard.writeText(fileContent);
                                        toast.success('Code copied to clipboard');
                                      }}
                                    >
                                      <Copy className="h-3.5 w-3.5 mr-1.5" />
                                      Copy
                                    </Button>
                                  </div>
                                </div>
                                {/* Monaco Editor */}
                                <div className="flex-1 overflow-hidden">
                                  <MonacoEditor
                                    value={fileContent}
                                    language={getLanguageFromExtension(selectedFile.name)}
                                    height="100%"
                                    theme={editorTheme}
                                    readOnly={true}
                                    showLanguageSelector={false}
                                    showCopyButton={false}
                                  />
                                </div>
                              </>
                            ) : (
                              <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-950">
                                <div className="text-center max-w-md px-4">
                                  <div className="inline-flex p-4 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                                    <Code2 className="h-10 w-10 text-gray-400" />
                                  </div>
                                  <h3 className="font-semibold mb-2">No File Selected</h3>
                                  <p className="text-sm text-muted-foreground">
                                    Select a file from the explorer to view its contents with syntax highlighting.
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </Panel>
                      </PanelGroup>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="members" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Team Members
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ProjectMembers 
                    projectId={projectId}
                    projectName={project.name}
                    currentUserId={currentUser.id}
                    isOwner={isProjectOwner()}
                    isAdmin={project.members.some(m => m.user.id === currentUser.id && m.role === 'ADMIN')}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

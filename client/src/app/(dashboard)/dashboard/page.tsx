'use client';

import { DashboardNav } from '@/components/DashboardNav';
import { PostCreator } from '@/components/PostCreator';
import { PostFeed } from '@/components/PostFeed';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { apiClient } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
    Activity,
    ArrowUpRight,
    Briefcase,
    Calendar,
    CheckCircle,
    Clock,
    Code,
    FolderKanban,
    MessageSquare,
    TrendingUp,
    User,
    Users,
    Zap
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface DashboardStats {
  posts: number;
  connections: number;
  projects: number;
  tasks: {
    total: number;
    completed: number;
    inProgress: number;
    todo: number;
  };
  notifications: {
    unread: number;
  };
  recentActivity: Activity[];
}

interface Activity {
  id: string;
  type: 'post' | 'connection' | 'project' | 'task' | 'comment';
  title: string;
  description: string;
  timestamp: string;
  icon?: string;
}

interface RecentProject {
  id: string;
  name: string;
  progress: number;
  tasksCompleted: number;
  totalTasks: number;
  members: number;
  updatedAt: string;
}

interface Connection {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
  isOnline: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    posts: 0,
    connections: 0,
    projects: 0,
    tasks: { total: 0, completed: 0, inProgress: 0, todo: 0 },
    notifications: { unread: 0 },
    recentActivity: []
  });
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [topConnections, setTopConnections] = useState<Connection[]>([]);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchDashboardData(parsedUser.id);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/login');
    }
  }, [router]);

  const fetchDashboardData = async (userId: string) => {
    try {
      setLoading(true);
      
      // Fetch all dashboard data in parallel
      const [postsRes, connectionsRes, projectsRes] = await Promise.all([
        apiClient.get(`/users/${userId}/posts`).catch(() => ({ data: [] })),
        apiClient.get('/connections').catch(() => ({ data: [] })),
        apiClient.get('/projects').catch(() => ({ data: [] }))
      ]);

      const posts = Array.isArray(postsRes.data) ? postsRes.data : [];
      const connections = Array.isArray(connectionsRes.data) ? connectionsRes.data : [];
      const projects = Array.isArray(projectsRes.data) ? projectsRes.data : [];

      // Calculate task statistics
      let totalTasks = 0;
      let completedTasks = 0;
      let inProgressTasks = 0;
      let todoTasks = 0;

      const projectsWithStats = projects.map((project: any) => {
        const tasks = project.tasks || [];
        const completed = tasks.filter((t: any) => t.status === 'DONE').length;
        const inProgress = tasks.filter((t: any) => t.status === 'IN_PROGRESS').length;
        const todo = tasks.filter((t: any) => t.status === 'TODO').length;
        
        totalTasks += tasks.length;
        completedTasks += completed;
        inProgressTasks += inProgress;
        todoTasks += todo;

        return {
          id: project.id,
          name: project.name,
          progress: tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0,
          tasksCompleted: completed,
          totalTasks: tasks.length,
          members: (project._count?.members || 0) + 1,
          updatedAt: project.updatedAt
        };
      });

      // Get recent projects (top 3)
      const recentProjectsList = projectsWithStats
        .sort((a: RecentProject, b: RecentProject) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
        .slice(0, 3);

      // Get top connections (active users)
      const connectionsList = connections
        .slice(0, 5)
        .map((conn: any) => ({
          id: conn.user?.id || conn.id,
          name: conn.user?.name || conn.name || 'Unknown User',
          avatar: conn.user?.avatar || conn.avatar,
          role: conn.user?.role || conn.role,
          isOnline: Math.random() > 0.5 // Mock online status
        }));

      // Generate recent activity
      const activities: Activity[] = [];
      
      // Add post activities
      posts.slice(0, 2).forEach((post: any) => {
        activities.push({
          id: `post-${post.id}`,
          type: 'post',
          title: 'Created a new post',
          description: post.content?.substring(0, 50) + '...' || 'New post created',
          timestamp: post.createdAt
        });
      });

      // Add project activities
      recentProjectsList.slice(0, 2).forEach((project: RecentProject) => {
        activities.push({
          id: `project-${project.id}`,
          type: 'project',
          title: `Working on ${project.name}`,
          description: `${project.tasksCompleted}/${project.totalTasks} tasks completed`,
          timestamp: project.updatedAt
        });
      });

      // Sort activities by timestamp
      activities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setStats({
        posts: posts.length,
        connections: connections.length,
        projects: projects.length,
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          inProgress: inProgressTasks,
          todo: todoTasks
        },
        notifications: {
          unread: Math.floor(Math.random() * 10) // Mock unread notifications
        },
        recentActivity: activities.slice(0, 5)
      });

      setRecentProjects(recentProjectsList);
      setTopConnections(connectionsList);

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = () => {
    // Trigger refresh of the post feed and dashboard stats
    setRefreshTrigger(prev => prev + 1);
    if (user?.id) {
      fetchDashboardData(user.id);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'post': return <MessageSquare className="h-4 w-4" />;
      case 'connection': return <Users className="h-4 w-4" />;
      case 'project': return <FolderKanban className="h-4 w-4" />;
      case 'task': return <CheckCircle className="h-4 w-4" />;
      case 'comment': return <MessageSquare className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'post': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30';
      case 'connection': return 'bg-green-100 text-green-600 dark:bg-green-900/30';
      case 'project': return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30';
      case 'task': return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30';
      case 'comment': return 'bg-pink-100 text-pink-600 dark:bg-pink-900/30';
      default: return 'bg-gray-100 text-gray-600 dark:bg-gray-900/30';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <DashboardNav user={user} />
      
      <main className="w-full py-6 px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Welcome back, {user.name?.split(' ')[0] || 'Developer'}! 👋
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Here's what's happening with your projects today
              </p>
            </div>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
              <Zap className="h-4 w-4 mr-2" />
              Quick Actions
            </Button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Posts Card */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">Total Posts</p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                    {loading ? '...' : stats.posts}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-blue-600 dark:text-blue-400">
                    <TrendingUp className="h-3 w-3" />
                    <span>+12% from last month</span>
                  </div>
                </div>
                <div className="p-4 bg-blue-500 rounded-2xl shadow-lg">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Connections Card */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">Connections</p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                    {loading ? '...' : stats.connections}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-green-600 dark:text-green-400">
                    <TrendingUp className="h-3 w-3" />
                    <span>+8% from last month</span>
                  </div>
                </div>
                <div className="p-4 bg-green-500 rounded-2xl shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Projects Card */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Active Projects</p>
                  <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                    {loading ? '...' : stats.projects}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-purple-600 dark:text-purple-400">
                    <Briefcase className="h-3 w-3" />
                    <span>{stats.tasks.inProgress} in progress</span>
                  </div>
                </div>
                <div className="p-4 bg-purple-500 rounded-2xl shadow-lg">
                  <FolderKanban className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tasks Card */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-1">Tasks Completed</p>
                  <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                    {loading ? '...' : stats.tasks.completed}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-orange-600 dark:text-orange-400">
                    <CheckCircle className="h-3 w-3" />
                    <span>{stats.tasks.todo} remaining</span>
                  </div>
                </div>
                <div className="p-4 bg-orange-500 rounded-2xl shadow-lg">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left Column (2/3) */}
          <motion.div 
            className="lg:col-span-2 space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Post Creator */}
            <PostCreator onPostCreated={handlePostCreated} />

            {/* Recent Projects */}
            {recentProjects.length > 0 && (
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FolderKanban className="h-5 w-5 text-purple-600" />
                      Recent Projects
                    </CardTitle>
                    <Link href="/projects">
                      <Button variant="ghost" size="sm" className="text-sm">
                        View All
                        <ArrowUpRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentProjects.map((project, index) => (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link href={`/projects/${project.id}`}>
                        <Card className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all cursor-pointer border-l-4 border-l-purple-500">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                {project.name}
                              </h3>
                              <Badge variant="outline" className="text-xs">
                                <Users className="h-3 w-3 mr-1" />
                                {project.members}
                              </Badge>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">
                                  {project.tasksCompleted} / {project.totalTasks} tasks
                                </span>
                                <span className="font-medium text-purple-600 dark:text-purple-400">
                                  {project.progress}%
                                </span>
                              </div>
                              <Progress value={project.progress} className="h-2" />
                            </div>

                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>Updated {formatTimestamp(project.updatedAt)}</span>
                              </div>
                              <Button variant="ghost" size="sm" className="h-6 text-xs">
                                Open <ArrowUpRight className="h-3 w-3 ml-1" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Post Feed */}
            <PostFeed refreshTrigger={refreshTrigger} />
          </motion.div>

          {/* Sidebar - Right Column (1/3) */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {/* User Profile Card */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-16 w-16 ring-4 ring-white dark:ring-gray-700 shadow-lg">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl font-semibold">
                        {user.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-green-500 rounded-full border-4 border-white dark:border-gray-800"></div>
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{user.name}</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                    {user.role && (
                      <Badge variant="outline" className="mt-2">
                        <Code className="h-3 w-3 mr-1" />
                        {user.role}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center pt-4 border-t">
                  <div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {loading ? '-' : stats.posts}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Posts</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {loading ? '-' : stats.connections}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Network</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {loading ? '-' : stats.projects}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Projects</div>
                  </div>
                </div>
                <Link href={`/profile/${user.id}`}>
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
                    <User className="h-4 w-4 mr-2" />
                    View Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Task Progress */}
            {stats.tasks.total > 0 && (
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-orange-600" />
                    Task Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</span>
                      <span className="text-lg font-bold text-orange-600">
                        {stats.tasks.total > 0 
                          ? Math.round((stats.tasks.completed / stats.tasks.total) * 100) 
                          : 0}%
                      </span>
                    </div>
                    <Progress 
                      value={stats.tasks.total > 0 ? (stats.tasks.completed / stats.tasks.total) * 100 : 0} 
                      className="h-3"
                    />
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                        <span className="text-gray-700 dark:text-gray-300">Completed</span>
                      </div>
                      <span className="font-medium">{stats.tasks.completed}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
                        <span className="text-gray-700 dark:text-gray-300">In Progress</span>
                      </div>
                      <span className="font-medium">{stats.tasks.inProgress}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 bg-gray-300 rounded-full"></div>
                        <span className="text-gray-700 dark:text-gray-300">To Do</span>
                      </div>
                      <span className="font-medium">{stats.tasks.todo}</span>
                    </div>
                  </div>

                  <Link href="/projects">
                    <Button variant="outline" className="w-full mt-4">
                      <Calendar className="h-4 w-4 mr-2" />
                      View All Tasks
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Top Connections */}
            {topConnections.length > 0 && (
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-5 w-5 text-green-600" />
                      Your Network
                    </CardTitle>
                    <Link href="/connections">
                      <Button variant="ghost" size="sm" className="text-xs">
                        View All
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {topConnections.map((connection, index) => (
                    <motion.div
                      key={connection.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={connection.avatar} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                            {connection.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {connection.isOnline && (
                          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                          {connection.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {connection.role || 'Developer'}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Recent Activity */}
            {stats.recentActivity.length > 0 && (
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stats.recentActivity.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3 pb-3 border-b last:border-b-0 last:pb-0"
                    >
                      <div className={cn(
                        "p-2 rounded-lg",
                        getActivityColor(activity.type)
                      )}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {activity.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(activity.timestamp)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Quick Links */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  Quick Links
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/search">
                  <Button variant="ghost" className="w-full justify-start hover:bg-white/50 dark:hover:bg-gray-800/50">
                    <Users className="h-4 w-4 mr-2" />
                    Find Developers
                  </Button>
                </Link>
                <Link href="/projects">
                  <Button variant="ghost" className="w-full justify-start hover:bg-white/50 dark:hover:bg-gray-800/50">
                    <FolderKanban className="h-4 w-4 mr-2" />
                    My Projects
                  </Button>
                </Link>
                <Link href="/messages">
                  <Button variant="ghost" className="w-full justify-start hover:bg-white/50 dark:hover:bg-gray-800/50">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Messages
                  </Button>
                </Link>
                <Link href="/analytics">
                  <Button variant="ghost" className="w-full justify-start hover:bg-white/50 dark:hover:bg-gray-800/50">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Analytics
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

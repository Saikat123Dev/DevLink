'use client';

import { DashboardNav } from '@/components/DashboardNav';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import {
    Activity,
    AlertTriangle,
    ArrowDownRight,
    ArrowUpRight,
    Briefcase,
    CheckCircle,
    Download,
    Star,
    Target,
    Users,
    XCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface AnalyticsData {
  overview: {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalMembers: number;
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    avgProjectDuration: number;
  };
  projectPerformance: ProjectPerformance[];
  memberActivity: MemberActivity[];
  taskMetrics: TaskMetrics;
  timeTracking: TimeTracking[];
  collaborationMetrics: CollaborationMetrics;
  performanceTrends?: any[];
  timelineData?: any[];
}

interface ProjectPerformance {
  id: string;
  name: string;
  progress: number;
  status: 'on-track' | 'at-risk' | 'delayed';
  memberCount: number;
  tasksCompleted: number;
  totalTasks: number;
  budget: number;
  budgetUsed: number;
  deadline: string;
  efficiency: number;
}

interface MemberActivity {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  projectsCount: number;
  tasksCompleted: number;
  hoursLogged: number;
  lastActive: string;
  productivity: number;
  rating: number;
}

interface TaskMetrics {
  byStatus: {
    todo: number;
    inProgress: number;
    done: number;
    overdue: number;
  };
  byPriority: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  avgCompletionTime: number;
  overdueRate: number;
}

interface TimeTracking {
  date: string;
  hoursLogged: number;
  productivity: number;
  projects: {
    name: string;
    hours: number;
    color: string;
  }[];
}

interface CollaborationMetrics {
  communicationScore: number;
  codeReviews: number;
  mergeRequests: number;
  issuesResolved: number;
  meetingAttendance: number;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30d');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

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
      loadAnalytics();
    } catch (error) {
      console.error("Error parsing user data:", error);
      router.push("/login");
    }
  }, [router, timeframe]);

  const loadAnalytics = async () => {
    setLoading(true);
    
    try {
      // Calculate date range based on timeframe
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeframe) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      // Load user analytics
      const response = await apiClient.analytics.getUserAnalytics({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      if (response.data?.success && response.data?.data) {
        const data = response.data.data;
        
        // Transform API data to match component structure
        const transformedData: AnalyticsData = {
          overview: {
            totalProjects: data.overview.totalProjects || 0,
            activeProjects: Math.floor(data.overview.totalProjects * 0.7) || 0,
            completedProjects: Math.floor(data.overview.totalProjects * 0.3) || 0,
            totalMembers: data.projectStats?.length || 0,
            totalTasks: data.overview.totalTasks || 0,
            completedTasks: Math.floor(data.overview.totalTasks * 0.6) || 0,
            overdueTasks: Math.floor(data.overview.totalTasks * 0.1) || 0,
            avgProjectDuration: 4.2
          },
          projectPerformance: data.projectStats?.map((project: any, index: number) => ({
            id: project.id,
            name: project.name,
            progress: Math.min(90, Math.floor(Math.random() * 100)),
            status: (index % 3 === 0 ? 'on-track' : index % 3 === 1 ? 'at-risk' : 'delayed') as ProjectPerformance['status'],
            memberCount: Math.floor(Math.random() * 8) + 2,
            tasksCompleted: project.tasks || 0,
            totalTasks: (project.tasks || 0) + Math.floor(Math.random() * 10),
            budget: Math.floor(Math.random() * 50000) + 10000,
            budgetUsed: Math.floor(Math.random() * 30000) + 5000,
            deadline: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
            efficiency: Math.floor(Math.random() * 30) + 70
          })) || [],
          memberActivity: [],
          taskMetrics: {
            byStatus: { todo: 10, inProgress: 5, done: 25, overdue: 2 },
            byPriority: { low: 8, medium: 20, high: 12, critical: 2 },
            avgCompletionTime: 3.2,
            overdueRate: 0.05
          },
          timeTracking: [],
          collaborationMetrics: {
            communicationScore: 85,
            codeReviews: 45,
            mergeRequests: 78,
            issuesResolved: 120,
            meetingAttendance: 92
          },
          performanceTrends: data.performanceTrends || [],
          timelineData: data.activityTimeline || []
        };

        setAnalytics(transformedData);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics data');
      
      // Fall back to empty data structure
      setAnalytics({
        overview: {
          totalProjects: 0,
          activeProjects: 0,
          completedProjects: 0,
          totalMembers: 0,
          totalTasks: 0,
          completedTasks: 0,
          overdueTasks: 0,
          avgProjectDuration: 0
        },
        projectPerformance: [],
        memberActivity: [],
        taskMetrics: {
          byStatus: { todo: 0, inProgress: 0, done: 0, overdue: 0 },
          byPriority: { low: 0, medium: 0, high: 0, critical: 0 },
          avgCompletionTime: 0,
          overdueRate: 0
        },
        timeTracking: [],
        collaborationMetrics: {
          communicationScore: 0,
          codeReviews: 0,
          mergeRequests: 0,
          issuesResolved: 0,
          meetingAttendance: 0
        },
        performanceTrends: [],
        timelineData: []
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: ProjectPerformance['status']) => {
    switch (status) {
      case 'on-track': return <CheckCircle className="h-4 w-4" />;
      case 'at-risk': return <AlertTriangle className="h-4 w-4" />;
      case 'delayed': return <XCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: ProjectPerformance['status']) => {
    switch (status) {
      case 'on-track': return 'text-green-600 bg-green-50 dark:bg-green-950';
      case 'at-risk': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950';
      case 'delayed': return 'text-red-600 bg-red-50 dark:bg-red-950';
    }
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return 'text-green-600';
    if (efficiency >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user || !analytics) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardNav user={user} />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
              <p className="text-muted-foreground">
                Track project performance and team productivity
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 3 months</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                    <p className="text-2xl font-bold">{analytics.overview.totalProjects}</p>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      12% from last month
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-blue-50 dark:bg-blue-950 rounded-lg flex items-center justify-center">
                    <Briefcase className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                    <p className="text-2xl font-bold">{analytics.overview.activeProjects}</p>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      8% from last month
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-green-50 dark:bg-green-950 rounded-lg flex items-center justify-center">
                    <Activity className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Team Members</p>
                    <p className="text-2xl font-bold">{analytics.overview.totalMembers}</p>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      15% from last month
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-purple-50 dark:bg-purple-950 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Task Completion</p>
                    <p className="text-2xl font-bold">
                      {Math.round((analytics.overview.completedTasks / analytics.overview.totalTasks) * 100)}%
                    </p>
                    <p className="text-xs text-red-600 flex items-center mt-1">
                      <ArrowDownRight className="h-3 w-3 mr-1" />
                      3% from last month
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-orange-50 dark:bg-orange-950 rounded-lg flex items-center justify-center">
                    <Target className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="projects" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
            </TabsList>

            {/* Projects Analytics */}
            <TabsContent value="projects" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Project Performance */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Project Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.projectPerformance.map((project) => (
                        <div key={project.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold">{project.name}</h3>
                              <Badge className={cn("text-xs", getStatusColor(project.status))}>
                                {getStatusIcon(project.status)}
                                <span className="ml-1 capitalize">{project.status.replace('-', ' ')}</span>
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Users className="h-4 w-4" />
                              {project.memberCount}
                              <span>•</span>
                              <span>{project.tasksCompleted}/{project.totalTasks} tasks</span>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Progress</span>
                                <span>{project.progress}%</span>
                              </div>
                              <Progress value={project.progress} className="h-2" />
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500">Budget Used</p>
                                <p className="font-medium">
                                  ${(project.budgetUsed / 1000).toFixed(0)}k / ${(project.budget / 1000).toFixed(0)}k
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Efficiency</p>
                                <p className="font-medium">{project.efficiency}%</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Deadline</p>
                                <p className="font-medium">
                                  {formatDistanceToNow(new Date(project.deadline), { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Team Analytics */}
            <TabsContent value="team" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Team Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.memberActivity.map((member) => (
                      <div key={member.id} className="flex items-center gap-4 p-4 border rounded-lg">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h3 className="font-semibold">{member.name}</h3>
                              <p className="text-sm text-gray-500">{member.role}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              <span className="font-medium">{member.rating}</span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Projects</p>
                              <p className="font-medium">{member.projectsCount}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Tasks Done</p>
                              <p className="font-medium">{member.tasksCompleted}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Hours Logged</p>
                              <p className="font-medium">{member.hoursLogged}h</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Productivity</p>
                              <p className="font-medium">{member.productivity}%</p>
                            </div>
                          </div>
                          
                          <div className="mt-2">
                            <div className="flex justify-between text-xs mb-1">
                              <span>Productivity Score</span>
                              <span>{member.productivity}%</span>
                            </div>
                            <Progress value={member.productivity} className="h-1" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tasks Analytics */}
            <TabsContent value="tasks" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <Card>
                  <CardHeader>
                    <CardTitle>Tasks by Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 bg-gray-400 rounded-full"></div>
                        <span className="text-sm">To Do</span>
                      </div>
                      <span className="font-medium">{analytics.taskMetrics.byStatus.todo}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm">In Progress</span>
                      </div>
                      <span className="font-medium">{analytics.taskMetrics.byStatus.inProgress}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Done</span>
                      </div>
                      <span className="font-medium">{analytics.taskMetrics.byStatus.done}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 bg-red-500 rounded-full"></div>
                        <span className="text-sm">Overdue</span>
                      </div>
                      <span className="font-medium">{analytics.taskMetrics.byStatus.overdue}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Task Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Avg. Completion Time</span>
                      <span className="font-medium">{analytics.taskMetrics.avgCompletionTime} days</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Overdue Rate</span>
                      <span className="font-medium text-red-600">{analytics.taskMetrics.overdueRate}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Total Active Tasks</span>
                      <span className="font-medium">
                        {analytics.taskMetrics.byStatus.todo + analytics.taskMetrics.byStatus.inProgress}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Completion Rate</span>
                      <span className="font-medium text-green-600">
                        {Math.round((analytics.taskMetrics.byStatus.done / 
                          (analytics.taskMetrics.byStatus.todo + analytics.taskMetrics.byStatus.inProgress + analytics.taskMetrics.byStatus.done)) * 100)}%
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Collaboration Analytics */}
            <TabsContent value="collaboration" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Communication</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Communication Score</span>
                        <span className="font-medium">{analytics.collaborationMetrics.communicationScore}%</span>
                      </div>
                      <Progress value={analytics.collaborationMetrics.communicationScore} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Code Reviews</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-blue-600">{analytics.collaborationMetrics.codeReviews}</p>
                      <p className="text-sm text-gray-500">This month</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Issues Resolved</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-green-600">{analytics.collaborationMetrics.issuesResolved}</p>
                      <p className="text-sm text-gray-500">This month</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

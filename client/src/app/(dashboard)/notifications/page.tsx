'use client';

import { DashboardNav } from '@/components/DashboardNav';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import {
    Bell,
    BellRing,
    Check,
    CheckCheck,
    Clock,
    Filter,
    GitPullRequest,
    MessageSquare,
    Settings,
    Trash2,
    User,
    UserPlus,
    Users,
    X,
    Zap
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: 'connection_request' | 'project_invite' | 'comment' | 'mention' | 'system' | 'like' | 'follow';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
  avatar?: string;
  data?: {
    userId?: string;
    userName?: string;
    projectId?: string;
    projectName?: string;
    postId?: string;
    actionUrl?: string;
  };
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

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
      fetchNotifications();
    } catch (error) {
      console.error("Error parsing user data:", error);
      router.push("/login");
    }
  }, [router]);

  const fetchNotifications = () => {
    // Mock data - replace with actual API call
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'connection_request',
        title: 'New Connection Request',
        message: 'John Doe wants to connect with you. He\'s a Senior Frontend Developer at TechCorp.',
        isRead: false,
        priority: 'high',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        data: { 
          userId: 'user1', 
          userName: 'John Doe',
          actionUrl: '/connections' 
        }
      },
      {
        id: '2',
        type: 'project_invite',
        title: 'Project Invitation',
        message: 'You\'ve been invited to join "DevLink Mobile App" project as a Frontend Developer.',
        isRead: false,
        priority: 'high',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        data: { 
          projectId: 'proj1', 
          projectName: 'DevLink Mobile App',
          userName: 'Sarah Wilson',
          actionUrl: '/projects/proj1' 
        }
      },
      {
        id: '3',
        type: 'comment',
        title: 'New Comment',
        message: 'Alex commented on your post: "Great implementation! I love how you handled the state management."',
        isRead: false,
        priority: 'medium',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        data: { 
          postId: 'post1', 
          userName: 'Alex Chen',
          actionUrl: '/feed/post1' 
        }
      },
      {
        id: '4',
        type: 'like',
        title: 'Post Liked',
        message: 'Emily and 12 others liked your post about React performance optimization.',
        isRead: true,
        priority: 'low',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        data: { 
          postId: 'post2', 
          userName: 'Emily Davis',
          actionUrl: '/feed/post2' 
        }
      },
      {
        id: '5',
        type: 'system',
        title: 'Profile Verification Complete',
        message: 'Your developer profile has been successfully verified. You now have a verified badge.',
        isRead: true,
        priority: 'medium',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        data: { actionUrl: '/profile' }
      },
      {
        id: '6',
        type: 'follow',
        title: 'New Follower',
        message: 'Michael started following you. Check out his impressive portfolio!',
        isRead: true,
        priority: 'low',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        data: { 
          userId: 'user3', 
          userName: 'Michael Brown',
          actionUrl: '/profile/user3' 
        }
      }
    ];

    setTimeout(() => {
      setNotifications(mockNotifications);
      setLoading(false);
    }, 500);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'connection_request': return <UserPlus className="h-4 w-4" />;
      case 'project_invite': return <GitPullRequest className="h-4 w-4" />;
      case 'comment': return <MessageSquare className="h-4 w-4" />;
      case 'mention': return <User className="h-4 w-4" />;
      case 'like': return <Zap className="h-4 w-4" />;
      case 'follow': return <Users className="h-4 w-4" />;
      case 'system': return <Bell className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (type: Notification['type'], priority: Notification['priority']) => {
    const baseColors = {
      connection_request: 'from-blue-500/20 to-blue-600/10 border-blue-200/50 dark:border-blue-800/50',
      project_invite: 'from-purple-500/20 to-purple-600/10 border-purple-200/50 dark:border-purple-800/50',
      comment: 'from-green-500/20 to-green-600/10 border-green-200/50 dark:border-green-800/50',
      mention: 'from-orange-500/20 to-orange-600/10 border-orange-200/50 dark:border-orange-800/50',
      like: 'from-pink-500/20 to-pink-600/10 border-pink-200/50 dark:border-pink-800/50',
      follow: 'from-indigo-500/20 to-indigo-600/10 border-indigo-200/50 dark:border-indigo-800/50',
      system: 'from-gray-500/20 to-gray-600/10 border-gray-200/50 dark:border-gray-800/50'
    };
    
    const iconColors = {
      connection_request: 'text-blue-600 bg-blue-100 dark:bg-blue-900/50',
      project_invite: 'text-purple-600 bg-purple-100 dark:bg-purple-900/50',
      comment: 'text-green-600 bg-green-100 dark:bg-green-900/50',
      mention: 'text-orange-600 bg-orange-100 dark:bg-orange-900/50',
      like: 'text-pink-600 bg-pink-100 dark:bg-pink-900/50',
      follow: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/50',
      system: 'text-gray-600 bg-gray-100 dark:bg-gray-900/50'
    };

    return {
      card: baseColors[type] || baseColors.system,
      icon: iconColors[type] || iconColors.system
    };
  };

  const getPriorityBadge = (priority: Notification['priority']) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive" className="text-xs">High</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="text-xs">Medium</Badge>;
      case 'low':
        return <Badge variant="outline" className="text-xs">Low</Badge>;
      default:
        return null;
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    );
    toast.success('Notification marked as read');
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, isRead: true }))
    );
    toast.success('All notifications marked as read');
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => 
      prev.filter(n => n.id !== notificationId)
    );
    toast.success('Notification deleted');
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (activeTab) {
      case 'unread': return !notification.isRead;
      case 'read': return notification.isRead;
      default: return true;
    }
  });

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <DashboardNav user={user} />
      <main className="w-full py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                <BellRing className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Notifications
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Stay updated with your latest activities and connections
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm" className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              {notifications.some(n => !n.isRead) && (
                <Button 
                  onClick={markAllAsRead} 
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                >
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Mark all read
                </Button>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{notifications.length}</p>
                  </div>
                  <Bell className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Unread</p>
                    <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                      {notifications.filter(n => !n.isRead).length}
                    </p>
                  </div>
                  <div className="relative">
                    <Bell className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                    {notifications.filter(n => !n.isRead).length > 0 && (
                      <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">High Priority</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                      {notifications.filter(n => n.priority === 'high').length}
                    </p>
                  </div>
                  <Zap className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-96 bg-white dark:bg-gray-800 shadow-sm border">
            <TabsTrigger value="all" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
              All
              <Badge variant="secondary" className="ml-1 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                {notifications.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
              Unread
              {notifications.filter(n => !n.isRead).length > 0 && (
                <Badge variant="destructive" className="ml-1 animate-pulse">
                  {notifications.filter(n => !n.isRead).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="read" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
              Read
            </TabsTrigger>
          </TabsList>

          {/* Notifications List */}
          <TabsContent value={activeTab} className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i} className="animate-pulse border-0 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-full"></div>
                        <div className="flex-1 space-y-3">
                          <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded w-3/4"></div>
                          <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded w-1/2"></div>
                          <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded w-1/4"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredNotifications.length === 0 ? (
              <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
                <CardContent className="flex flex-col items-center justify-center p-16 text-center">
                  <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full mb-6">
                    <Bell className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="font-semibold text-xl mb-2 text-gray-900 dark:text-gray-100">
                    {activeTab === 'unread' ? 'No unread notifications' : 
                     activeTab === 'read' ? 'No read notifications' : 'No notifications'}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md">
                    {activeTab === 'unread' ? 'You\'re all caught up! Great job staying on top of things.' : 
                     'Notifications will appear here when you have activity. Connect with other developers to get started!'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-3">
                  {filteredNotifications.map((notification) => {
                    const colors = getNotificationColor(notification.type, notification.priority);
                    return (
                      <Card 
                        key={notification.id} 
                        className={cn(
                          "group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer border-0 shadow-lg overflow-hidden",
                          "bg-gradient-to-r", colors.card,
                          !notification.isRead && "ring-2 ring-blue-200 dark:ring-blue-800"
                        )}
                        onClick={() => {
                          if (!notification.isRead) {
                            markAsRead(notification.id);
                          }
                          if (notification.data?.actionUrl) {
                            router.push(notification.data.actionUrl);
                          }
                        }}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            {/* Avatar or Icon */}
                            <div className="relative">
                              {notification.avatar ? (
                                <Avatar className="h-12 w-12 ring-2 ring-white dark:ring-gray-800 shadow-lg">
                                  <AvatarImage src={notification.avatar} />
                                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                                    {notification.data?.userName?.split(' ').map(n => n[0]).join('') || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                              ) : (
                                <div className={cn(
                                  "flex items-center justify-center h-12 w-12 rounded-full shadow-lg",
                                  colors.icon
                                )}>
                                  {getNotificationIcon(notification.type)}
                                </div>
                              )}
                              {!notification.isRead && (
                                <div className="absolute -top-1 -right-1 h-4 w-4 bg-blue-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse" />
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4 mb-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className={cn(
                                      "font-semibold text-gray-900 dark:text-gray-100",
                                      !notification.isRead && "font-bold"
                                    )}>
                                      {notification.title}
                                    </h4>
                                    {getPriorityBadge(notification.priority)}
                                  </div>
                                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                                    {notification.message}
                                  </p>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {!notification.isRead && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        markAsRead(notification.id);
                                      }}
                                      className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                                    >
                                      <Check className="h-4 w-4 text-blue-600" />
                                    </Button>
                                  )}
                                  
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteNotification(notification.id);
                                    }}
                                    className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/50"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              </div>

                              <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                </p>

                                {/* Action buttons for specific notification types */}
                                {notification.type === 'connection_request' && !notification.isRead && (
                                  <div className="flex items-center gap-2">
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="h-7 px-3 text-xs hover:bg-red-50 hover:border-red-200 hover:text-red-700"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        markAsRead(notification.id);
                                        toast.success('Connection request declined');
                                      }}
                                    >
                                      <X className="h-3 w-3 mr-1" />
                                      Decline
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      className="h-7 px-3 text-xs bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        markAsRead(notification.id);
                                        toast.success('Connection request accepted');
                                      }}
                                    >
                                      <Check className="h-3 w-3 mr-1" />
                                      Accept
                                    </Button>
                                  </div>
                                )}

                                {notification.type === 'project_invite' && !notification.isRead && (
                                  <div className="flex items-center gap-2">
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="h-7 px-3 text-xs hover:bg-red-50 hover:border-red-200 hover:text-red-700"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        markAsRead(notification.id);
                                        toast.success('Project invitation declined');
                                      }}
                                    >
                                      <X className="h-3 w-3 mr-1" />
                                      Decline
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      className="h-7 px-3 text-xs bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        markAsRead(notification.id);
                                        toast.success('Project invitation accepted');
                                      }}
                                    >
                                      <Check className="h-3 w-3 mr-1" />
                                      Accept
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

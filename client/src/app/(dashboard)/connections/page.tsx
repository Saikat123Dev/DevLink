'use client';

import { DashboardNav } from '@/components/DashboardNav';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiClient } from '@/lib/api-client';
import { formatDistanceToNow } from 'date-fns';
import { Clock, MapPin, User, UserCheck, UserMinus, Users, UserX } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Skill {
  name: string;
  level: 'PRIMARY' | 'SECONDARY';
}

interface ConnectedUser {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
  bio?: string;
  location?: string;
  skills: Skill[];
}

interface Connection {
  id: string;
  user: ConnectedUser;
  connectedAt: string;
  status: string;
}

interface ConnectionRequest {
  id: string;
  requester?: ConnectedUser;
  receiver?: ConnectedUser;
  createdAt: string;
  status: string;
}

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<ConnectionRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const router = useRouter();

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
      fetchConnections();
      fetchConnectionRequests();
    } catch (error) {
      console.error("Error parsing user data:", error);
      router.push("/login");
    }
  }, [router]);

  const fetchConnections = async () => {
    try {
      const response = await apiClient.get('/connections');
      if (response.data.success) {
        setConnections(response.data.data.connections);
      }
    } catch (error: any) {
      console.error('Failed to fetch connections:', error);
      toast.error('Failed to load connections');
    }
  };

  const fetchConnectionRequests = async () => {
    try {
      const response = await apiClient.get('/connections/requests');
      if (response.data.success) {
        setIncomingRequests(response.data.data.incoming);
        setOutgoingRequests(response.data.data.outgoing);
      }
    } catch (error: any) {
      console.error('Failed to fetch connection requests:', error);
      toast.error('Failed to load connection requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      setProcessingRequests(prev => new Set(prev).add(requestId));
      
      await apiClient.put(`/connections/request/${requestId}/accept`);
      toast.success('Connection request accepted');
      
      // Refresh data
      fetchConnections();
      fetchConnectionRequests();
      
    } catch (error: any) {
      console.error('Failed to accept request:', error);
      toast.error(error.response?.data?.message || 'Failed to accept request');
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      setProcessingRequests(prev => new Set(prev).add(requestId));
      
      await apiClient.put(`/connections/request/${requestId}/reject`);
      toast.success('Connection request rejected');
      
      // Refresh requests
      fetchConnectionRequests();
      
    } catch (error: any) {
      console.error('Failed to reject request:', error);
      toast.error(error.response?.data?.message || 'Failed to reject request');
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleRemoveConnection = async (connectionId: string) => {
    if (!confirm('Are you sure you want to remove this connection?')) {
      return;
    }

    try {
      await apiClient.delete(`/connections/${connectionId}`);
      toast.success('Connection removed');
      
      // Remove from local state
      setConnections(prev => prev.filter(conn => conn.id !== connectionId));
      
    } catch (error: any) {
      console.error('Failed to remove connection:', error);
      toast.error(error.response?.data?.message || 'Failed to remove connection');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <DashboardNav user={user} />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="space-y-6">
              <h1 className="text-3xl font-bold">Connections</h1>
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
          <h1 className="text-3xl font-bold">Connections</h1>
          <p className="text-muted-foreground">
            Manage your professional network
          </p>
        </div>
        <Button asChild>
          <Link href="/discover">
            <Users className="h-4 w-4 mr-2" />
            Discover Developers
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="connections" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="connections">
            My Connections ({connections.length})
          </TabsTrigger>
          <TabsTrigger value="incoming">
            Requests ({incomingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="outgoing">
            Sent ({outgoingRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="space-y-6">
          {connections.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Users className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Connections Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start building your network by connecting with other developers
                </p>
                <Button asChild>
                  <Link href="/discover">
                    Discover Developers
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {connections.map((connection) => (
                <Card key={connection.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={connection.user.avatar} />
                        <AvatarFallback>
                          <User className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold">{connection.user.name}</h3>
                        {connection.user.role && (
                          <p className="text-sm text-muted-foreground">{connection.user.role}</p>
                        )}
                        {connection.user.location && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {connection.user.location}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {connection.user.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {connection.user.bio}
                      </p>
                    )}
                    
                    {connection.user.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {connection.user.skills.slice(0, 3).map((skill, index) => (
                          <Badge 
                            key={index} 
                            variant={skill.level === 'PRIMARY' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {skill.name}
                          </Badge>
                        ))}
                        {connection.user.skills.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{connection.user.skills.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                      Connected {formatDistanceToNow(new Date(connection.connectedAt), { addSuffix: true })}
                    </p>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        View Profile
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleRemoveConnection(connection.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="incoming" className="space-y-6">
          {incomingRequests.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Clock className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Pending Requests</h3>
                <p className="text-muted-foreground">
                  You don't have any incoming connection requests
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {incomingRequests.map((request) => (
                <Card key={request.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={request.requester?.avatar} />
                        <AvatarFallback>
                          <User className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold">{request.requester?.name}</h3>
                        {request.requester?.role && (
                          <p className="text-sm text-muted-foreground">{request.requester.role}</p>
                        )}
                        {request.requester?.location && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {request.requester.location}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {request.requester?.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {request.requester.bio}
                      </p>
                    )}
                    
                    {request.requester?.skills && request.requester.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {request.requester.skills.slice(0, 3).map((skill, index) => (
                          <Badge 
                            key={index} 
                            variant={skill.level === 'PRIMARY' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {skill.name}
                          </Badge>
                        ))}
                        {request.requester.skills.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{request.requester.skills.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                      Sent {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                    </p>

                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleAcceptRequest(request.id)}
                        disabled={processingRequests.has(request.id)}
                        className="flex-1"
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        Accept
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => handleRejectRequest(request.id)}
                        disabled={processingRequests.has(request.id)}
                        className="flex-1"
                      >
                        <UserX className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="outgoing" className="space-y-6">
          {outgoingRequests.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Clock className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Sent Requests</h3>
                <p className="text-muted-foreground">
                  You haven't sent any connection requests
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {outgoingRequests.map((request) => (
                <Card key={request.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={request.receiver?.avatar} />
                        <AvatarFallback>
                          <User className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold">{request.receiver?.name}</h3>
                        {request.receiver?.role && (
                          <p className="text-sm text-muted-foreground">{request.receiver.role}</p>
                        )}
                        {request.receiver?.location && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {request.receiver.location}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {request.receiver?.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {request.receiver.bio}
                      </p>
                    )}

                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Sent {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                      </span>
                    </div>

                    <Button variant="outline" className="w-full" disabled>
                      Request Sent
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}

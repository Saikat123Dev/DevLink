'use client';

import { DashboardNav } from '@/components/DashboardNav';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiClient } from '@/lib/api-client';
import { formatDistanceToNow } from 'date-fns';
import {
    ArrowLeft,
    CheckCircle2,
    Clock,
    Code2,
    Inbox,
    Loader2,
    Mail,
    User,
    Users,
    X,
    XCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface ProjectInvitation {
  id: string;
  projectId: string;
  developerId: string;
  role: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  message?: string;
  sentAt: string;
  respondedAt?: string;
  project: {
    id: string;
    name: string;
    description?: string;
    githubUrl?: string;
    owner: {
      id: string;
      name: string;
      avatar?: string;
    };
    _count: {
      members: number;
      tasks: number;
    };
  };
}

export default function InvitationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [invitations, setInvitations] = useState<ProjectInvitation[]>([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [processingInvites, setProcessingInvites] = useState<Set<string>>(new Set());

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
      fetchInvitations();
    } catch (error) {
      console.error("Error parsing user data:", error);
      router.push("/login");
    }
  }, [router]);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/projects/invitations/received');
      if (response.data.success) {
        setInvitations(response.data.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch invitations:', error);
      toast.error('Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToInvitation = async (invitationId: string, response: 'ACCEPTED' | 'DECLINED') => {
    setProcessingInvites(prev => new Set(prev).add(invitationId));
    
    try {
      const result = await apiClient.patch(`/projects/invitations/${invitationId}/respond`, {
        status: response
      });

      if (result.data.success) {
        toast.success(response === 'ACCEPTED' ? 'Invitation accepted!' : 'Invitation declined');
        await fetchInvitations(); // Refresh the list
      }
    } catch (error: any) {
      console.error('Failed to respond to invitation:', error);
      toast.error(error.response?.data?.message || 'Failed to respond to invitation');
    } finally {
      setProcessingInvites(prev => {
        const newSet = new Set(prev);
        newSet.delete(invitationId);
        return newSet;
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      FRONTEND: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      BACKEND: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      FULLSTACK: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      DESIGNER: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
      DEVOPS: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
      MOBILE: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300',
      TESTER: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    };
    return colors[role] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'ACCEPTED':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Accepted</Badge>;
      case 'DECLINED':
        return <Badge variant="outline" className="text-red-600 border-red-600"><XCircle className="h-3 w-3 mr-1" />Declined</Badge>;
      default:
        return null;
    }
  };

  const filteredInvitations = invitations.filter(inv => {
    if (activeTab === 'all') return true;
    return inv.status === activeTab.toUpperCase();
  });

  const pendingCount = invitations.filter(inv => inv.status === 'PENDING').length;
  const acceptedCount = invitations.filter(inv => inv.status === 'ACCEPTED').length;
  const declinedCount = invitations.filter(inv => inv.status === 'DECLINED').length;

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
      
      <main className="w-full py-8 px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Mail className="h-8 w-8" />
                Project Invitations
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your project collaboration invitations
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {pendingCount} Pending
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-3xl font-bold mt-1">{pendingCount}</p>
                </div>
                <Clock className="h-10 w-10 text-yellow-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Accepted</p>
                  <p className="text-3xl font-bold mt-1">{acceptedCount}</p>
                </div>
                <CheckCircle2 className="h-10 w-10 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Declined</p>
                  <p className="text-3xl font-bold mt-1">{declinedCount}</p>
                </div>
                <XCircle className="h-10 w-10 text-red-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invitations List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Invitations</CardTitle>
            <CardDescription>
              Review and respond to project collaboration requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">
                  All ({invitations.length})
                </TabsTrigger>
                <TabsTrigger value="pending">
                  Pending ({pendingCount})
                </TabsTrigger>
                <TabsTrigger value="accepted">
                  Accepted ({acceptedCount})
                </TabsTrigger>
                <TabsTrigger value="declined">
                  Declined ({declinedCount})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredInvitations.length === 0 ? (
                  <div className="text-center py-12">
                    <Inbox className="h-16 w-16 mx-auto text-muted-foreground opacity-50 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Invitations</h3>
                    <p className="text-muted-foreground">
                      {activeTab === 'all' 
                        ? "You don't have any project invitations yet"
                        : `No ${activeTab} invitations`}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredInvitations.map((invitation) => {
                      const isProcessing = processingInvites.has(invitation.id);
                      
                      return (
                        <Card key={invitation.id} className="overflow-hidden">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-4 flex-1">
                                {/* Project Owner Avatar */}
                                <Avatar className="h-12 w-12">
                                  <AvatarImage src={invitation.project.owner.avatar} />
                                  <AvatarFallback>
                                    <User className="h-6 w-6" />
                                  </AvatarFallback>
                                </Avatar>

                                <div className="flex-1 space-y-2">
                                  {/* Header */}
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <h3 className="font-semibold text-lg flex items-center gap-2">
                                        {invitation.project.name}
                                        <Code2 className="h-4 w-4 text-muted-foreground" />
                                      </h3>
                                      <p className="text-sm text-muted-foreground">
                                        Invited by <span className="font-medium">{invitation.project.owner.name}</span>
                                      </p>
                                    </div>
                                    {getStatusBadge(invitation.status)}
                                  </div>

                                  {/* Description */}
                                  {invitation.project.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                      {invitation.project.description}
                                    </p>
                                  )}

                                  {/* Message */}
                                  {invitation.message && (
                                    <div className="bg-muted/50 rounded-lg p-3 border">
                                      <p className="text-sm italic">"{invitation.message}"</p>
                                    </div>
                                  )}

                                  {/* Details */}
                                  <div className="flex items-center gap-4 text-sm">
                                    <Badge className={getRoleBadgeColor(invitation.role)}>
                                      {invitation.role}
                                    </Badge>
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                      <Users className="h-4 w-4" />
                                      <span>{invitation.project._count.members} members</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                      <Clock className="h-4 w-4" />
                                      <span>{formatDistanceToNow(new Date(invitation.sentAt), { addSuffix: true })}</span>
                                    </div>
                                  </div>

                                  {/* Actions */}
                                  {invitation.status === 'PENDING' && (
                                    <div className="flex items-center gap-2 pt-2">
                                      <Button
                                        size="sm"
                                        onClick={() => handleRespondToInvitation(invitation.id, 'ACCEPTED')}
                                        disabled={isProcessing}
                                        className="bg-green-600 hover:bg-green-700"
                                      >
                                        {isProcessing ? (
                                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                          <CheckCircle2 className="h-4 w-4 mr-2" />
                                        )}
                                        Accept
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleRespondToInvitation(invitation.id, 'DECLINED')}
                                        disabled={isProcessing}
                                        className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                                      >
                                        <X className="h-4 w-4 mr-2" />
                                        Decline
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        asChild
                                      >
                                        <Link href={`/projects/${invitation.projectId}`}>
                                          View Project
                                        </Link>
                                      </Button>
                                    </div>
                                  )}

                                  {invitation.status === 'ACCEPTED' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      asChild
                                    >
                                      <Link href={`/projects/${invitation.projectId}`}>
                                        Go to Project
                                      </Link>
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

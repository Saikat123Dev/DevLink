'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
    AlertCircle,
    Check,
    CheckCircle,
    MapPin,
    Search,
    Send,
    Star,
    UserPlus,
    Users,
    XCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Developer {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  location?: string;
  skills: string[];
  rating: number;
  isOnline: boolean;
  bio?: string;
  experience: string;
  isConnected: boolean;
}

interface ProjectInvitation {
  id: string;
  projectId: string;
  developerId: string;
  role: 'FRONTEND' | 'BACKEND' | 'FULLSTACK' | 'DESIGNER' | 'DEVOPS' | 'MOBILE' | 'TESTER';
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  sentAt: string;
  respondedAt?: string;
}

interface InviteDevelopersModalProps {
  projectId: string;
  projectName: string;
  children: React.ReactNode;
  onInvitesSent?: () => void;
}

export function InviteDevelopersModal({ 
  projectId, 
  projectName, 
  children, 
  onInvitesSent 
}: InviteDevelopersModalProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDevelopers, setSelectedDevelopers] = useState<string[]>([]);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [activeTab, setActiveTab] = useState('search');
  const [pendingInvitations, setPendingInvitations] = useState<ProjectInvitation[]>([]);
  const [skillFilter, setSkillFilter] = useState('');

  useEffect(() => {
    if (open) {
      // Load initial developers with a generic search or skip initial load
      if (searchQuery) {
        loadDevelopers();
      }
      loadPendingInvitations();
      setInviteMessage(`Hi! I'd like to invite you to collaborate on "${projectName}". Looking forward to working together!`);
    }
  }, [open, projectName]);

  // Reload developers when search query changes
  useEffect(() => {
    if (open) {
      const debounceTimer = setTimeout(() => {
        loadDevelopers();
      }, searchQuery ? 500 : 0); // No delay for empty search

      return () => clearTimeout(debounceTimer);
    }
  }, [searchQuery, open]);

  const loadDevelopers = async () => {
    setLoading(true);
    try {
      // Search for developers using the search API
      const response = await apiClient.search.search({
        q: searchQuery || '',
        type: 'developers',
        page: 1,
        limit: 50
      });
      
      if (response.data?.success && response.data?.data?.developers) {
        setDevelopers(response.data.data.developers);
      }
    } catch (error) {
      console.error('Error loading developers:', error);
      toast.error('Failed to load developers');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingInvitations = async () => {
    try {
      const response = await apiClient.projectInvitations.getProjectInvitations(projectId);
      if (response.data?.success && response.data?.data) {
        setPendingInvitations(response.data.data);
      }
    } catch (error) {
      console.error('Error loading pending invitations:', error);
    }
  };

  const filteredDevelopers = developers.filter(dev => {
    const matchesSearch = (dev.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (dev.role || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (dev.skills || []).some(skill => (skill || '').toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesSkill = !skillFilter || 
                        (dev.skills || []).some(skill => 
                          (skill || '').toLowerCase().includes(skillFilter.toLowerCase())
                        );

    return matchesSearch && matchesSkill;
  });

  const toggleDeveloper = (developerId: string) => {
    setSelectedDevelopers(prev => 
      prev.includes(developerId) 
        ? prev.filter(id => id !== developerId)
        : [...prev, developerId]
    );
  };

  const sendInvitations = async () => {
    if (selectedDevelopers.length === 0) {
      toast.error('Please select at least one developer');
      return;
    }

    if (!selectedRole) {
      toast.error('Please select a role for the invitation');
      return;
    }

    setLoading(true);
    
    try {
      const response = await apiClient.projectInvitations.sendInvitations(projectId, {
        developerIds: selectedDevelopers,
        role: selectedRole,
        message: inviteMessage
      });

      if (response.data?.success) {
        toast.success(`Sent ${selectedDevelopers.length} invitation(s) successfully!`);
        setSelectedDevelopers([]);
        setInviteMessage('');
        setSelectedRole('');
        setOpen(false);
        
        // Reload pending invitations
        loadPendingInvitations();
        
        if (onInvitesSent) {
          onInvitesSent();
        }
      } else {
        toast.error(response.data?.error?.message || 'Failed to send invitations');
      }
    } catch (error: any) {
      console.error('Error sending invitations:', error);
      toast.error(error.message || 'Failed to send invitations');
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    const colors = {
      FRONTEND: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      BACKEND: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      FULLSTACK: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      DESIGNER: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      DEVOPS: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      MOBILE: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      TESTER: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  const getStatusIcon = (status: ProjectInvitation['status']) => {
    switch (status) {
      case 'pending': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'accepted': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'declined': return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Developers to {projectName}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search">Find Developers</TabsTrigger>
            <TabsTrigger value="invitations">
              Pending Invitations
              {pendingInvitations.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {pendingInvitations.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="flex-1 flex flex-col space-y-4">
            {/* Search and Filters */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search developers by name, role, or skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Input
                placeholder="Filter by skill..."
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
                className="w-48"
              />
            </div>

            {/* Developer List */}
            <ScrollArea className="flex-1">
              <div className="space-y-3">
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  filteredDevelopers.map((developer) => (
                    <Card 
                      key={developer.id} 
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        selectedDevelopers.includes(developer.id) && "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950"
                      )}
                      onClick={() => toggleDeveloper(developer.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="relative">
                            <Avatar className="h-12 w-12">
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
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold">{developer.name}</h3>
                                  {developer.isConnected && (
                                    <Badge variant="secondary" className="text-xs">Connected</Badge>
                                  )}
                                  <div className="flex items-center gap-1">
                                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                    <span className="text-sm text-gray-600">{developer.rating}</span>
                                  </div>
                                </div>
                                
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                  {developer.role} • {developer.experience}
                                </p>
                                
                                {developer.location && (
                                  <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
                                    <MapPin className="h-3 w-3" />
                                    {developer.location}
                                  </p>
                                )}
                                
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                                  {developer.bio}
                                </p>
                                
                                <div className="flex flex-wrap gap-1">
                                  {developer.skills.slice(0, 4).map((skill) => (
                                    <Badge key={skill} variant="outline" className="text-xs">
                                      {skill}
                                    </Badge>
                                  ))}
                                  {developer.skills.length > 4 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{developer.skills.length - 4} more
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center">
                                {selectedDevelopers.includes(developer.id) ? (
                                  <div className="h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center">
                                    <Check className="h-4 w-4 text-white" />
                                  </div>
                                ) : (
                                  <div className="h-6 w-6 border-2 border-gray-300 rounded-full"></div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Invitation Form */}
            {selectedDevelopers.length > 0 && (
              <div className="border-t pt-4 space-y-4">
                <div className="flex gap-4">
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FRONTEND">Frontend Developer</SelectItem>
                      <SelectItem value="BACKEND">Backend Developer</SelectItem>
                      <SelectItem value="FULLSTACK">Fullstack Developer</SelectItem>
                      <SelectItem value="DESIGNER">UI/UX Designer</SelectItem>
                      <SelectItem value="DEVOPS">DevOps Engineer</SelectItem>
                      <SelectItem value="MOBILE">Mobile Developer</SelectItem>
                      <SelectItem value="TESTER">QA Tester</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {selectedDevelopers.length} selected
                  </Badge>
                </div>

                <Textarea
                  placeholder="Add a personal message to your invitation..."
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  rows={3}
                />

                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedDevelopers([])}
                  >
                    Clear Selection
                  </Button>
                  <Button 
                    onClick={sendInvitations} 
                    disabled={loading || !selectedRole}
                    className="flex items-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {loading ? 'Sending...' : `Send ${selectedDevelopers.length} Invitation(s)`}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="invitations" className="flex-1">
            <ScrollArea className="h-full">
              <div className="space-y-3">
                {pendingInvitations.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="font-medium text-lg mb-2">No pending invitations</h3>
                    <p className="text-gray-500">Invitations you send will appear here</p>
                  </div>
                ) : (
                  pendingInvitations.map((invitation) => {
                    const developer = developers.find(d => d.id === invitation.developerId);
                    return (
                      <Card key={invitation.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={developer?.avatar} />
                                <AvatarFallback>
                                  {developer?.name.split(' ').map(n => n[0]).join('') || '??'}
                                </AvatarFallback>
                              </Avatar>
                              
                              <div>
                                <h3 className="font-medium">{developer?.name || 'Unknown Developer'}</h3>
                                <div className="flex items-center gap-2">
                                  <Badge className={getRoleColor(invitation.role)}>
                                    {invitation.role}
                                  </Badge>
                                  <span className="text-sm text-gray-500">
                                    Sent {new Date(invitation.sentAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {getStatusIcon(invitation.status)}
                              <span className="text-sm font-medium capitalize">
                                {invitation.status}
                              </span>
                            </div>
                          </div>
                          
                          {invitation.message && (
                            <p className="text-sm text-gray-600 mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                              "{invitation.message}"
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { apiClient } from '@/lib/api';
import {
    Calendar,
    Crown,
    Mail,
    MapPin,
    MoreVertical,
    Shield,
    User,
    UserMinus,
    UserPlus,
    Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { InviteDevelopersModal } from './InviteDevelopersModal';

interface ProjectMember {
  id: string;
  userId: string;
  projectId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
    bio?: string;
    skills: string[];
    location?: string;
    isOnline: boolean;
    lastActive: string;
    createdAt: string;
  };
}

interface PendingInvitation {
  id: string;
  projectId: string;
  inviterId: string;
  inviteeId: string;
  role: 'FRONTEND' | 'BACKEND' | 'FULLSTACK' | 'DESIGNER' | 'DEVOPS' | 'MOBILE' | 'TESTER';
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  message?: string;
  createdAt: string;
  updatedAt: string;
  invitee: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
  };
}

interface ProjectMembersProps {
  projectId: string;
  projectName: string;
  currentUserId: string;
  isOwner?: boolean;
  isAdmin?: boolean;
}

export function ProjectMembers({ 
  projectId, 
  projectName, 
  currentUserId, 
  isOwner = false,
  isAdmin = false 
}: ProjectMembersProps) {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<ProjectMember | null>(null);
  const [showMemberModal, setShowMemberModal] = useState(false);

  useEffect(() => {
    loadMembers();
    if (isOwner || isAdmin) {
      loadPendingInvitations();
    }
  }, [projectId]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const response = await apiClient.projects.getMembers(projectId);
      if (response.data.success) {
        setMembers(response.data.data);
      } else {
        toast.error('Failed to load project members');
      }
    } catch (error) {
      console.error('Error loading members:', error);
      toast.error('Failed to load project members');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingInvitations = async () => {
    try {
      const response = await apiClient.projectInvitations.getProjectInvitations(projectId);
      if (response.data.success) {
        const pending = response.data.data.filter((inv: PendingInvitation) => inv.status === 'PENDING');
        setPendingInvitations(pending);
      }
    } catch (error) {
      console.error('Error loading pending invitations:', error);
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    try {
      const response = await apiClient.projectInvitations.cancelInvitation(invitationId);
      if (response.data.success) {
        setPendingInvitations(prev => prev.filter(inv => inv.id !== invitationId));
        toast.success('Invitation cancelled');
      } else {
        toast.error('Failed to cancel invitation');
      }
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast.error('Failed to cancel invitation');
    }
  };

  const updateMemberRole = async (memberId: string, newRole: ProjectMember['role']) => {
    try {
      const response = await apiClient.projects.updateMemberRole(projectId, memberId, newRole);
      if (response.data.success) {
        setMembers(prev => 
          prev.map(member => 
            member.id === memberId 
              ? { ...member, role: newRole }
              : member
          )
        );
        toast.success('Member role updated successfully');
      } else {
        toast.error('Failed to update member role');
      }
    } catch (error) {
      console.error('Error updating member role:', error);
      toast.error('Failed to update member role');
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      const response = await apiClient.projects.removeMember(projectId, memberId);
      if (response.data.success) {
        setMembers(prev => prev.filter(member => member.id !== memberId));
        toast.success('Member removed from project');
      } else {
        toast.error('Failed to remove member');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };

  const getRoleIcon = (role: ProjectMember['role']) => {
    switch (role) {
      case 'OWNER': return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'ADMIN': return <Shield className="h-4 w-4 text-blue-500" />;
      case 'MEMBER': return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleColor = (userRole: string | null | undefined) => {
    if (!userRole) {
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
    
    const colors: { [key: string]: string } = {
      frontend: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      backend: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      fullstack: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      designer: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      devops: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      mobile: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      tester: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      developer: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    };
    return colors[userRole.toLowerCase()] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  const canManageMember = (member: ProjectMember) => {
    if (member.userId === currentUserId) return false;
    if (isOwner) return true;
    if (isAdmin && member.role === 'MEMBER') return true;
    return false;
  };

  const formatLastActive = (date: string) => {
    const now = new Date();
    const lastActive = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Project Members ({members.length})
          </CardTitle>
          
          {(isOwner || isAdmin) && (
            <InviteDevelopersModal 
              projectId={projectId} 
              projectName={projectName}
              onInvitesSent={() => {
                loadMembers();
                loadPendingInvitations();
              }}
            >
              <Button size="sm" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Invite Developers
              </Button>
            </InviteDevelopersModal>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border rounded-lg animate-pulse">
                <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <div 
                key={member.id}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.user.avatar} />
                    <AvatarFallback>
                      {member.user.name.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  {member.user.isOnline && (
                    <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium">{member.user.name}</h3>
                    {getRoleIcon(member.role)}
                    {member.userId === currentUserId && (
                      <Badge variant="secondary" className="text-xs">You</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getRoleColor(member.user?.role)}>
                      {member.user?.role || 'Developer'}
                    </Badge>
                    <span className="text-sm text-gray-500 capitalize">{member.role.toLowerCase()}</span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Joined {new Date(member.joinedAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>
                      {member.user.isOnline ? 'Online' : `Last seen ${formatLastActive(member.user.lastActive)}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedMember(member);
                      setShowMemberModal(true);
                    }}
                  >
                    View Profile
                  </Button>
                  
                  {canManageMember(member) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {isOwner && member.role !== 'OWNER' && (
                          <>
                            <DropdownMenuItem onClick={() => updateMemberRole(member.userId, 'ADMIN')}>
                              <Shield className="h-4 w-4 mr-2" />
                              Make Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateMemberRole(member.userId, 'MEMBER')}>
                              <User className="h-4 w-4 mr-2" />
                              Make Member
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem 
                          onClick={() => removeMember(member.userId)}
                          className="text-red-600"
                        >
                          <UserMinus className="h-4 w-4 mr-2" />
                          Remove from Project
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pending Invitations Section */}
        {(isOwner || isAdmin) && pendingInvitations.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-medium mb-4 flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <Mail className="h-4 w-4" />
              Pending Invitations ({pendingInvitations.length})
            </h3>
            <div className="space-y-3">
              {pendingInvitations.map((invitation) => (
                <div 
                  key={invitation.id}
                  className="flex items-center gap-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={invitation.invitee.avatar} />
                    <AvatarFallback>
                      {invitation.invitee.name.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{invitation.invitee.name}</h4>
                      <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300">
                        Pending
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>{invitation.invitee.email}</span>
                      <span>•</span>
                      <span>Invited as {invitation.role.toLowerCase()}</span>
                      <span>•</span>
                      <span>{new Date(invitation.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => cancelInvitation(invitation.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Cancel
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Member Detail Modal */}
        <Dialog open={showMemberModal} onOpenChange={setShowMemberModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Member Details</DialogTitle>
            </DialogHeader>
            
            {selectedMember && (
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={selectedMember.user.avatar} />
                      <AvatarFallback className="text-lg">
                        {selectedMember.user.name.split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    {selectedMember.user.isOnline && (
                      <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-xl font-semibold">{selectedMember.user.name}</h2>
                      {getRoleIcon(selectedMember.role)}
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={getRoleColor(selectedMember.user?.role)}>
                        {selectedMember.user?.role || 'Developer'}
                      </Badge>
                      <span className="text-sm text-gray-500 capitalize">{selectedMember.role.toLowerCase()}</span>
                    </div>
                    
                    {selectedMember.user.bio && (
                      <p className="text-gray-600 dark:text-gray-400">{selectedMember.user.bio}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Contact
                    </h3>
                    <p className="text-sm text-gray-600">{selectedMember.user.email}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Joined Project
                    </h3>
                    <p className="text-sm text-gray-600">
                      {new Date(selectedMember.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedMember.user.skills?.map((skill: string) => (
                      <Badge key={skill} variant="outline">
                        {skill}
                      </Badge>
                    )) || <span className="text-sm text-gray-500">No skills listed</span>}
                  </div>
                </div>

                {selectedMember.user.location && (
                  <div>
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Location
                    </h3>
                    <p className="text-sm text-gray-600">{selectedMember.user.location}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

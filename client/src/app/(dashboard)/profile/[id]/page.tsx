'use client';

import { ActivityItem, ActivityTimeline } from '@/components/ActivityTimeline';
import { AvailabilityBadge, AvailabilityStatus } from '@/components/AvailabilityBadge';
import { AvatarUpload } from '@/components/AvatarUpload';
import { DashboardNav } from '@/components/DashboardNav';
import { ProfileAchievements } from '@/components/ProfileAchievements';
import { ProfileCompleteness } from '@/components/ProfileCompleteness';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api-client';
import { formatDistanceToNow } from 'date-fns';
import {
  Award,
  Calendar,
  Edit,
  ExternalLink,
  FileText,
  FolderKanban,
  Github,
  Globe,
  Linkedin,
  Mail,
  MapPin,
  MessageSquare,
  Plus,
  Settings,
  Share2,
  Star,
  Trash2,
  Twitter,
  Users,
  Zap
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  bio?: string;
  avatar?: string;
  role?: string;
  location?: string;
  website?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  isAvailable?: boolean;
  availabilityStatus?: AvailabilityStatus;
  createdAt: string;
  updatedAt: string;
  skills: Array<{
    id: string;
    name: string;
    level: 'PRIMARY' | 'SECONDARY';
  }>;
  _count: {
    posts: number;
    ownedProjects: number;
    sentConnections: number;
    receivedConnections: number;
  };
}

interface ProfileFormData {
  name: string;
  bio: string;
  role: string;
  location: string;
  website: string;
  githubUrl: string;
  linkedinUrl: string;
  twitterUrl: string;
}

interface SkillFormData {
  name: string;
  level: 'PRIMARY' | 'SECONDARY';
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
 
  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    name: '',
    bio: '',
    role: '',
    location: '',
    website: '',
    githubUrl: '',
    linkedinUrl: '',
    twitterUrl: ''
  });

  const [skillForm, setSkillForm] = useState<SkillFormData>({
    name: '',
    level: 'PRIMARY'
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
      fetchUser();
    } catch (error) {
      console.error("Error parsing user data:", error);
      router.push("/login");
    }
  }, [userId, router]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/users/${userId}`);
      if (response.data.success) {
        const userData = response.data.data.user;
        setUser(userData);
        
        // Initialize form data
        setProfileForm({
          name: userData.name || '',
          bio: userData.bio || '',
          role: userData.role || '',
          location: userData.location || '',
          website: userData.website || '',
          githubUrl: userData.githubUrl || '',
          linkedinUrl: userData.linkedinUrl || '',
          twitterUrl: userData.twitterUrl || ''
        });

        // Fetch activity data
        await fetchUserActivity();
      }
    } catch (error: any) {
      console.error('Failed to fetch user:', error);
      toast.error('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserActivity = async () => {
    try {
      // Fetch user's posts
      const postsResponse = await apiClient.get(`/users/${userId}/posts`);
      const activities: ActivityItem[] = [];

      if (postsResponse.data.success && postsResponse.data.data.posts) {
        const posts = postsResponse.data.data.posts.slice(0, 5); // Get latest 5 posts
        posts.forEach((post: any) => {
          activities.push({
            id: `post-${post.id}`,
            type: 'POST',
            title: 'Created a new post',
            description: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''),
            timestamp: post.createdAt,
            metadata: {
              postType: post.type,
            },
          });
        });
      }

      // Sort activities by timestamp (most recent first)
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setActivities(activities);
    } catch (error) {
      console.error('Failed to fetch activity:', error);
      // Don't show error toast for activity, it's not critical
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setIsUpdating(true);
      const response = await apiClient.put(`/users/${userId}`, profileForm);
      
      if (response.data.success) {
        toast.success('Profile updated successfully');
        setUser(prev => ({ ...prev!, ...response.data.data.user }));
        setIsEditModalOpen(false);
      }
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddSkill = async () => {
    if (!skillForm.name.trim()) {
      toast.error('Skill name is required');
      return;
    }

    try {
      const response = await apiClient.post(`/users/${userId}/skills`, skillForm);
      
      if (response.data.success) {
        toast.success('Skill added successfully');
        setUser(prev => ({
          ...prev!,
          skills: [...prev!.skills, response.data.data.skill]
        }));
        setSkillForm({ name: '', level: 'PRIMARY' });
        setIsSkillModalOpen(false);
      }
    } catch (error: any) {
      console.error('Failed to add skill:', error);
      toast.error(error.response?.data?.message || 'Failed to add skill');
    }
  };

  const handleRemoveSkill = async (skillId: string) => {
    try {
      await apiClient.delete(`/users/${userId}/skills/${skillId}`);
      toast.success('Skill removed successfully');
      setUser(prev => ({
        ...prev!,
        skills: prev!.skills.filter(skill => skill.id !== skillId)
      }));
    } catch (error: any) {
      console.error('Failed to remove skill:', error);
      toast.error(error.response?.data?.message || 'Failed to remove skill');
    }
  };

  const handleAvatarUpdate = (newAvatarUrl: string) => {
    setUser(prev => ({
      ...prev!,
      avatar: newAvatarUrl
    }));
    
    if (currentUser && currentUser.id === userId) {
      const updatedUser = { ...currentUser, avatar: newAvatarUrl };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
    }
  };

  const handleAvailabilityChange = async (status: AvailabilityStatus) => {
    try {
      const response = await apiClient.put(`/users/${userId}`, {
        availabilityStatus: status,
        isAvailable: status === 'AVAILABLE' || status === 'FREELANCE' || status === 'OPEN_TO_WORK',
      });

      if (response.data.success) {
        toast.success('Availability status updated');
        setUser(prev => ({
          ...prev!,
          availabilityStatus: status,
          isAvailable: status === 'AVAILABLE' || status === 'FREELANCE' || status === 'OPEN_TO_WORK',
        }));
      }
    } catch (error: any) {
      console.error('Failed to update availability:', error);
      toast.error('Failed to update availability status');
    }
  };

  const isOwnProfile = currentUser?.id === userId;

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
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="max-w-4xl mx-auto p-6 space-y-6">
              <Card className="animate-pulse">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 bg-muted rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-6 bg-muted rounded w-48"></div>
                      <div className="h-4 bg-muted rounded w-32"></div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <DashboardNav user={currentUser} />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="max-w-4xl mx-auto p-6 text-center">
              <h1 className="text-2xl font-bold text-muted-foreground">User not found</h1>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const primarySkills = user.skills.filter(skill => skill.level === 'PRIMARY');
  const secondarySkills = user.skills.filter(skill => skill.level === 'SECONDARY');
  const totalConnections = (user._count.sentConnections || 0) + (user._count.receivedConnections || 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <DashboardNav user={currentUser} />
      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Profile Header Card */}
          <Card className="border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden">
            {/* Modern Cover */}
            <div className="relative h-48 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
              {/* Subtle pattern overlay */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute top-0 left-0 w-full h-full" 
                     style={{
                       backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                     }}
                ></div>
              </div>
              
              {/* Subtle gradient accent */}
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white/30 dark:from-gray-900/50 to-transparent"></div>
            </div>

            <CardContent className="relative px-6 pb-8">
              {/* Avatar Section */}
              <div className="flex flex-col md:flex-row md:items-end md:justify-between -mt-20 mb-6">
                <div className="flex flex-col md:flex-row md:items-end gap-6">
                  <div className="relative group">
                    <Avatar className="h-32 w-32 ring-4 ring-white dark:ring-gray-950 shadow-xl border-2 border-white dark:border-gray-800">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="text-4xl font-bold bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                        {user.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Status indicator */}
                    <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 rounded-full border-3 border-white dark:border-gray-950 shadow-lg"></div>
                    
                    {/* Avatar upload button overlay */}
                    {isOwnProfile && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <AvatarUpload
                          currentAvatar={user.avatar}
                          userName={user.name}
                          onAvatarUpdated={handleAvatarUpdate}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 pb-2 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                        {user.name}
                      </h1>
                      {user.role && (
                        <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white border-0 px-3 py-1 text-sm font-medium shadow-sm">
                          {user.role}
                        </Badge>
                      )}
                      {/* Availability Status Badge */}
                      <AvailabilityBadge
                        status={user.availabilityStatus || (user.isAvailable ? 'AVAILABLE' : 'NOT_AVAILABLE')}
                        isEditable={isOwnProfile}
                        onStatusChange={handleAvailabilityChange}
                      />
                    </div>
                    {user.bio && (
                      <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">
                        {user.bio}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
                      {user.location && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4" />
                          <span>{user.location}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        <span>Joined {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-4 w-4" />
                        <span>{user.email}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 mt-6 md:mt-0">
                  {isOwnProfile ? (
                    <>
                      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                        <DialogTrigger asChild>
                          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Profile
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                              Edit Profile
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="name" className="font-semibold">Full Name</Label>
                                <Input
                                  id="name"
                                  value={profileForm.name}
                                  onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                                  placeholder="Your full name"
                                  className="mt-1.5"
                                />
                              </div>
                              <div>
                                <Label htmlFor="role" className="font-semibold">Professional Role</Label>
                                <Input
                                  id="role"
                                  value={profileForm.role}
                                  onChange={(e) => setProfileForm(prev => ({ ...prev, role: e.target.value }))}
                                  placeholder="e.g. Full Stack Developer"
                                  className="mt-1.5"
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="bio" className="font-semibold">Bio</Label>
                              <Textarea
                                id="bio"
                                value={profileForm.bio}
                                onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                                placeholder="Tell us about yourself, your experience, and what you're passionate about..."
                                rows={4}
                                className="mt-1.5"
                              />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="location" className="font-semibold">Location</Label>
                                <Input
                                  id="location"
                                  value={profileForm.location}
                                  onChange={(e) => setProfileForm(prev => ({ ...prev, location: e.target.value }))}
                                  placeholder="e.g. San Francisco, CA"
                                  className="mt-1.5"
                                />
                              </div>
                              <div>
                                <Label htmlFor="website" className="font-semibold">Website</Label>
                                <Input
                                  id="website"
                                  value={profileForm.website}
                                  onChange={(e) => setProfileForm(prev => ({ ...prev, website: e.target.value }))}
                                  placeholder="https://yourwebsite.com"
                                  className="mt-1.5"
                                />
                              </div>
                            </div>
                            <div className="space-y-3">
                              <Label className="font-semibold text-base">Social Links</Label>
                              <div className="space-y-3">
                                <div>
                                  <Label htmlFor="githubUrl" className="text-sm flex items-center gap-2">
                                    <Github className="h-4 w-4" /> GitHub
                                  </Label>
                                  <Input
                                    id="githubUrl"
                                    value={profileForm.githubUrl}
                                    onChange={(e) => setProfileForm(prev => ({ ...prev, githubUrl: e.target.value }))}
                                    placeholder="https://github.com/username"
                                    className="mt-1.5"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="linkedinUrl" className="text-sm flex items-center gap-2">
                                    <Linkedin className="h-4 w-4" /> LinkedIn
                                  </Label>
                                  <Input
                                    id="linkedinUrl"
                                    value={profileForm.linkedinUrl}
                                    onChange={(e) => setProfileForm(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                                    placeholder="https://linkedin.com/in/username"
                                    className="mt-1.5"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="twitterUrl" className="text-sm flex items-center gap-2">
                                    <Twitter className="h-4 w-4" /> Twitter/X
                                  </Label>
                                  <Input
                                    id="twitterUrl"
                                    value={profileForm.twitterUrl}
                                    onChange={(e) => setProfileForm(prev => ({ ...prev, twitterUrl: e.target.value }))}
                                    placeholder="https://twitter.com/username"
                                    className="mt-1.5"
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-3 justify-end pt-4 border-t">
                              <Button 
                                variant="outline" 
                                onClick={() => setIsEditModalOpen(false)}
                                disabled={isUpdating}
                              >
                                Cancel
                              </Button>
                              <Button 
                                onClick={handleUpdateProfile} 
                                disabled={isUpdating}
                              >
                                {isUpdating ? 'Saving...' : 'Save Changes'}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button variant="outline">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                        <Users className="h-4 w-4 mr-2" />
                        Connect
                      </Button>
                      <Button variant="outline">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                    </>
                  )}
                  <Button variant="outline" size="icon">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Social Links */}
              {(user.githubUrl || user.linkedinUrl || user.twitterUrl || user.website) && (
                <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                  {user.website && (
                    <a
                      href={user.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md rounded-lg transition-all text-sm font-medium"
                    >
                      <Globe className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      <span>Website</span>
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  )}
                  {user.githubUrl && (
                    <a
                      href={user.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md rounded-lg transition-all text-sm font-medium"
                    >
                      <Github className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                      <span>GitHub</span>
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  )}
                  {user.linkedinUrl && (
                    <a
                      href={user.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md rounded-lg transition-all text-sm font-medium"
                    >
                      <Linkedin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span>LinkedIn</span>
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  )}
                  {user.twitterUrl && (
                    <a
                      href={user.twitterUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-sky-300 dark:hover:border-sky-700 hover:shadow-md rounded-lg transition-all text-sm font-medium"
                    >
                      <Twitter className="h-4 w-4 text-sky-500 dark:text-sky-400" />
                      <span>Twitter</span>
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats Cards - Clean Professional Design */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
                    <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{user._count.posts}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Posts</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl">
                    <FolderKanban className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{user._count.ownedProjects}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Projects</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 dark:border-gray-800 hover:border-green-300 dark:hover:border-green-700 transition-colors">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-xl">
                    <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{totalConnections}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Connections</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 dark:border-gray-800 hover:border-orange-300 dark:hover:border-orange-700 transition-colors">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-xl">
                    <Award className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{user.skills.length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Skills</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabbed Content Section - Activity, Progress, Achievements */}
          <Tabs defaultValue="activity" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-auto lg:inline-grid">
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
              <TabsTrigger value="completeness">Progress</TabsTrigger>
              {isOwnProfile && <TabsTrigger value="views">Profile Views</TabsTrigger>}
            </TabsList>

            <TabsContent value="activity" className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Recent Activity
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isOwnProfile ? 'Your' : `${user.name}'s`} latest actions on DevLink
                  </p>
                </div>
              </div>
              <ActivityTimeline
                activities={activities}
                userName={user.name}
                userAvatar={user.avatar}
              />
            </TabsContent>

            <TabsContent value="completeness" className="space-y-6">
              {isOwnProfile ? (
                <ProfileCompleteness user={user} />
              ) : (
                <Card className="border border-gray-200 dark:border-gray-800">
                  <CardContent className="p-12 text-center">
                    <p className="text-gray-600 dark:text-gray-400">
                      Profile progress is only visible to the profile owner
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="achievements" className="space-y-6">
              <ProfileAchievements user={user} />
            </TabsContent>

          </Tabs>

          {/* Skills Section - Professional Design */}
          <Card className="border border-gray-200 dark:border-gray-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl">
                    <Award className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      Skills & Expertise
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {user.skills.length} professional skills
                    </p>
                  </div>
                </div>
                {isOwnProfile && (
                  <Dialog open={isSkillModalOpen} onOpenChange={setIsSkillModalOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Skill
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                          Add New Skill
                        </DialogTitle>
                      </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="skillName" className="font-semibold">Skill Name</Label>
                      <Input
                        id="skillName"
                        value={skillForm.name}
                        onChange={(e) => setSkillForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. React, Python, DevOps"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="skillLevel" className="font-semibold">Level</Label>
                      <Select value={skillForm.level} onValueChange={(value: 'PRIMARY' | 'SECONDARY') => setSkillForm(prev => ({ ...prev, level: value }))}>
                        <SelectTrigger className="mt-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PRIMARY">Primary (Core Skills)</SelectItem>
                          <SelectItem value="SECONDARY">Secondary (Additional Skills)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-3 justify-end pt-4 border-t">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsSkillModalOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleAddSkill}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Skill
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {primarySkills.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-950/30 rounded-lg">
                  <Star className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Primary Skills</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Core competencies</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {primarySkills.map((skill) => (
                  <div key={skill.id} className="relative group">
                    <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white border-0 px-4 py-2 text-sm font-medium transition-colors shadow-sm pr-8">
                      {skill.name}
                    </Badge>
                    {isOwnProfile && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSkill(skill.id)}
                        className="absolute -right-1 -top-1 h-5 w-5 p-0 rounded-full bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {secondarySkills.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-950/30 rounded-lg">
                  <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Secondary Skills</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Additional expertise</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {secondarySkills.map((skill) => (
                  <div key={skill.id} className="relative group">
                    <Badge variant="outline" className="border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/30 px-4 py-2 text-sm font-medium transition-colors pr-8">
                      {skill.name}
                    </Badge>
                    {isOwnProfile && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSkill(skill.id)}
                        className="absolute -right-1 -top-1 h-5 w-5 p-0 rounded-full bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {user.skills.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                <Award className="h-10 w-10 text-gray-400 dark:text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {isOwnProfile ? 'No skills added yet' : `${user.name} hasn't added any skills yet`}
              </h3>
              {isOwnProfile && (
                <p className="text-gray-600 dark:text-gray-400 text-sm max-w-md mx-auto">
                  Add your skills to showcase your expertise to potential collaborators
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
        </div>
      </main>
    </div>
  );
}

'use client';

import { DashboardNav } from '@/components/DashboardNav';
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
import { motion } from 'framer-motion';
import {
  Activity,
  Award,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
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
  TrendingUp,
  Twitter,
  User,
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

interface Post {
  id: string;
  type: string;
  content: string;
  createdAt: string;
  _count: {
    likes: number;
    comments: number;
  };
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  createdAt: string;
  _count?: {
    members: number;
    tasks: number;
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

  const [posts, setPosts] = useState<Post[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeTab, setActiveTab] = useState('activity');
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);

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
      }
    } catch (error: any) {
      console.error('Failed to fetch user:', error);
      toast.error('Failed to load user profile');
    } finally {
      setLoading(false);
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

  const fetchPosts = async () => {
    try {
      setLoadingPosts(true);
      const response = await apiClient.get(`/users/${userId}/posts`);
      setPosts(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      console.error('Failed to fetch posts:', error);
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  const fetchProjects = async () => {
    try {
      setLoadingProjects(true);
      const response = await apiClient.get('/projects');
      // Filter projects owned by the user
      const userProjects = Array.isArray(response.data) 
        ? response.data.filter((p: any) => p.ownerId === userId)
        : [];
      setProjects(userProjects);
    } catch (error: any) {
      console.error('Failed to fetch projects:', error);
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  };

  // Fetch data when tab changes
  useEffect(() => {
    if (user) {
      if (activeTab === 'posts' && posts.length === 0) {
        fetchPosts();
      } else if (activeTab === 'projects' && projects.length === 0) {
        fetchProjects();
      }
    }
  }, [activeTab, user]);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <DashboardNav user={currentUser} />
      <main className="w-full py-6 px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Cover & Profile Header */}
          <Card className="border-0 shadow-xl overflow-hidden">
            {/* Cover Image/Gradient */}
            <div className="h-48 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 relative">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTEyYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMTIgMTJjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>
            </div>

            <CardContent className="relative px-6 pb-6">
              {/* Avatar */}
              <div className="flex flex-col md:flex-row md:items-end md:justify-between -mt-20 mb-4">
                <div className="flex flex-col md:flex-row md:items-end gap-6">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                  >
                    <Avatar className="h-32 w-32 ring-4 ring-white dark:ring-gray-800 shadow-2xl">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="text-4xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        {user.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </motion.div>

                  <div className="space-y-2 pb-2">
                    <div className="flex items-center gap-3">
                      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{user.name}</h1>
                      <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    </div>
                    {user.role && (
                      <p className="text-lg text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-purple-600" />
                        {user.role}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      {user.location && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 text-green-600" />
                          {user.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        Joined {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-4 w-4 text-orange-600" />
                        {user.email}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4 md:mt-0">
                  {isOwnProfile ? (
                    <>
                      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                        <DialogTrigger asChild>
                          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Profile
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
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
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                              >
                                {isUpdating ? 'Saving...' : 'Save Changes'}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button variant="outline" size="icon" className="shadow-sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
                        <Users className="h-4 w-4 mr-2" />
                        Connect
                      </Button>
                      <Button variant="outline" className="shadow-sm">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                    </>
                  )}
                  <Button variant="outline" size="icon" className="shadow-sm">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Bio */}
              {user.bio && (
                <motion.div 
                  className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{user.bio}</p>
                </motion.div>
              )}

              {/* Social Links */}
              {(user.githubUrl || user.linkedinUrl || user.twitterUrl || user.website) && (
                <div className="flex flex-wrap gap-3 mt-4">
                  {user.website && (
                    <a
                      href={user.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm font-medium"
                    >
                      <Globe className="h-4 w-4 text-blue-600" />
                      Website
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {user.githubUrl && (
                    <a
                      href={user.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm font-medium"
                    >
                      <Github className="h-4 w-4" />
                      GitHub
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {user.linkedinUrl && (
                    <a
                      href={user.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm font-medium"
                    >
                      <Linkedin className="h-4 w-4 text-blue-600" />
                      LinkedIn
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {user.twitterUrl && (
                    <a
                      href={user.twitterUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm font-medium"
                    >
                      <Twitter className="h-4 w-4 text-sky-500" />
                      Twitter
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">Posts</p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{user._count.posts}</p>
                </div>
                <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Projects</p>
                  <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{user._count.ownedProjects}</p>
                </div>
                <div className="p-3 bg-purple-500 rounded-xl shadow-lg">
                  <FolderKanban className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">Connections</p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100">{totalConnections}</p>
                </div>
                <div className="p-3 bg-green-500 rounded-xl shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-1">Skills</p>
                  <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">{user.skills.length}</p>
                </div>
                <div className="p-3 bg-orange-500 rounded-xl shadow-lg">
                  <Award className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Skills Section */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg">
                <Award className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Skills & Expertise</h2>
            </div>
            {isOwnProfile && (
              <Dialog open={isSkillModalOpen} onOpenChange={setIsSkillModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Skill
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
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
                      <Button onClick={handleAddSkill} className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white">
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
            <motion.div 
              className="mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Star className="h-4 w-4 text-orange-600" />
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Primary Skills</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {primarySkills.map((skill, index) => (
                  <motion.div 
                    key={skill.id} 
                    className="relative group"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Badge className="bg-gradient-to-r from-orange-500 to-red-600 text-white border-0 px-4 py-2 text-sm font-medium shadow-md hover:shadow-lg transition-shadow pr-8">
                      {skill.name}
                    </Badge>
                    {isOwnProfile && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSkill(skill.id)}
                        className="absolute -right-1 -top-1 h-6 w-6 p-0 rounded-full bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
          
          {secondarySkills.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-blue-600" />
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Secondary Skills</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {secondarySkills.map((skill, index) => (
                  <motion.div 
                    key={skill.id} 
                    className="relative group"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (primarySkills.length * 0.05) + (index * 0.05) }}
                  >
                    <Badge 
                      variant="secondary" 
                      className="px-4 py-2 text-sm font-medium shadow-sm hover:shadow-md transition-shadow pr-8 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                    >
                      {skill.name}
                    </Badge>
                    {isOwnProfile && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSkill(skill.id)}
                        className="absolute -right-1 -top-1 h-6 w-6 p-0 rounded-full bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
          
          {user.skills.length === 0 && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                <Award className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">
                {isOwnProfile ? 'No skills added yet' : `${user.name} hasn't added any skills yet`}
              </p>
              {isOwnProfile && (
                <p className="text-gray-500 dark:text-gray-500 text-sm">
                  Add your skills to showcase your expertise to potential collaborators
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs for Posts, Projects, Activity */}
      <Card className="border-0 shadow-lg">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <CardHeader className="pb-4">
            <TabsList className="grid w-full grid-cols-3 bg-gray-100/80 dark:bg-gray-800/80 p-1.5 rounded-xl shadow-inner">
              <TabsTrigger
                value="activity"
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg py-2.5 transition-all duration-300"
              >
                <Activity className="h-4 w-4" />
                <span className="font-medium">Activity</span>
              </TabsTrigger>
              <TabsTrigger
                value="posts"
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg py-2.5 transition-all duration-300"
              >
                <FileText className="h-4 w-4" />
                <span className="font-medium">Posts ({user._count.posts})</span>
              </TabsTrigger>
              <TabsTrigger
                value="projects"
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg py-2.5 transition-all duration-300"
              >
                <FolderKanban className="h-4 w-4" />
                <span className="font-medium">Projects ({user._count.ownedProjects})</span>
              </TabsTrigger>
            </TabsList>
          </CardHeader>
          
          <CardContent>
            <TabsContent value="activity" className="space-y-4 mt-0">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
                  <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Member Since</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Joined {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-950/30 rounded-xl">
                  <div className="p-3 bg-purple-500 rounded-xl shadow-lg">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Last Updated</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Profile updated {formatDistanceToNow(new Date(user.updatedAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">Contributions</h3>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{user._count.posts}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Posts Created</p>
                  </div>

                  <div className="p-4 bg-orange-50 dark:bg-orange-950/30 rounded-xl border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-5 w-5 text-orange-600" />
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">Expertise</h3>
                    </div>
                    <p className="text-2xl font-bold text-orange-600">{user.skills.length}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Skills Showcased</p>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="posts" className="space-y-4 mt-0">
              {loadingPosts ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                </div>
              ) : posts.length > 0 ? (
                <div className="space-y-4">
                  {posts.map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-purple-100 dark:bg-purple-950/30 rounded-lg">
                              <FileText className="h-5 w-5 text-purple-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <Badge variant="outline" className="text-xs">
                                  {post.type}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                                </span>
                              </div>
                              <p className="text-gray-700 dark:text-gray-300 line-clamp-3">
                                {post.content}
                              </p>
                              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Star className="h-4 w-4" />
                                  {post._count.likes} likes
                                </span>
                                <span className="flex items-center gap-1">
                                  <MessageSquare className="h-4 w-4" />
                                  {post._count.comments} comments
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-950/30 mb-4">
                    <FileText className="h-8 w-8 text-purple-600" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    {isOwnProfile ? "You haven't created any posts yet" : `${user.name} hasn't created any posts yet`}
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="projects" className="space-y-4 mt-0">
              {loadingProjects ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                </div>
              ) : projects.length > 0 ? (
                <div className="space-y-4">
                  {projects.map((project, index) => (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-green-100 dark:bg-green-950/30 rounded-lg">
                              <FolderKanban className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                                  {project.name}
                                </h3>
                                <Badge 
                                  variant="outline"
                                  className={
                                    project.status === 'ACTIVE' 
                                      ? 'bg-green-50 text-green-700 border-green-300 dark:bg-green-950/30 dark:text-green-300'
                                      : 'bg-gray-50 text-gray-700 border-gray-300'
                                  }
                                >
                                  {project.status}
                                </Badge>
                              </div>
                              {project.description && (
                                <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                                  {project.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                {project._count && (
                                  <>
                                    <span className="flex items-center gap-1">
                                      <Users className="h-4 w-4" />
                                      {project._count.members || 0} members
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <CheckCircle2 className="h-4 w-4" />
                                      {project._count.tasks || 0} tasks
                                    </span>
                                  </>
                                )}
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-950/30 mb-4">
                    <FolderKanban className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    {isOwnProfile ? "You haven't created any projects yet" : `${user.name} hasn't created any projects yet`}
                  </p>
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
        </motion.div>
      </main>
    </div>
  );
}

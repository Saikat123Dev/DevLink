import { ApiResponse } from '@/types';
import axios, { AxiosResponse } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for global error handling
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API methods
export const apiClient = {
  // Auth endpoints
  auth: {
    login: (data: { email: string; password: string }) =>
      api.post<ApiResponse>('/auth/login', data),
    register: (data: { name: string; email: string; password: string }) =>
      api.post<ApiResponse>('/auth/register', data),
    logout: () => api.post<ApiResponse>('/auth/logout'),
    refreshToken: () => api.post<ApiResponse>('/auth/refresh-token'),
  },

  // User endpoints
  users: {
    getProfile: (userId: string) =>
      api.get<ApiResponse>(`/users/${userId}`),
    updateProfile: (userId: string, data: any) =>
      api.put<ApiResponse>(`/users/${userId}`, data),
    updateAvatar: (userId: string, data: FormData) =>
      api.patch<ApiResponse>(`/users/${userId}/avatar`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    searchUsers: (query: string) =>
      api.get<ApiResponse>(`/users/search?q=${encodeURIComponent(query)}`),
  },

  // Post endpoints
  posts: {
    getAllPosts: (page = 1, limit = 10) =>
      api.get<ApiResponse>(`/posts?page=${page}&limit=${limit}`),
    getPost: (postId: string) =>
      api.get<ApiResponse>(`/posts/${postId}`),
    createPost: (data: any) =>
      api.post<ApiResponse>('/posts', data),
    updatePost: (postId: string, data: any) =>
      api.put<ApiResponse>(`/posts/${postId}`, data),
    deletePost: (postId: string) =>
      api.delete<ApiResponse>(`/posts/${postId}`),
    likePost: (postId: string) =>
      api.post<ApiResponse>(`/posts/${postId}/like`),
    commentPost: (postId: string, content: string) =>
      api.post<ApiResponse>(`/posts/${postId}/comment`, { content }),
  },

  // Connection endpoints
  connections: {
    getConnections: () =>
      api.get<ApiResponse>('/connections'),
    getConnectionRequests: () =>
      api.get<ApiResponse>('/connections/requests'),
    getConnectionSuggestions: () =>
      api.get<ApiResponse>('/connections/suggestions'),
    sendConnectionRequest: (receiverId: string) =>
      api.post<ApiResponse>('/connections/request', { receiverId }),
    acceptConnectionRequest: (requestId: string) =>
      api.put<ApiResponse>(`/connections/${requestId}/accept`),
    rejectConnectionRequest: (requestId: string) =>
      api.put<ApiResponse>(`/connections/${requestId}/reject`),
  },

  // Project endpoints
  projects: {
    getAllProjects: () =>
      api.get<ApiResponse>('/projects'),
    getProject: (projectId: string) =>
      api.get<ApiResponse>(`/projects/${projectId}`),
    createProject: (data: any) =>
      api.post<ApiResponse>('/projects', data),
    updateProject: (projectId: string, data: any) =>
      api.put<ApiResponse>(`/projects/${projectId}`, data),
    deleteProject: (projectId: string) =>
      api.delete<ApiResponse>(`/projects/${projectId}`),
    getMembers: (projectId: string) =>
      api.get<ApiResponse>(`/projects/${projectId}/members`),
    addMember: (projectId: string, userId: string, role: string) =>
      api.post<ApiResponse>(`/projects/${projectId}/members`, { userId, role }),
    updateMemberRole: (projectId: string, memberId: string, role: string) =>
      api.patch<ApiResponse>(`/projects/${projectId}/members/${memberId}`, { role }),
    removeMember: (projectId: string, memberId: string) =>
      api.delete<ApiResponse>(`/projects/${projectId}/members/${memberId}`),
    createTask: (projectId: string, data: any) =>
      api.post<ApiResponse>(`/projects/${projectId}/tasks`, data),
    updateTask: (taskId: string, data: any) =>
      api.put<ApiResponse>(`/tasks/${taskId}`, data),
    deleteTask: (taskId: string) =>
      api.delete<ApiResponse>(`/tasks/${taskId}`),
  },

  // Project Invitations endpoints
  projectInvitations: {
    sendInvitations: (projectId: string, data: {
      developerIds: string[];
      role: string;
      message?: string;
    }) => api.post<ApiResponse>(`/projects/${projectId}/invitations`, data),
    getProjectInvitations: (projectId: string) =>
      api.get<ApiResponse>(`/projects/${projectId}/invitations`),
    getUserInvitations: () =>
      api.get<ApiResponse>('/projects/invitations/received'),
    respondToInvitation: (invitationId: string, response: 'ACCEPTED' | 'DECLINED') =>
      api.patch<ApiResponse>(`/projects/invitations/${invitationId}/respond`, { response }),
    cancelInvitation: (invitationId: string) =>
      api.delete<ApiResponse>(`/projects/invitations/${invitationId}`)
  },

  // Messages endpoints
  messages: {
    getConversations: () =>
      api.get<ApiResponse>('/messages/conversations'),
    createConversation: (data: {
      type: 'DIRECT' | 'GROUP';
      participantIds: string[];
      name?: string;
    }) => api.post<ApiResponse>('/messages/conversations', data),
    getMessages: (conversationId: string, page = 1, limit = 50) =>
      api.get<ApiResponse>(`/messages/conversations/${conversationId}/messages?page=${page}&limit=${limit}`),
    sendMessage: (conversationId: string, data: {
      content: string;
      type?: 'TEXT' | 'IMAGE' | 'FILE';
      fileUrl?: string;
      fileName?: string;
    }) => api.post<ApiResponse>(`/messages/conversations/${conversationId}/messages`, data),
    searchMessages: (query: string) =>
      api.get<ApiResponse>(`/messages/search?q=${encodeURIComponent(query)}`),
    togglePin: (conversationId: string) =>
      api.patch<ApiResponse>(`/messages/conversations/${conversationId}/pin`),
    toggleArchive: (conversationId: string) =>
      api.patch<ApiResponse>(`/messages/conversations/${conversationId}/archive`)
  },

  // Analytics endpoints
  analytics: {
    getProjectAnalytics: (projectId: string, params?: {
      startDate?: string;
      endDate?: string;
    }) => {
      const query = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
      return api.get<ApiResponse>(`/analytics/projects/${projectId}${query}`);
    },
    getUserAnalytics: (params?: {
      startDate?: string;
      endDate?: string;
    }) => {
      const query = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
      return api.get<ApiResponse>(`/analytics/user${query}`);
    },
    getPlatformAnalytics: (params?: {
      startDate?: string;
      endDate?: string;
    }) => {
      const query = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
      return api.get<ApiResponse>(`/analytics/platform${query}`);
    },
    recordAnalytics: (projectId: string, data: {
      type: string;
      tasksCompleted?: number;
      commitsCount?: number;
      contributionsCount?: number;
      productivityScore?: number;
      collaborationScore?: number;
      codeQualityScore?: number;
      communicationScore?: number;
    }) => api.post<ApiResponse>(`/analytics/projects/${projectId}`, data)
  },

  // Search endpoints
  search: {
    search: (params: {
      q?: string;
      type?: 'all' | 'developers' | 'projects' | 'posts';
      skills?: string[];
      location?: string;
      experience?: 'any' | 'entry' | 'mid' | 'senior' | 'lead';
      rating?: number[];
      availability?: boolean;
      isRemote?: boolean;
      budget?: string;
      projectStatus?: string;
      projectType?: string;
      sortBy?: 'relevance' | 'newest' | 'rating' | 'experience';
      page?: number;
      limit?: number;
    }) => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => searchParams.append(key, String(v)));
          } else {
            searchParams.append(key, String(value));
          }
        }
      });
      return api.get<ApiResponse>(`/search?${searchParams.toString()}`);
    },
    getSuggestions: (query: string) =>
      api.get<ApiResponse>(`/search/suggestions?q=${encodeURIComponent(query)}`),
    getFilters: () =>
      api.get<ApiResponse>('/search/filters'),
    saveSearchQuery: (data: {
      query: string;
      type: string;
      resultsCount: number;
    }) => api.post<ApiResponse>('/search/queries', data)
  },

  // Notifications endpoints
  notifications: {
    getNotifications: (page = 1, limit = 20) =>
      api.get<ApiResponse>(`/notifications?page=${page}&limit=${limit}`),
    getUnreadCount: () =>
      api.get<ApiResponse>('/notifications/unread-count'),
    markAsRead: (notificationId: string) =>
      api.patch<ApiResponse>(`/notifications/${notificationId}/read`),
    markAllAsRead: () =>
      api.patch<ApiResponse>('/notifications/mark-all-read'),
    deleteNotification: (notificationId: string) =>
      api.delete<ApiResponse>(`/notifications/${notificationId}`)
  },
};

export default api;

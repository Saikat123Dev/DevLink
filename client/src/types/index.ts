// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  bio?: string;
  avatar?: string;
  role?: string;
  location?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  createdAt: string;
  updatedAt: string;
  skills?: Skill[];
  _count?: {
    posts: number;
    ownedProjects: number;
    sentConnections: number;
  };
}

export interface Skill {
  id: string;
  name: string;
  level: 'PRIMARY' | 'SECONDARY';
  userId: string;
}

// Post Types
export interface Post {
  id: string;
  type: 'TEXT' | 'MEDIA' | 'CODE';
  content: string;
  codeSnippet?: string;
  language?: string;
  mediaUrls: string[];
  authorId: string;
  author: User;
  createdAt: string;
  updatedAt: string;
  likes: Like[];
  comments: Comment[];
  _count: {
    likes: number;
    comments: number;
  };
}

export interface Like {
  id: string;
  userId: string;
  postId: string;
  createdAt: string;
  user?: User;
}

export interface Comment {
  id: string;
  content: string;
  userId: string;
  postId: string;
  createdAt: string;
  user: User;
}

// Connection Types
export interface Connection {
  id: string;
  requesterId: string;
  receiverId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  requester?: User;
  receiver?: User;
}

// Project Types
export interface Project {
  id: string;
  name: string;
  description?: string;
  githubUrl?: string;
  ownerId: string;
  owner: User;
  createdAt: string;
  updatedAt: string;
  members: ProjectMember[];
  tasks: Task[];
  _count: {
    members: number;
    tasks: number;
  };
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  createdAt: string;
  user: User;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  projectId: string;
  assigneeId?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  assignee?: User;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    status: number;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface CreatePostForm {
  type: 'TEXT' | 'MEDIA' | 'CODE';
  content: string;
  codeSnippet?: string;
  language?: string;
  mediaUrls?: string[];
}

export interface CreateProjectForm {
  name: string;
  description?: string;
  githubUrl?: string;
}

export interface CreateTaskForm {
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  assigneeId?: string;
  dueDate?: string;
}

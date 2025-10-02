# Developer Collaboration Platform - Project Specification

## 🎯 Project Overview

A minimalistic, professional developer collaboration platform built with modern web technologies. The platform enables developers to connect, share code, collaborate on projects, and manage tasks in a clean, distraction-free environment.

## 📁 Project Structure

```
developer-collaboration-platform/
├── client/                 # Next.js Frontend
│   ├── app/               # App Router pages
│   ├── components/        # Reusable UI components
│   ├── lib/               # Utilities and helpers
│   ├── styles/            # Global styles
│   └── types/             # TypeScript types
└── server/                # Express.js Backend
    ├── src/
    │   ├── controllers/   # Route controllers
    │   ├── middleware/    # Auth, validation, error handling
    │   ├── routes/        # API routes
    │   ├── services/      # Business logic
    │   ├── prisma/        # Database schema & migrations
    │   └── utils/         # Helper functions
    └── package.json
```

## 🛠 Technology Stack

### Frontend (Client)

- **Framework**: Next.js 14+ (App Router with Turbopack)
- **Language**: TypeScript 5+
- **Styling**: TailwindCSS 3+
- **UI Components**: Shadcn/UI
- **Animations**: Framer Motion
- **Code Editor**: Monaco Editor (for code snippets)
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod validation
- **State Management**: Zustand or React Context
- **HTTP Client**: Axios or fetch with custom hooks

### Backend (Server)

- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (jsonwebtoken, bcrypt)
- **Validation**: Zod
- **File Storage**: Cloudinary
- **Environment**: dotenv
- **Security**: Helmet, CORS, express-rate-limit

## 🎨 Design System

### Color Palette

```typescript
// Light Mode
const lightTheme = {
  background: "#FFFFFF",
  surface: "#F8F9FA",
  primary: "#3B82F6", // Blue
  secondary: "#8B5CF6", // Purple
  success: "#10B981", // Green
  text: "#1F2937",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
};

// Dark Mode
const darkTheme = {
  background: "#0F172A",
  surface: "#1E293B",
  primary: "#60A5FA",
  secondary: "#A78BFA",
  success: "#34D399",
  text: "#F1F5F9",
  textSecondary: "#94A3B8",
  border: "#334155",
};
```

### Typography

- **Primary Font**: Inter or Geist Sans
- **Monospace Font**: JetBrains Mono or Fira Code
- **Scale**:
  - Heading 1: 2.5rem (40px) - font-bold
  - Heading 2: 2rem (32px) - font-semibold
  - Heading 3: 1.5rem (24px) - font-semibold
  - Body: 1rem (16px) - font-normal
  - Small: 0.875rem (14px) - font-normal

### Spacing System

Use TailwindCSS spacing: 4px base unit (0.25rem)

- xs: 0.5rem (8px)
- sm: 0.75rem (12px)
- md: 1rem (16px)
- lg: 1.5rem (24px)
- xl: 2rem (32px)

### Component Standards

- **Border Radius**: rounded-lg (8px) for cards, rounded-md (6px) for buttons
- **Shadows**: Use subtle shadows (shadow-sm, shadow-md)
- **Transitions**: duration-200 for hover effects
- **Focus States**: ring-2 ring-primary ring-offset-2

## 📋 Feature Requirements

### 1. Authentication System

**Screens**: Login, Signup, Forgot Password, Reset Password

**Requirements**:

- [x] JWT-based authentication
- [x] Secure password hashing with bcrypt
- [x] Email verification (optional first phase)
- [x] Protected routes on frontend
- [x] Token refresh mechanism
- [x] Form validation with Zod
- [x] Error handling with clear user feedback

**API Endpoints**:

```typescript
POST / api / auth / register;
POST / api / auth / login;
POST / api / auth / logout;
POST / api / auth / refresh - token;
POST / api / auth / forgot - password;
POST / api / auth / reset - password;
```

### 2. Developer Profile

**Screens**: Profile View, Edit Profile, Public Profile

**Requirements**:

- [ ] User profile with avatar upload (Cloudinary)
- [ ] Bio, location, role, social links
- [ ] Skills management (primary & secondary)
- [ ] Portfolio/projects showcase
- [ ] Connection stats (connections, posts, projects)
- [ ] Privacy settings

**API Endpoints**:

```typescript
GET /api/users/:userId
PUT /api/users/:userId
PATCH /api/users/:userId/avatar
GET /api/users/:userId/stats
GET /api/users/search?q=query
```

**Database Schema** (Prisma):

```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  password      String
  name          String
  bio           String?
  avatar        String?
  role          String?
  location      String?
  githubUrl     String?
  linkedinUrl   String?
  twitterUrl    String?
  skills        Skill[]
  posts         Post[]
  projects      Project[]
  connections   Connection[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Skill {
  id       String @id @default(uuid())
  name     String
  level    String // PRIMARY, SECONDARY
  userId   String
  user     User   @relation(fields: [userId], references: [id])
}
```

### 3. Posts & Code Sharing

**Screens**: Create Post, Post Feed, Post Detail

**Requirements**:

- [ ] Create text posts, media posts, code snippets
- [ ] Monaco Editor integration for code
- [ ] Syntax highlighting for multiple languages
- [ ] Code execution (sandboxed, optional for later)
- [ ] Like, comment, share functionality
- [ ] Real-time feed updates
- [ ] Pagination/infinite scroll

**API Endpoints**:

```typescript
POST /api/posts
GET /api/posts?page=1&limit=10
GET /api/posts/:postId
PUT /api/posts/:postId
DELETE /api/posts/:postId
POST /api/posts/:postId/like
POST /api/posts/:postId/comment
```

**Database Schema**:

```prisma
model Post {
  id          String    @id @default(uuid())
  type        PostType  // TEXT, MEDIA, CODE
  content     String
  codeSnippet String?
  language    String?
  mediaUrls   String[]
  authorId    String
  author      User      @relation(fields: [authorId], references: [id])
  likes       Like[]
  comments    Comment[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

enum PostType {
  TEXT
  MEDIA
  CODE
}

model Like {
  id        String   @id @default(uuid())
  userId    String
  postId    String
  post      Post     @relation(fields: [postId], references: [id])
  createdAt DateTime @default(now())

  @@unique([userId, postId])
}

model Comment {
  id        String   @id @default(uuid())
  content   String
  userId    String
  postId    String
  post      Post     @relation(fields: [postId], references: [id])
  createdAt DateTime @default(now())
}
```

### 4. Connections/Network

**Screens**: Discover Developers, Connection Requests, My Connections

**Requirements**:

- [ ] Send/accept/reject connection requests
- [ ] Discover developers by skills, location
- [ ] Search functionality
- [ ] Connection suggestions
- [ ] Mutual connections display

**API Endpoints**:

```typescript
POST /api/connections/request
PUT /api/connections/:requestId/accept
PUT /api/connections/:requestId/reject
GET /api/connections
GET /api/connections/requests
GET /api/connections/suggestions
```

**Database Schema**:

```prisma
model Connection {
  id          String           @id @default(uuid())
  requesterId String
  receiverId  String
  status      ConnectionStatus
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  @@unique([requesterId, receiverId])
}

enum ConnectionStatus {
  PENDING
  ACCEPTED
  REJECTED
}
```

### 5. Project Collaboration

**Screens**: Projects Dashboard, Project Detail, Task Board, Calendar

**Requirements**:

- [ ] Create/manage projects
- [ ] Kanban task board (To-Do, In Progress, Done)
- [ ] Invite members to projects
- [ ] Assign tasks to members
- [ ] Calendar view for deadlines
- [ ] GitHub repository integration
- [ ] Real-time collaboration (optional: Socket.io)

**API Endpoints**:

```typescript
POST /api/projects
GET /api/projects
GET /api/projects/:projectId
PUT /api/projects/:projectId
DELETE /api/projects/:projectId
POST /api/projects/:projectId/tasks
PUT /api/tasks/:taskId
DELETE /api/tasks/:taskId
POST /api/projects/:projectId/members
```

**Database Schema**:

```prisma
model Project {
  id          String    @id @default(uuid())
  name        String
  description String?
  githubUrl   String?
  ownerId     String
  owner       User      @relation(fields: [ownerId], references: [id])
  members     ProjectMember[]
  tasks       Task[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model ProjectMember {
  id        String   @id @default(uuid())
  projectId String
  project   Project  @relation(fields: [projectId], references: [id])
  userId    String
  role      String   // OWNER, ADMIN, MEMBER
  createdAt DateTime @default(now())

  @@unique([projectId, userId])
}

model Task {
  id          String     @id @default(uuid())
  title       String
  description String?
  status      TaskStatus
  priority    Priority
  projectId   String
  project     Project    @relation(fields: [projectId], references: [id])
  assigneeId  String?
  dueDate     DateTime?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  DONE
}

enum Priority {
  LOW
  MEDIUM
  HIGH
}
```

## 🎭 UI Component Library

### Core Components to Build with Shadcn/UI

1. **Button** - Primary, Secondary, Outline, Ghost variants
2. **Input** - Text, Email, Password with validation states
3. **Card** - Container for posts, profiles, projects
4. **Avatar** - User profile images with fallback
5. **Badge** - For skills, tags, status indicators
6. **Dialog/Modal** - For forms, confirmations
7. **Dropdown Menu** - For user actions, settings
8. **Tabs** - For navigation within sections
9. **Toast** - For notifications and feedback
10. **Form** - Integrated with React Hook Form
11. **Select** - Dropdown selections
12. **Textarea** - Multi-line text input
13. **Skeleton** - Loading states
14. **Popover** - For tooltips and quick info
15. **Calendar** - Date picker for tasks

### Custom Components to Create

```typescript
// CodeSnippet.tsx - Monaco Editor wrapper
interface CodeSnippetProps {
  code: string;
  language: string;
  editable?: boolean;
  onRun?: (code: string) => void;
  theme?: "light" | "dark";
}

// PostCard.tsx - Post display component
interface PostCardProps {
  post: Post;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
}

// TaskCard.tsx - Draggable task card
interface TaskCardProps {
  task: Task;
  onStatusChange: (status: TaskStatus) => void;
  onEdit: () => void;
  onDelete: () => void;
}

// ProfileCard.tsx - Developer profile card
interface ProfileCardProps {
  user: User;
  onConnect?: () => void;
  showConnectButton?: boolean;
}

// KanbanBoard.tsx - Task management board
interface KanbanBoardProps {
  tasks: Task[];
  onTaskMove: (taskId: string, newStatus: TaskStatus) => void;
  onTaskCreate: (task: Partial<Task>) => void;
}
```

## 🔧 Implementation Guidelines for Copilot

### When generating code, follow these patterns:

#### 1. API Route Pattern (Next.js)

```typescript
// app/api/posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createPostSchema = z.object({
  type: z.enum(["TEXT", "MEDIA", "CODE"]),
  content: z.string().min(1),
  codeSnippet: z.string().optional(),
  language: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createPostSchema.parse(body);

    // Business logic here

    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

#### 2. Component Pattern (React + TypeScript)

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

interface ComponentProps {
  // Props here
}

export function Component({}: ComponentProps) {
  const [state, setState] = useState();

  return (
    <Card className="w-full">
      <CardHeader>
        <h2 className="text-2xl font-semibold">Title</h2>
      </CardHeader>
      <CardContent>{/* Content */}</CardContent>
    </Card>
  );
}
```

#### 3. Express Route Pattern

```typescript
// server/src/routes/posts.routes.ts
import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createPostSchema } from "../schemas/post.schema";
import { PostController } from "../controllers/post.controller";

const router = Router();
const postController = new PostController();

router.post(
  "/",
  authenticateToken,
  validate(createPostSchema),
  postController.createPost
);

export default router;
```

#### 4. Prisma Service Pattern

```typescript
// server/src/services/post.service.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class PostService {
  async createPost(data: CreatePostInput) {
    return await prisma.post.create({
      data,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });
  }

  async getPosts(page: number, limit: number) {
    const skip = (page - 1) * limit;

    return await prisma.post.findMany({
      skip,
      take: limit,
      include: {
        author: true,
        likes: true,
        comments: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }
}
```

## 🚀 Development Phases

### Phase 1: Foundation (Week 1-2) ✅ COMPLETE

- [x] Project setup (both client and server)
- [x] Database schema design and Prisma setup
- [x] Authentication system (JWT)
- [x] Basic UI component library
- [x] Responsive layout structure

### Phase 2: Core Features (Week 3-4) ✅ COMPLETE

- [x] User profiles (CRUD operations)
- [x] Post creation and feed
- [x] Connections system
- [x] File upload integration (UI ready for Cloudinary)

### Phase 3: Advanced Features (Week 5-6) ✅ COMPLETE

- [x] Project collaboration dashboard
- [x] Kanban task board with drag-and-drop
- [x] Code snippet support (ready for Monaco Editor)
- [x] Calendar integration

### Phase 4: Polish & Enhancement (Week 7-8) ✅ COMPLETE

- [x] Animations with Framer Motion
- [x] Dark mode implementation
- [x] Search and filtering
- [x] Performance optimization
- [x] Professional UI enhancements

## 📝 Coding Standards

### TypeScript

- Use strict mode
- Define interfaces for all props and data structures
- Avoid `any` type
- Use type inference where appropriate

### React

- Use functional components with hooks
- Implement proper error boundaries
- Optimize re-renders with useMemo/useCallback
- Follow component composition patterns

### CSS/TailwindCSS

- Use Tailwind utility classes
- Create custom classes only when necessary
- Follow mobile-first responsive design
- Use CSS variables for theme values

### File Naming

- Components: PascalCase (UserProfile.tsx)
- Utilities: camelCase (formatDate.ts)
- Routes: kebab-case (user-profile/)
- Constants: UPPER_SNAKE_CASE (API_BASE_URL)

## 🔒 Security Considerations

- [ ] Input validation on both client and server
- [ ] SQL injection prevention (Prisma handles this)
- [ ] XSS prevention (React handles this)
- [ ] CSRF protection
- [ ] Rate limiting on API endpoints
- [ ] Secure password storage (bcrypt)
- [ ] JWT token security
- [ ] Environment variables for sensitive data
- [ ] CORS configuration
- [ ] Helmet.js for HTTP headers

## 📚 Resources for Implementation

### Frontend

- Next.js Docs: https://nextjs.org/docs
- Shadcn/UI: https://ui.shadcn.com
- TailwindCSS: https://tailwindcss.com/docs
- Framer Motion: https://www.framer.com/motion
- Monaco Editor: https://microsoft.github.io/monaco-editor

### Backend

- Express.js: https://expressjs.com
- Prisma: https://www.prisma.io/docs
- JWT: https://jwt.io
- Zod: https://zod.dev

## 🎯 Success Criteria

- Clean, professional UI that is visually appealing
- Responsive design works seamlessly on all devices
- Fast page loads (<3 seconds)
- Smooth animations and transitions
- Secure authentication and authorization
- Scalable database design
- Well-documented code
- Accessible (WCAG 2.1 AA compliant)

---

## 💡 How to Use This Specification with GitHub Copilot

1. **Start with setup**: Ask Copilot to generate package.json files, folder structure, and configuration files
2. **Database first**: Have Copilot create Prisma schema based on the models above
3. **Component by component**: Build one feature at a time, starting with authentication
4. **Test as you go**: Ask Copilot to generate test cases for critical functionality
5. **Iterate**: Refine components and logic based on testing

### Example Copilot Prompts:

```
"Create a Next.js 14 app with TypeScript, TailwindCSS, and Shadcn/UI. Set up the folder structure according to the specification."

"Generate a Prisma schema for the User, Post, Comment, and Like models with the relationships described in the specification."

"Create a reusable PostCard component with like, comment, and share functionality following the design system."

"Build an Express.js authentication middleware using JWT that validates tokens and attaches user info to the request."

"Generate a KanbanBoard component with drag-and-drop functionality using react-beautiful-dnd or dnd-kit."
```

Remember: Break down complex features into smaller, specific requests for better Copilot suggestions.

```

```

# DevLink - Developer Collaboration Platform

![DevLink Banner](https://via.placeholder.com/1200x300/6366F1/FFFFFF?text=DevLink+-+Connect,+Collaborate,+Create)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Features Guide](#features-guide)
- [Development Guide](#development-guide)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## 🌟 Overview

**DevLink** is a modern, full-stack developer collaboration platform that brings developers together to work on projects, share knowledge, and build meaningful connections. Built with cutting-edge technologies, DevLink provides a seamless experience for managing projects, tracking tasks, browsing code, and collaborating with team members.

### Why DevLink?

- **🚀 Modern Stack**: Built with Next.js 15, React 19, TypeScript, and Prisma
- **💼 Project Management**: Complete project lifecycle management with GitHub integration
- **📝 Task Management**: Drag-and-drop Kanban boards for visual task tracking
- **👥 Team Collaboration**: Invite developers, assign roles, and manage team members
- **🔍 Code Browser**: Built-in Monaco Editor with 13+ themes and syntax highlighting
- **📊 Analytics**: Track project progress and team productivity
- **🔔 Real-time Notifications**: Stay updated with project invitations and team activities

## ✨ Features

### Core Features

- **Authentication & Authorization**

  - Secure JWT-based authentication
  - Role-based access control (Owner, Admin, Member)
  - Profile management with avatar upload

- **Project Management**

  - Create and manage multiple projects
  - GitHub repository integration
  - Project description and metadata
  - Member management with roles

- **Task Management**

  - Drag-and-drop Kanban board (TODO, IN_PROGRESS, DONE)
  - Task assignment to team members
  - Priority levels (Low, Medium, High)
  - Due dates and descriptions
  - Real-time status updates

- **Code Repository Browser**

  - GitHub API integration
  - File tree navigation with folder expansion
  - Monaco Editor with 13 themes:
    - Dark (Default), Light
    - High Contrast Dark/Light
    - Monokai, GitHub Dark, Solarized Dark
    - Dracula, Nord, One Dark, Night Owl
    - Cappuccino ☕, Espresso ☕
  - Syntax highlighting for 20+ languages
  - Resizable split-view panels
  - Copy code functionality

- **Invitations System**

  - Send project invitations to developers
  - Role-based invitations (Frontend, Backend, Fullstack, etc.)
  - Accept/Decline invitations
  - Real-time invitation count badges
  - Invitation management dashboard

- **Connections & Networking**

  - Send/Accept connection requests
  - View connections list
  - Profile browsing

- **Global Search**

  - Search across projects, users, and content
  - Advanced filtering options

- **Responsive Design**
  - Mobile-first approach
  - Dark mode support
  - Beautiful UI with Tailwind CSS and shadcn/ui

## 🛠️ Tech Stack

### Frontend

- **Framework**: [Next.js 15.5.4](https://nextjs.org/) with App Router
- **UI Library**: [React 19](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Code Editor**: [Monaco Editor (VS Code)](https://microsoft.github.io/monaco-editor/)
- **Drag & Drop**: [@dnd-kit](https://dndkit.com/)
- **Resizable Panels**: [react-resizable-panels](https://github.com/bvaughn/react-resizable-panels)
- **State Management**: React Hooks
- **HTTP Client**: [Axios](https://axios-http.com/)
- **Date Handling**: [date-fns](https://date-fns.org/)
- **Toast Notifications**: [Sonner](https://sonner.emilkowal.ski/)

### Backend

- **Framework**: [Express.js](https://expressjs.com/)
- **Language**: TypeScript
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Authentication**: [JWT (jsonwebtoken)](https://jwt.io/)
- **Password Hashing**: [bcrypt](https://github.com/kelektiv/node.bcrypt.js)
- **Validation**: [Zod](https://zod.dev/)
- **Security**: [Helmet.js](https://helmetjs.github.io/), [CORS](https://github.com/expressjs/cors)
- **Rate Limiting**: [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit)

### DevOps & Tools

- **Version Control**: Git & GitHub
- **Package Manager**: npm
- **Development Server**: ts-node-dev
- **Build Tool**: TypeScript Compiler (tsc)
- **Code Quality**: ESLint, Prettier

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Git

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/devlink.git
cd devlink
```

#### 2. Setup Backend

```bash
cd server

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Update .env with your configuration:
DATABASE_URL="postgresql://user:password@localhost:5432/devlink"
JWT_SECRET="your-secret-key-here"
PORT=5000

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database (optional)
npx prisma db seed

# Start development server
npm run dev
```

#### 3. Setup Frontend

```bash
cd ../client

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local

# Update .env.local:
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Start development server
npm run dev
```

#### 4. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

### Quick Test

1. Register a new account at http://localhost:3000/register
2. Login and create your first project
3. Invite team members
4. Start managing tasks!

## 📁 Project Structure

```
devlink/
├── client/                    # Next.js frontend
│   ├── src/
│   │   ├── app/              # App router pages
│   │   │   ├── (auth)/       # Authentication pages
│   │   │   ├── (dashboard)/  # Dashboard pages
│   │   │   └── layout.tsx    # Root layout
│   │   ├── components/       # React components
│   │   │   ├── ui/          # shadcn/ui components
│   │   │   ├── projects/    # Project components
│   │   │   └── ...
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utility functions
│   │   │   ├── api-client.ts # API client
│   │   │   ├── monaco-themes.ts # Editor themes
│   │   │   └── utils.ts     # Helper functions
│   │   └── types/           # TypeScript types
│   ├── public/              # Static assets
│   └── package.json
│
├── server/                   # Express.js backend
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Express middleware
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── prisma/          # Prisma schema & migrations
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   └── index.ts         # Entry point
│   └── package.json
│
├── docs/                    # Documentation
├── README.md               # This file
└── .gitignore
```

## 📚 API Documentation

### Base URL

```
http://localhost:5000/api
```

### Authentication

#### Register

```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

#### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

### Projects

#### Create Project

```http
POST /projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My Awesome Project",
  "description": "A revolutionary app",
  "githubUrl": "https://github.com/user/repo"
}
```

#### Get All Projects

```http
GET /projects
Authorization: Bearer <token>
```

#### Get Project Details

```http
GET /projects/:projectId
Authorization: Bearer <token>
```

### Tasks

#### Create Task

```http
POST /projects/:projectId/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Implement user authentication",
  "description": "Add JWT-based auth system",
  "priority": "HIGH",
  "assigneeId": "user-uuid",
  "dueDate": "2024-12-31"
}
```

#### Update Task

```http
PUT /projects/tasks/:taskId
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "IN_PROGRESS",
  "priority": "MEDIUM"
}
```

### Invitations

#### Send Invitations

```http
POST /projects/:projectId/invitations
Authorization: Bearer <token>
Content-Type: application/json

{
  "developerIds": ["user-uuid-1", "user-uuid-2"],
  "role": "FRONTEND",
  "message": "Join our amazing project!"
}
```

#### Get Received Invitations

```http
GET /projects/invitations/received
Authorization: Bearer <token>
```

#### Respond to Invitation

```http
PATCH /projects/invitations/:invitationId/respond
Authorization: Bearer <token>
Content-Type: application/json

{
  "response": "ACCEPTED"
}
```

## 🎯 Features Guide

### Creating a Project

1. Navigate to the Projects page
2. Click "New Project"
3. Fill in project details:
   - Name (required)
   - Description
   - GitHub URL (optional)
4. Click "Create Project"

### Managing Tasks

1. Open a project
2. Go to the "Tasks" tab
3. Click "New Task" to create
4. Drag tasks between columns (TODO → IN_PROGRESS → DONE)
5. Click "Edit" on any task to modify
6. Assign tasks to team members via the dropdown

### Inviting Team Members

1. Open a project
2. Go to the "Members" tab
3. Click "Invite Developers"
4. Search and select developers
5. Choose their role
6. Add a personal message (optional)
7. Click "Send Invitations"

### Viewing Code

1. Open a project
2. Go to the "Code Repository" tab
3. Click "Load Repository" if not loaded
4. Browse files in the left panel
5. Click any file to view code
6. Select a theme from the dropdown
7. Use the resize handle to adjust panel sizes

### Managing Invitations

1. Click "Invitations" in the navigation menu
2. See pending invitation count in the badge
3. View all invitations (Pending, Accepted, Declined)
4. Click "Accept" or "Decline" on pending invitations
5. Click "Go to Project" for accepted invitations

## 💻 Development Guide

### Running Tests

```bash
# Frontend tests
cd client
npm test

# Backend tests
cd server
npm test
```

### Database Management

```bash
# Create a new migration
npx prisma migrate dev --name your-migration-name

# Reset database
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio
```

### Code Style

- Use TypeScript for type safety
- Follow ESLint and Prettier configurations
- Write meaningful commit messages
- Add comments for complex logic

### Environment Variables

#### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

#### Backend (.env)

```env
DATABASE_URL=postgresql://user:password@localhost:5432/devlink
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
```

## 🚢 Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables
4. Deploy

### Backend (Railway/Heroku)

1. Create a new app
2. Add PostgreSQL database
3. Set environment variables
4. Deploy from GitHub

### Database (PostgreSQL)

- Use a managed service like:
  - Supabase
  - Railway
  - AWS RDS
  - Heroku Postgres

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Prisma](https://www.prisma.io/) for the excellent ORM
- [shadcn/ui](https://ui.shadcn.com/) for beautiful components
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) for the code editor
- All open-source contributors

## 📞 Support

- **Documentation**: [docs.devlink.com](https://docs.devlink.com)
- **Issues**: [GitHub Issues](https://github.com/yourusername/devlink/issues)
- **Discord**: [Join our community](https://discord.gg/devlink)
- **Email**: support@devlink.com

## 🗺️ Roadmap

- [ ] Real-time collaboration features
- [ ] Video conferencing integration
- [ ] AI-powered code review
- [ ] Mobile application
- [ ] Advanced analytics dashboard
- [ ] Integration with more Git providers (GitLab, Bitbucket)
- [ ] Markdown documentation renderer
- [ ] Code snippet sharing
- [ ] Project templates

---

Made with ❤️ by the DevLink Team

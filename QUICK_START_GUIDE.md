# Quick Start Guide - Developer Collaboration Platform

## 🚀 Getting Started with GitHub Copilot

### Step 1: Initialize the Project

```bash
# Create root directory
mkdir developer-collaboration-platform
cd developer-collaboration-platform

# Create client and server directories
mkdir client server
```

### Step 2: Set Up Client (Next.js)

```bash
cd client
npx create-next-app@latest . --typescript --tailwind --app --turbopack
```

**Install Dependencies:**

```bash
npm install @radix-ui/react-avatar @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select @radix-ui/react-tabs
npm install lucide-react framer-motion zustand axios
npm install react-hook-form @hookform/resolvers zod
npm install @monaco-editor/react
npm install -D @types/node
```

**Install Shadcn/UI:**

```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input avatar badge dialog dropdown-menu tabs toast form select textarea skeleton popover calendar
```

### Step 3: Set Up Server (Express.js)

```bash
cd ../server
npm init -y
```

**Install Dependencies:**

```bash
npm install express cors helmet dotenv bcrypt jsonwebtoken cloudinary
npm install prisma @prisma/client zod express-validator express-rate-limit
npm install -D typescript @types/express @types/node @types/cors @types/bcrypt @types/jsonwebtoken ts-node-dev
```

**Initialize TypeScript:**

```bash
npx tsc --init
```

**Initialize Prisma:**

```bash
npx prisma init
```

### Step 4: Configure Environment Variables

**Client (.env.local):**

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

**Server (.env):**

```env
DATABASE_URL="postgresql://user:password@localhost:5432/devcollab"
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
PORT=5000
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLIENT_URL=http://localhost:3000
```

### Step 5: GitHub Copilot Prompts Sequence

Use these prompts in order to build your platform:

#### 1. Database Setup

```
"Create a complete Prisma schema for a developer collaboration platform with User, Post, Comment, Like, Connection, Project, ProjectMember, Task, and Skill models. Include proper relationships, enums, and indexes."
```

#### 2. Server Configuration

```
"Create an Express.js server with TypeScript that includes:
- CORS configuration
- Helmet for security
- Rate limiting
- Error handling middleware
- JSON body parser
- Route organization
Set it up to run on port 5000."
```

#### 3. Authentication System

```
"Build a complete JWT authentication system with:
- User registration with password hashing (bcrypt)
- Login with JWT token generation
- Token verification middleware
- Password validation (min 8 chars, 1 uppercase, 1 number)
- Error handling for duplicate emails
Use TypeScript and Zod for validation."
```

#### 4. User Profile API

```
"Create REST API endpoints for user profiles including:
- GET /api/users/:userId - Get user profile
- PUT /api/users/:userId - Update profile
- PATCH /api/users/:userId/avatar - Upload avatar (Cloudinary)
- GET /api/users/search - Search users by name or skills
Include Prisma queries, authentication middleware, and proper error handling."
```

#### 5. Frontend Layout

```
"Create a Next.js app layout with:
- Responsive navigation bar with logo, search, and user menu
- Sidebar with navigation links (Feed, Projects, Connections, Profile)
- Main content area
- Dark mode toggle
Use TailwindCSS and Shadcn/UI components."
```

#### 6. Authentication Pages

```
"Create login and signup pages for Next.js with:
- Centered card layout
- Form validation using react-hook-form and Zod
- Error message display
- Loading states
- Navigation between login/signup
Style with TailwindCSS following a minimalist design."
```

#### 7. Profile Page

```
"Build a developer profile page component that displays:
- Avatar, name, role, location
- Bio section
- Skills as badges (primary and secondary)
- Social media links (GitHub, LinkedIn, Twitter)
- Stats (connections, posts, projects)
- Edit button that opens a modal
Include responsive design and smooth animations with Framer Motion."
```

#### 8. Post Creation Component

```
"Create a PostCreator component with tabs for:
- Text post
- Media upload (with preview)
- Code snippet (with Monaco Editor and language selector)
Include form validation, loading states, and error handling.
Style with Shadcn/UI components."
```

#### 9. Post Feed

```
"Build a PostFeed component that displays:
- Infinite scroll of posts
- Each post card showing author info, content, timestamp
- Like, comment, share buttons
- Different rendering for text, media, and code posts
- Skeleton loaders while fetching
Use React hooks and include smooth animations."
```

#### 10. Connections System

```
"Create a connections feature with:
- DiscoverDevelopers page showing user cards in a grid
- Send connection request button
- ConnectionRequests page listing pending requests
- Accept/Reject buttons
- MyConnections page showing all connections
Include API integration and optimistic UI updates."
```

#### 11. Project Dashboard

```
"Build a project collaboration dashboard with:
- Project header (title, description, GitHub link)
- Tabs for Overview, Tasks, Calendar, Members
- Project cards in a grid layout
- Create new project button and modal
- Member avatars with role badges
Style professionally with TailwindCSS."
```

#### 12. Kanban Board

```
"Create a draggable Kanban board component with:
- Three columns: To-Do, In Progress, Done
- Task cards showing title, assignee, priority, due date
- Drag and drop to change status
- Add task button in each column
- Task detail modal for editing
Use @dnd-kit/core or react-beautiful-dnd."
```

#### 13. Code Snippet Component

```
"Build a CodeSnippet component using Monaco Editor that includes:
- Syntax highlighting for multiple languages
- Light/dark theme switching
- Copy code button
- Optional 'Run Code' button (for future implementation)
- Line numbers
- Read-only and editable modes
Make it responsive and match the app's design system."
```

#### 14. Calendar View

```
"Create a calendar component for project deadlines showing:
- Month view with clickable dates
- Tasks/events displayed on dates
- Color-coded by priority
- Click on date to see details
- Navigate between months
Use Shadcn/UI calendar component and customize styling."
```

#### 15. Search Functionality

```
"Implement a global search feature that searches:
- Users by name or skills
- Posts by content
- Projects by name
Include debouncing, loading states, and result categorization.
Display results in a dropdown below the search input."
```

### Step 6: Run the Application

**Terminal 1 (Server):**

```bash
cd server
npm run dev
```

**Terminal 2 (Client):**

```bash
cd client
npm run dev
```

**Terminal 3 (Prisma Studio - optional):**

```bash
cd server
npx prisma studio
```

### Step 7: Database Migrations

```bash
cd server
npx prisma migrate dev --name init
npx prisma generate
```

## 🎨 Design Tokens for TailwindCSS

Add to `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
        },
        secondary: {
          50: "#faf5ff",
          100: "#f3e8ff",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)"],
        mono: ["var(--font-jetbrains-mono)"],
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

## 📁 Suggested File Structure

```
client/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/
│   │   ├── feed/page.tsx
│   │   ├── profile/[id]/page.tsx
│   │   ├── projects/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── connections/page.tsx
│   │   └── layout.tsx
│   ├── api/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/             # Shadcn components
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── SignupForm.tsx
│   ├── profile/
│   │   ├── ProfileCard.tsx
│   │   ├── ProfileHeader.tsx
│   │   └── EditProfileModal.tsx
│   ├── posts/
│   │   ├── PostCard.tsx
│   │   ├── PostCreator.tsx
│   │   ├── PostFeed.tsx
│   │   └── CodeSnippet.tsx
│   ├── projects/
│   │   ├── ProjectCard.tsx
│   │   ├── KanbanBoard.tsx
│   │   ├── TaskCard.tsx
│   │   └── CalendarView.tsx
│   ├── connections/
│   │   ├── UserCard.tsx
│   │   └── ConnectionRequestCard.tsx
│   └── layout/
│       ├── Navbar.tsx
│       ├── Sidebar.tsx
│       └── Footer.tsx
├── lib/
│   ├── api.ts
│   ├── auth.ts
│   └── utils.ts
├── hooks/
│   ├── useAuth.ts
│   ├── usePosts.ts
│   └── useProjects.ts
├── types/
│   └── index.ts
└── styles/
    └── globals.css

server/
├── src/
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── post.controller.ts
│   │   ├── connection.controller.ts
│   │   └── project.controller.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── validate.middleware.ts
│   │   └── error.middleware.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── post.routes.ts
│   │   ├── connection.routes.ts
│   │   └── project.routes.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── post.service.ts
│   │   ├── connection.service.ts
│   │   └── project.service.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── utils/
│   │   ├── jwt.util.ts
│   │   ├── cloudinary.util.ts
│   │   └── validation.util.ts
│   ├── types/
│   │   └── index.ts
│   └── index.ts
├── .env
├── package.json
└── tsconfig.json
```

## 🐛 Common Issues & Solutions

1. **Prisma Client not generating**

   ```bash
   npx prisma generate
   ```

2. **CORS errors**

   - Check CLIENT_URL in server .env
   - Verify CORS configuration in server

3. **Monaco Editor not loading**

   - Ensure dynamic import: `const Monaco = dynamic(() => import('@monaco-editor/react'), { ssr: false })`

4. **Tailwind classes not applying**

   - Check content paths in tailwind.config.ts
   - Restart dev server

5. **JWT token issues**
   - Verify JWT_SECRET is set
   - Check token expiration
   - Ensure proper token format in headers

## 📈 Next Steps After Setup

1. **Test Authentication Flow** - Register user, login, access protected routes
2. **Create Sample Data** - Use Prisma Studio to add test users and posts
3. **Implement Features Incrementally** - Don't try to build everything at once
4. **Regular Git Commits** - Commit after each working feature
5. **Test Responsiveness** - Check on different screen sizes
6. **Add Error Boundaries** - Catch and handle React errors gracefully
7. **Performance Optimization** - Use React DevTools Profiler

---

**Pro Tip**: Use GitHub Copilot Chat to explain code, suggest improvements, and debug issues as you build!

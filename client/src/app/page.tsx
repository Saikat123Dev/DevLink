'use client';

import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Code, Users, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const router = useRouter();

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 lg:px-8">
        <div className="flex items-center space-x-2">
          <Code className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">DevLink</span>
        </div>
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/login')}
          >
            Login
          </Button>
          <Button 
            onClick={() => router.push('/signup')}
          >
            Sign Up
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl py-32 sm:py-48 lg:py-56">
          <div className="hidden sm:mb-8 sm:flex sm:justify-center">
            <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-gray-600 ring-1 ring-gray-900/10 hover:ring-gray-900/20">
              Connect, Collaborate, Create.{' '}
              <span className="font-semibold text-blue-600">
                <span className="absolute inset-0" aria-hidden="true" />
                Join developers worldwide
              </span>
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Developer Collaboration
              <span className="text-blue-600"> Made Simple</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Connect with developers, share code, collaborate on projects, and manage tasks 
              in a clean, distraction-free environment designed for modern development teams.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button 
                size="lg"
                onClick={() => router.push('/signup')}
                className="px-8 py-3 text-base"
              >
                Get Started
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => router.push('/login')}
                className="px-8 py-3 text-base"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mx-auto max-w-5xl py-16">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to collaborate
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Professional tools for modern development teams
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Code className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Share Code</CardTitle>
                <CardDescription>
                  Share code snippets with syntax highlighting and real-time collaboration
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Connect</CardTitle>
                <CardDescription>
                  Build your professional network and connect with developers worldwide
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Project Management</CardTitle>
                <CardDescription>
                  Manage projects with Kanban boards, tasks, and team collaboration tools
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Code className="h-6 w-6 text-blue-600" />
              <span className="font-semibold text-gray-900">DevLink</span>
            </div>
            <p className="text-sm text-gray-500">
              © 2025 DevLink. Built for developers, by developers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

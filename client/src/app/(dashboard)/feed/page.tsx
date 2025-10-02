"use client";

import { DashboardNav } from "@/components/DashboardNav";
import { User } from "@/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function FeedPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("authToken");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    } catch (error) {
      console.error("Error parsing user data:", error);
      router.push("/login");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardNav user={user} />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Welcome to DevLink!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your developer collaboration platform is ready. Here's what you can do:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow border">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Share Code</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Share code snippets with syntax highlighting
                  </p>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow border">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Connect</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Connect with other developers
                  </p>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow border">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Collaborate</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Work together on projects
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

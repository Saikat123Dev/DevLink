'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
    Award,
    Crown,
    Flame,
    Rocket,
    Shield,
    Sparkles,
    Star,
    Target,
    Trophy,
    Zap,
} from 'lucide-react';

interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: {
    current: number;
    target: number;
  };
}

interface ProfileAchievementsProps {
  user: {
    createdAt: string;
    _count: {
      posts: number;
      ownedProjects: number;
      sentConnections: number;
      receivedConnections: number;
    };
    skills: any[];
  };
}

export function ProfileAchievements({ user }: ProfileAchievementsProps) {
  const totalConnections = (user._count.sentConnections || 0) + (user._count.receivedConnections || 0);
  
  const achievements: AchievementBadge[] = [
    {
      id: 'early_adopter',
      title: 'Early Adopter',
      description: 'Joined DevLink in its early days',
      icon: Rocket,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950/30',
      unlocked: new Date(user.createdAt) < new Date('2025-11-01'),
      unlockedAt: user.createdAt,
    },
    {
      id: 'first_post',
      title: 'First Steps',
      description: 'Created your first post',
      icon: Star,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
      unlocked: user._count.posts >= 1,
      progress: {
        current: user._count.posts,
        target: 1,
      },
    },
    {
      id: 'content_creator',
      title: 'Content Creator',
      description: 'Shared 10 posts with the community',
      icon: Flame,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-950/30',
      unlocked: user._count.posts >= 10,
      progress: {
        current: user._count.posts,
        target: 10,
      },
    },
    {
      id: 'project_starter',
      title: 'Project Starter',
      description: 'Created your first project',
      icon: Target,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
      unlocked: user._count.ownedProjects >= 1,
      progress: {
        current: user._count.ownedProjects,
        target: 1,
      },
    },
    {
      id: 'project_master',
      title: 'Project Master',
      description: 'Created 5 amazing projects',
      icon: Crown,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30',
      unlocked: user._count.ownedProjects >= 5,
      progress: {
        current: user._count.ownedProjects,
        target: 5,
      },
    },
    {
      id: 'connector',
      title: 'Connector',
      description: 'Made 10 connections',
      icon: Zap,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950/30',
      unlocked: totalConnections >= 10,
      progress: {
        current: totalConnections,
        target: 10,
      },
    },
    {
      id: 'networking_pro',
      title: 'Networking Pro',
      description: 'Built a network of 50+ connections',
      icon: Shield,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/30',
      unlocked: totalConnections >= 50,
      progress: {
        current: totalConnections,
        target: 50,
      },
    },
    {
      id: 'skill_collector',
      title: 'Skill Collector',
      description: 'Added 10 skills to your profile',
      icon: Award,
      color: 'text-pink-600 dark:text-pink-400',
      bgColor: 'bg-pink-50 dark:bg-pink-950/30',
      unlocked: user.skills.length >= 10,
      progress: {
        current: user.skills.length,
        target: 10,
      },
    },
  ];

  const unlockedAchievements = achievements.filter((a) => a.unlocked);
  const lockedAchievements = achievements.filter((a) => !a.unlocked);

  return (
    <Card className="border border-gray-200 dark:border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
              <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Achievements
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {unlockedAchievements.length} of {achievements.length} unlocked
              </p>
            </div>
          </div>
          <Badge className="bg-amber-600 text-white border-0 px-3 py-1">
            {unlockedAchievements.length}/{achievements.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Unlocked Achievements */}
        {unlockedAchievements.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Unlocked
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {unlockedAchievements.map((achievement) => {
                const Icon = achievement.icon;
                return (
                  <div
                    key={achievement.id}
                    className={`relative p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 ${achievement.bgColor} overflow-hidden transition-transform hover:scale-105`}
                  >
                    {/* Shine effect */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/20 dark:bg-white/10 rounded-full blur-2xl" />
                    
                    <div className="relative flex items-start gap-3">
                      <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${achievement.bgColor} border-2 border-white dark:border-gray-800 flex items-center justify-center shadow-lg`}>
                        <Icon className={`h-6 w-6 ${achievement.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                          {achievement.title}
                        </h5>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                          {achievement.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Locked Achievements */}
        {lockedAchievements.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Locked
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {lockedAchievements.map((achievement) => {
                const Icon = achievement.icon;
                const progressPercent = achievement.progress
                  ? Math.min((achievement.progress.current / achievement.progress.target) * 100, 100)
                  : 0;

                return (
                  <div
                    key={achievement.id}
                    className="relative p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 opacity-75"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <Icon className="h-6 w-6 text-gray-400 dark:text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {achievement.title}
                        </h5>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                          {achievement.description}
                        </p>
                        {achievement.progress && (
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600 dark:text-gray-400">
                                Progress
                              </span>
                              <span className="text-gray-600 dark:text-gray-400 font-medium">
                                {achievement.progress.current}/{achievement.progress.target}
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

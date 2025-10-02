'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, TrendingUp } from 'lucide-react';

interface ProfileCompletenessProps {
  user: {
    avatar?: string;
    bio?: string;
    role?: string;
    location?: string;
    website?: string;
    githubUrl?: string;
    linkedinUrl?: string;
    twitterUrl?: string;
    skills: any[];
  };
}

interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  points: number;
}

export function ProfileCompleteness({ user }: ProfileCompletenessProps) {
  const checklist: ChecklistItem[] = [
    {
      id: 'avatar',
      label: 'Upload profile picture',
      completed: !!user.avatar,
      points: 15,
    },
    {
      id: 'bio',
      label: 'Add bio/description',
      completed: !!user.bio && user.bio.length > 20,
      points: 15,
    },
    {
      id: 'role',
      label: 'Set professional role',
      completed: !!user.role,
      points: 10,
    },
    {
      id: 'location',
      label: 'Add location',
      completed: !!user.location,
      points: 5,
    },
    {
      id: 'skills',
      label: 'Add at least 3 skills',
      completed: user.skills.length >= 3,
      points: 20,
    },
    {
      id: 'social',
      label: 'Connect at least 2 social accounts',
      completed: [user.website, user.githubUrl, user.linkedinUrl, user.twitterUrl].filter(Boolean).length >= 2,
      points: 15,
    },
    {
      id: 'website',
      label: 'Add portfolio/website',
      completed: !!user.website,
      points: 10,
    },
    {
      id: 'github',
      label: 'Link GitHub profile',
      completed: !!user.githubUrl,
      points: 10,
    },
  ];

  const completedItems = checklist.filter((item) => item.completed);
  const totalPoints = checklist.reduce((sum, item) => sum + item.points, 0);
  const earnedPoints = completedItems.reduce((sum, item) => sum + item.points, 0);
  const percentage = Math.round((earnedPoints / totalPoints) * 100);

  const getProgressColor = () => {
    if (percentage >= 80) return 'bg-green-600';
    if (percentage >= 50) return 'bg-yellow-600';
    return 'bg-orange-600';
  };

  const getProgressLabel = () => {
    if (percentage === 100) return 'Complete';
    if (percentage >= 80) return 'Almost there';
    if (percentage >= 50) return 'Good progress';
    return 'Getting started';
  };

  return (
    <Card className="border border-gray-200 dark:border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg">
              <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Profile Completeness
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {completedItems.length} of {checklist.length} completed
              </p>
            </div>
          </div>
          <Badge
            className={`${getProgressColor()} text-white border-0 px-3 py-1`}
          >
            {percentage}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {getProgressLabel()}
            </span>
            <span className="text-gray-500 dark:text-gray-500">
              {earnedPoints}/{totalPoints} points
            </span>
          </div>
          <Progress value={percentage} className="h-3" />
        </div>

        {/* Checklist */}
        <div className="space-y-3">
          {checklist.map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                item.completed
                  ? 'bg-green-50 dark:bg-green-950/20'
                  : 'bg-gray-50 dark:bg-gray-800/50'
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                {item.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-400 dark:text-gray-600 flex-shrink-0" />
                )}
                <span
                  className={`text-sm font-medium ${
                    item.completed
                      ? 'text-green-900 dark:text-green-100'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {item.label}
                </span>
              </div>
              <Badge
                variant={item.completed ? 'default' : 'outline'}
                className={`text-xs ${
                  item.completed
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                +{item.points}
              </Badge>
            </div>
          ))}
        </div>

        {percentage === 100 && (
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm font-semibold text-green-900 dark:text-green-100 text-center">
              🎉 Amazing! Your profile is 100% complete!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

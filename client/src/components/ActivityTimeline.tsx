'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import {
    Code,
    FileText,
    FolderKanban,
    GitBranch,
    Heart,
    MessageCircle,
    Users
} from 'lucide-react';

export interface ActivityItem {
  id: string;
  type: 'POST' | 'PROJECT' | 'CONNECTION' | 'LIKE' | 'COMMENT' | 'SKILL';
  title: string;
  description?: string;
  timestamp: string;
  metadata?: {
    postType?: string;
    projectName?: string;
    skillName?: string;
    connectionName?: string;
  };
}

interface ActivityTimelineProps {
  activities: ActivityItem[];
  userName: string;
  userAvatar?: string;
}

const activityConfig = {
  POST: {
    icon: FileText,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    label: 'Created a post',
  },
  PROJECT: {
    icon: FolderKanban,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    label: 'Started a project',
  },
  CONNECTION: {
    icon: Users,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    label: 'Made a connection',
  },
  LIKE: {
    icon: Heart,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    label: 'Liked a post',
  },
  COMMENT: {
    icon: MessageCircle,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    label: 'Commented',
  },
  SKILL: {
    icon: Code,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/30',
    label: 'Added a skill',
  },
};

export function ActivityTimeline({ activities, userName, userAvatar }: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <Card className="border border-gray-200 dark:border-gray-800">
        <CardContent className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
            <GitBranch className="h-8 w-8 text-gray-400 dark:text-gray-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No activity yet
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Activity will appear here as {userName} interacts with the platform
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200 dark:border-gray-800">
      <CardContent className="p-6">
        <div className="space-y-6">
          {activities.map((activity, index) => {
            const config = activityConfig[activity.type];
            const Icon = config.icon;

            return (
              <div key={activity.id} className="relative">
                {/* Timeline line */}
                {index !== activities.length - 1 && (
                  <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-800" />
                )}

                <div className="flex gap-4">
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${config.bgColor} flex items-center justify-center`}>
                    <Icon className={`h-6 w-6 ${config.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {activity.title}
                        </p>
                        {activity.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                            {activity.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-gray-500 dark:text-gray-500">
                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                          </span>
                          {activity.metadata?.postType && (
                            <Badge variant="outline" className="text-xs">
                              {activity.metadata.postType}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

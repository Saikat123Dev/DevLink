'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Briefcase, CheckCircle2, Coffee, Moon, Zap } from 'lucide-react';

export type AvailabilityStatus = 
  | 'AVAILABLE' 
  | 'BUSY' 
  | 'OPEN_TO_WORK' 
  | 'NOT_AVAILABLE'
  | 'FREELANCE';

interface AvailabilityBadgeProps {
  status: AvailabilityStatus;
  isEditable?: boolean;
  onStatusChange?: (status: AvailabilityStatus) => void;
}

const statusConfig: Record<AvailabilityStatus, {
  label: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  description: string;
}> = {
  AVAILABLE: {
    label: 'Available for projects',
    icon: CheckCircle2,
    color: 'text-green-700 dark:text-green-300',
    bgColor: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800',
    description: 'Ready to take on new projects',
  },
  BUSY: {
    label: 'Currently busy',
    icon: Coffee,
    color: 'text-orange-700 dark:text-orange-300',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800',
    description: 'Working on existing projects',
  },
  OPEN_TO_WORK: {
    label: 'Open to work',
    icon: Briefcase,
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
    description: 'Actively looking for opportunities',
  },
  NOT_AVAILABLE: {
    label: 'Not available',
    icon: Moon,
    color: 'text-gray-700 dark:text-gray-300',
    bgColor: 'bg-gray-50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700',
    description: 'Taking a break',
  },
  FREELANCE: {
    label: 'Available for freelance',
    icon: Zap,
    color: 'text-purple-700 dark:text-purple-300',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800',
    description: 'Open for freelance work',
  },
};

export function AvailabilityBadge({ 
  status, 
  isEditable = false, 
  onStatusChange 
}: AvailabilityBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  if (!isEditable) {
    return (
      <Badge 
        className={`${config.bgColor} ${config.color} border px-3 py-1.5 font-medium shadow-sm`}
      >
        <Icon className="h-3.5 w-3.5 mr-1.5" />
        {config.label}
      </Badge>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`${config.bgColor} ${config.color} border hover:opacity-80 transition-opacity`}
        >
          <Icon className="h-3.5 w-3.5 mr-1.5" />
          {config.label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {(Object.keys(statusConfig) as AvailabilityStatus[]).map((statusKey) => {
          const statusItem = statusConfig[statusKey];
          const StatusIcon = statusItem.icon;
          return (
            <DropdownMenuItem
              key={statusKey}
              onClick={() => onStatusChange?.(statusKey)}
              className={`cursor-pointer ${status === statusKey ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
            >
              <div className="flex items-start gap-3 w-full">
                <div className={`p-1.5 rounded-lg ${statusItem.bgColor}`}>
                  <StatusIcon className={`h-4 w-4 ${statusItem.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {statusItem.label}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {statusItem.description}
                  </p>
                </div>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

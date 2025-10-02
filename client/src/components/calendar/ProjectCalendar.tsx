'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { eachDayOfInterval, endOfMonth, format, isSameDay, isToday, startOfMonth } from 'date-fns';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Clock,
    Filter,
    Plus
} from 'lucide-react';
import { useState } from 'react';

interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
  };
  project: {
    id: string;
    name: string;
    color: string;
  };
}

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'task' | 'deadline' | 'meeting';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  project?: {
    id: string;
    name: string;
    color: string;
  };
}

interface ProjectCalendarProps {
  projectId?: string;
  className?: string;
}

export function ProjectCalendar({ projectId, className }: ProjectCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [showCompleted, setShowCompleted] = useState(false);

  // Mock data - replace with actual API calls
  const tasks: Task[] = [
    {
      id: '1',
      title: 'Complete user authentication',
      description: 'Implement JWT-based authentication system',
      dueDate: new Date(2025, 9, 15).toISOString(),
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      assignee: {
        id: '1',
        name: 'John Doe',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John'
      },
      project: {
        id: 'p1',
        name: 'DevLink Platform',
        color: '#3B82F6'
      }
    },
    {
      id: '2',
      title: 'Design system documentation',
      dueDate: new Date(2025, 9, 20).toISOString(),
      priority: 'MEDIUM',
      status: 'TODO',
      assignee: {
        id: '2',
        name: 'Sarah Chen',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'
      },
      project: {
        id: 'p1',
        name: 'DevLink Platform',
        color: '#3B82F6'
      }
    },
    {
      id: '3',
      title: 'Mobile app testing',
      dueDate: new Date(2025, 9, 25).toISOString(),
      priority: 'HIGH',
      status: 'TODO',
      project: {
        id: 'p2',
        name: 'Mobile App',
        color: '#8B5CF6'
      }
    },
    {
      id: '4',
      title: 'Code review session',
      dueDate: new Date(2025, 9, 18).toISOString(),
      priority: 'MEDIUM',
      status: 'DONE',
      project: {
        id: 'p1',
        name: 'DevLink Platform',
        color: '#3B82F6'
      }
    }
  ];

  const events: CalendarEvent[] = tasks.map(task => ({
    id: task.id,
    title: task.title,
    date: new Date(task.dueDate),
    type: 'task',
    priority: task.priority,
    project: task.project
  }));

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      const taskDate = new Date(task.dueDate);
      return isSameDay(taskDate, date) && (showCompleted || task.status !== 'DONE');
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'LOW': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO': return 'text-gray-600';
      case 'IN_PROGRESS': return 'text-blue-600';
      case 'DONE': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const renderCalendarDay = (day: Date) => {
    const dayTasks = getTasksForDate(day);
    const hasHighPriority = dayTasks.some(task => task.priority === 'HIGH');
    const isSelected = isSameDay(day, selectedDate);
    const isCurrentDay = isToday(day);

    return (
      <div
        className={cn(
          "relative min-h-[80px] p-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors",
          isSelected && "bg-blue-50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-700",
          isCurrentDay && "bg-blue-100 dark:bg-blue-900/30"
        )}
        onClick={() => setSelectedDate(day)}
      >
        <div className="flex items-center justify-between mb-1">
          <span className={cn(
            "text-sm font-medium",
            isCurrentDay && "text-blue-600 dark:text-blue-400"
          )}>
            {format(day, 'd')}
          </span>
          {hasHighPriority && (
            <div className="h-2 w-2 bg-red-500 rounded-full"></div>
          )}
        </div>
        
        <div className="space-y-1">
          {dayTasks.slice(0, 2).map((task) => (
            <div
              key={task.id}
              className={cn(
                "text-xs p-1 rounded truncate",
                task.status === 'DONE' ? "bg-gray-100 dark:bg-gray-800 text-gray-500 line-through" :
                task.priority === 'HIGH' ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300" :
                task.priority === 'MEDIUM' ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300" :
                "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
              )}
              style={{ borderLeft: `3px solid ${task.project.color}` }}
            >
              {task.title}
            </div>
          ))}
          {dayTasks.length > 2 && (
            <div className="text-xs text-gray-500 pl-1">
              +{dayTasks.length - 2} more
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    const days = eachDayOfInterval({ start, end });
    
    // Pad with previous month days to start on Sunday
    const startDay = start.getDay();
    const prevDays = [];
    for (let i = startDay - 1; i >= 0; i--) {
      const prevDay = new Date(start);
      prevDay.setDate(prevDay.getDate() - (i + 1));
      prevDays.push(prevDay);
    }
    
    // Pad with next month days to end on Saturday
    const endDay = end.getDay();
    const nextDays = [];
    for (let i = endDay + 1; i <= 6; i++) {
      const nextDay = new Date(end);
      nextDay.setDate(nextDay.getDate() + (i - endDay));
      nextDays.push(nextDay);
    }
    
    const allDays = [...prevDays, ...days, ...nextDays];

    return (
      <div className="grid grid-cols-7 gap-0 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {/* Header */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 font-medium text-center">
            {day}
          </div>
        ))}
        
        {/* Days */}
        {allDays.map((day, index) => (
          <div key={index}>
            {renderCalendarDay(day)}
          </div>
        ))}
      </div>
    );
  };

  const selectedDateTasks = getTasksForDate(selectedDate);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-blue-600" />
            Project Calendar
          </h2>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const prev = new Date(selectedDate);
                prev.setMonth(prev.getMonth() - 1);
                setSelectedDate(prev);
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <h3 className="text-lg font-semibold min-w-[150px] text-center">
              {format(selectedDate, 'MMMM yyyy')}
            </h3>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const next = new Date(selectedDate);
                next.setMonth(next.getMonth() + 1);
                setSelectedDate(next);
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={showCompleted ? "default" : "outline"}
            size="sm"
            onClick={() => setShowCompleted(!showCompleted)}
          >
            Show Completed
          </Button>
          
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-3">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              {renderMonthView()}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Selected Date Tasks */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <h3 className="font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {format(selectedDate, 'MMM d, yyyy')}
              </h3>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedDateTasks.length === 0 ? (
                <p className="text-gray-500 text-sm">No tasks for this date</p>
              ) : (
                selectedDateTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    style={{ borderLeftColor: task.project.color, borderLeftWidth: '4px' }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className={cn(
                          "font-medium text-sm",
                          getStatusColor(task.status),
                          task.status === 'DONE' && "line-through"
                        )}>
                          {task.title}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">{task.project.name}</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "h-2 w-2 rounded-full",
                          getPriorityColor(task.priority)
                        )}></div>
                        
                        {task.assignee && (
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={task.assignee.avatar} />
                            <AvatarFallback className="text-xs">
                              {task.assignee.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </div>
                    
                    {task.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                        {task.description}
                      </p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <h3 className="font-semibold">Upcoming Deadlines</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              {tasks
                .filter(task => new Date(task.dueDate) >= new Date() && task.status !== 'DONE')
                .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                .slice(0, 5)
                .map((task) => (
                  <div key={task.id} className="flex items-center gap-3">
                    <div className={cn(
                      "h-3 w-3 rounded-full",
                      getPriorityColor(task.priority)
                    )}></div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(task.dueDate), 'MMM d')} • {task.project.name}
                      </p>
                    </div>
                    
                    {task.assignee && (
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={task.assignee.avatar} />
                        <AvatarFallback className="text-xs">
                          {task.assignee.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
            </CardContent>
          </Card>

          {/* Project Legend */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <h3 className="font-semibold">Projects</h3>
            </CardHeader>
            <CardContent className="space-y-2">
              {Array.from(new Set(tasks.map(task => task.project.id)))
                .map(projectId => {
                  const project = tasks.find(task => task.project.id === projectId)?.project;
                  const projectTasks = tasks.filter(task => task.project.id === projectId);
                  const completedTasks = projectTasks.filter(task => task.status === 'DONE').length;
                  
                  return project ? (
                    <div key={projectId} className="flex items-center gap-3">
                      <div 
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: project.color }}
                      ></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{project.name}</p>
                        <p className="text-xs text-gray-500">
                          {completedTasks}/{projectTasks.length} completed
                        </p>
                      </div>
                    </div>
                  ) : null;
                })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

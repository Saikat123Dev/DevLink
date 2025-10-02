'use client';

import { ProjectCalendar } from '@/components/calendar/ProjectCalendar';

export default function CalendarPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-950 dark:to-indigo-950">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <ProjectCalendar />
        </div>
      </div>
    </div>
  );
}

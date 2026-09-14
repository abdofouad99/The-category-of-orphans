export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { TimeTrackingClient } from '@/components/time-tracking/time-tracking-client';

async function getTimeTrackingData() {
  const [entries, totalMinutesAgg, totalTasksTracked, tasks, users] = await Promise.all([
    prisma.timeEntry.findMany({
      take: 50,
      orderBy: { startTime: 'desc' },
      include: {
        task: {
          include: { department: { select: { name: true } } },
        },
        user: { select: { id: true, name: true } },
      },
    }),
    prisma.timeEntry.aggregate({
      _sum: { durationMinutes: true },
    }),
    prisma.task.count({
      where: {
        timeEntries: { some: {} },
      },
    }),
    prisma.task.findMany({
      select: { id: true, title: true, taskNumber: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  const totalMinutes = totalMinutesAgg._sum.durationMinutes || 0;
  const totalHours = (totalMinutes / 60).toFixed(1);

  return {
    entries: JSON.parse(JSON.stringify(entries)),
    totalMinutes,
    totalHours,
    totalTasksTracked,
    tasks,
    users,
  };
}

export default async function TimeTrackingPage() {
  const data = await getTimeTrackingData();

  return (
    <TimeTrackingClient
      entries={data.entries}
      totalHours={data.totalHours}
      totalTasksTracked={data.totalTasksTracked}
      tasks={data.tasks}
      users={data.users}
    />
  );
}

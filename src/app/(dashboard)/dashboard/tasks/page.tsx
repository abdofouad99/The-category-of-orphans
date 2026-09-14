export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { TasksClient } from '@/components/tasks/tasks-client';

async function getTasksData() {
  const [tasks, totalTasks, inProgressTasks, completedTasks, departments, users] = await Promise.all([
    prisma.task.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        department: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, role: true } },
      },
    }),
    prisma.task.count(),
    prisma.task.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.task.count({ where: { status: 'COMPLETED' } }),
    prisma.department.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return {
    tasks: JSON.parse(JSON.stringify(tasks)),
    totalTasks,
    inProgressTasks,
    completedTasks,
    departments,
    users,
  };
}

export default async function TasksPage() {
  const data = await getTasksData();

  return (
    <TasksClient
      tasks={data.tasks}
      totalTasks={data.totalTasks}
      inProgressTasks={data.inProgressTasks}
      completedTasks={data.completedTasks}
      departments={data.departments}
      users={data.users}
    />
  );
}

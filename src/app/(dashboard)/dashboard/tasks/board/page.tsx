export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { KanbanBoardClient } from '@/components/tasks/kanban-board-client';

async function getKanbanData() {
  const [tasks, departments, users] = await Promise.all([
    prisma.task.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        assignee: { select: { id: true, name: true, role: true } },
        department: { select: { id: true, name: true } },
      },
    }),
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
    departments,
    users,
  };
}

export default async function TasksBoardPage() {
  const data = await getKanbanData();

  return (
    <KanbanBoardClient
      tasks={data.tasks}
      departments={data.departments}
      users={data.users}
    />
  );
}

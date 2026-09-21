export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { DepartmentsClient } from '@/components/departments/departments-client';

async function getDepartmentsData() {
  const [departments, allUsers] = await Promise.all([
    prisma.department.findMany({
      orderBy: { name: 'asc' },
      include: {
        users: { select: { id: true, name: true, role: true } },
        tasks: { select: { id: true, status: true } },
        requests: { select: { id: true } },
      },
    }),
    prisma.user.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, role: true },
    }),
  ]);

  return {
    departments: JSON.parse(JSON.stringify(departments)),
    allUsers: JSON.parse(JSON.stringify(allUsers)),
  };
}

export default async function DepartmentsPage() {
  const data = await getDepartmentsData();

  return <DepartmentsClient departments={data.departments} allUsers={data.allUsers} />;
}

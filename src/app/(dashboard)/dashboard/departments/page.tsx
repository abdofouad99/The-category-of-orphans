export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { DepartmentsClient } from '@/components/departments/departments-client';

async function getDepartmentsData() {
  const departments = await prisma.department.findMany({
    orderBy: { name: 'asc' },
    include: {
      users: { select: { id: true, name: true, role: true } },
      tasks: { select: { id: true, status: true } },
      requests: { select: { id: true } },
    },
  });

  return {
    departments: JSON.parse(JSON.stringify(departments)),
  };
}

export default async function DepartmentsPage() {
  const data = await getDepartmentsData();

  return <DepartmentsClient departments={data.departments} />;
}

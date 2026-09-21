export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { VolunteersClient } from '@/components/volunteers/volunteers-client';

async function getVolunteersData() {
  const [volunteers, totalVolunteers, activeVolunteers, totalHoursAgg] = await Promise.all([
    prisma.volunteer.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.volunteer.count(),
    prisma.volunteer.count({ where: { status: 'ACTIVE' } }),
    prisma.volunteer.aggregate({
      _sum: { totalHours: true },
    }),
  ]);

  const totalHours = totalHoursAgg._sum.totalHours || 0;

  return {
    volunteers: JSON.parse(JSON.stringify(volunteers)),
    totalVolunteers,
    activeVolunteers,
    totalHours,
  };
}

export default async function VolunteersPage() {
  const data = await getVolunteersData();

  return (
    <VolunteersClient
      volunteers={data.volunteers}
      totalVolunteers={data.totalVolunteers}
      activeVolunteers={data.activeVolunteers}
      totalHours={data.totalHours}
    />
  );
}

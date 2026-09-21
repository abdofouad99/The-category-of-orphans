export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { AnnouncementsClient } from '@/components/announcements/announcements-client';

async function getAnnouncementsData() {
  const [announcements, totalAnnouncements, activeAnnouncements] = await Promise.all([
    prisma.announcement.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    }),
    prisma.announcement.count(),
    prisma.announcement.count({ where: { isActive: true } }),
  ]);

  return {
    announcements: JSON.parse(JSON.stringify(announcements)),
    totalAnnouncements,
    activeAnnouncements,
  };
}

export default async function AnnouncementsPage() {
  const data = await getAnnouncementsData();

  return (
    <AnnouncementsClient
      announcements={data.announcements}
      totalAnnouncements={data.totalAnnouncements}
      activeAnnouncements={data.activeAnnouncements}
    />
  );
}

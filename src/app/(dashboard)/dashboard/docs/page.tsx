export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { DocsClient } from '@/components/docs/docs-client';

async function getDocsData() {
  const [docs, totalDocs, departments] = await Promise.all([
    prisma.documentPolicy.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        department: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    }),
    prisma.documentPolicy.count(),
    prisma.department.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return {
    docs: JSON.parse(JSON.stringify(docs)),
    totalDocs,
    departments,
  };
}

export default async function DocsPage() {
  const data = await getDocsData();

  return (
    <DocsClient
      docs={data.docs}
      totalDocs={data.totalDocs}
      departments={data.departments}
    />
  );
}

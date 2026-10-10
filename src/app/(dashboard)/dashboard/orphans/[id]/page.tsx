import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { OrphanDetailsClient } from "./orphan-details-client"
import { getCurrentUser } from "@/app/actions/auth-actions"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function OrphanDetailsPage({ params }: PageProps) {
  const { id } = await params
  const currentUser = await getCurrentUser()

  const orphan = await prisma.beneficiary.findFirst({
    where: {
      id: id,
      category: "ORPHAN",
      deletedAt: null,
    },
    include: {
      family: true,
      sponsorships: {
        include: {
          sponsor: true,
        },
      },
      tags: {
        include: { tag: true },
      },
      guardians: {
        orderBy: { isPrimary: "desc" },
      },
      siblings: {
        orderBy: { siblingOrder: "asc" },
      },
    },
  })

  if (!orphan) {
    notFound()
  }

  const serializedOrphan = JSON.parse(JSON.stringify(orphan))

  return (
    <div className="py-2">
      <OrphanDetailsClient initialOrphan={serializedOrphan as any} currentUserRole={currentUser?.role} />
    </div>
  )
}

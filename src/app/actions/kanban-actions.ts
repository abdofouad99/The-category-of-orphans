"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { createAuditLog, diffObjects } from "@/lib/audit-utils"
import { createNotification } from "@/app/actions/notification-actions"

export async function getKanbanData() {
  try {
    const [orphans, sponsors] = await Promise.all([
      prisma.beneficiary.findMany({
        where: {
          category: "ORPHAN",
          deletedAt: null
        },
        include: {
          sponsorships: {
            where: {
              deletedAt: null,
            },
            include: {
              sponsor: true
            },
            orderBy: {
              createdAt: "desc"
            }
          },
          family: {
            select: {
              id: true,
              headFullName: true,
              addressDetail: true,
              housingType: true,
              povertyLevel: true,
              guardianPhone: true,
            }
          },
          guardians: {
            where: { isPrimary: true },
            take: 1,
            select: {
              fullName: true,
              relation: true,
              phone1: true,
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      }),
      prisma.sponsor.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          fullName: true,
          organization: true,
        },
        orderBy: { fullName: "asc" }
      })
    ])

    return {
      success: true,
      orphans: JSON.parse(JSON.stringify(orphans)),
      sponsors: JSON.parse(JSON.stringify(sponsors))
    }
  } catch (error: any) {
    console.error("Failed to fetch Kanban data:", error)
    return { success: false, error: error.message, orphans: [], sponsors: [] }
  }
}

export async function updateOrphanVerificationStatus(id: string, status: "PENDING" | "APPROVED" | "REJECTED") {
  try {
    const oldOrphan = await prisma.beneficiary.findUnique({
      where: { id },
      include: { sponsorships: true }
    })
    if (!oldOrphan) return { success: false, error: "اليتيم غير موجود" }

    const adminUser = await prisma.user.findFirst({
      where: { role: { in: ["ADMIN", "MANAGER"] } }
    })

    // If moving to PENDING or REJECTED, pause any active sponsorships
    if (status === "PENDING" || status === "REJECTED") {
      await prisma.sponsorship.updateMany({
        where: {
          beneficiaryId: id,
          status: "ACTIVE"
        },
        data: {
          status: "PAUSED"
        }
      })
    }

    const updatedOrphan = await prisma.beneficiary.update({
      where: { id },
      data: {
        verificationStatus: status
      }
    })

    await createAuditLog({
      entityType: "BENEFICIARY",
      entityId: id,
      action: "UPDATE",
      changes: diffObjects(oldOrphan, updatedOrphan),
      userId: adminUser?.id
    })

    const statusNames = {
      PENDING: "قيد التحقق والمراجعة",
      APPROVED: "معتمد وبانتظار الكفالة",
      REJECTED: "مرفوض / معلق"
    }

    await createNotification({
      title: "تحديث مسار اليتيم",
      message: `تم تحديث مسار اليتيم ${updatedOrphan.fullName} إلى: ${statusNames[status]}`,
      type: status === "APPROVED" ? "SUCCESS" : status === "REJECTED" ? "ALERT" : "INFO"
    })

    revalidatePath("/dashboard/orphans")
    revalidatePath("/dashboard/families")
    revalidatePath("/dashboard/kanban")

    return { success: true }
  } catch (error: any) {
    console.error("Failed to update orphan status:", error)
    return { success: false, error: error.message }
  }
}

export async function pauseOrphanSponsorship(id: string) {
  try {
    // Set active sponsorships to PAUSED and make verificationStatus APPROVED (waiting for sponsor)
    await prisma.$transaction([
      prisma.sponsorship.updateMany({
        where: {
          beneficiaryId: id,
          status: "ACTIVE"
        },
        data: {
          status: "PAUSED"
        }
      }),
      prisma.beneficiary.update({
        where: { id },
        data: {
          verificationStatus: "APPROVED"
        }
      })
    ])

    revalidatePath("/dashboard/kanban")
    revalidatePath("/dashboard/orphans")
    return { success: true }
  } catch (error: any) {
    console.error("Failed to pause sponsorship:", error)
    return { success: false, error: error.message }
  }
}

export async function activateOrphanSponsorship(id: string, sponsorId?: string) {
  try {
    const existingPaused = await prisma.sponsorship.findFirst({
      where: {
        beneficiaryId: id,
        status: { in: ["PAUSED", "STOPPED"] }
      }
    })

    if (existingPaused) {
      await prisma.sponsorship.update({
        where: { id: existingPaused.id },
        data: {
          status: "ACTIVE",
          ...(sponsorId ? { sponsorId } : {})
        }
      })
    } else {
      // Find a default sponsor and admin user if not provided
      const targetSponsorId = sponsorId || (await prisma.sponsor.findFirst())?.id
      const adminUser = await prisma.user.findFirst({
        where: { role: { in: ["ADMIN", "MANAGER"] } }
      })
      if (targetSponsorId && adminUser) {
        await prisma.sponsorship.create({
          data: {
            beneficiaryId: id,
            sponsorId: targetSponsorId,
            amount: 50.00,
            currency: "USD",
            paymentCycle: "MONTHLY",
            status: "ACTIVE",
            createdById: adminUser.id
          }
        })
      }
    }

    await prisma.beneficiary.update({
      where: { id },
      data: { verificationStatus: "APPROVED" }
    })

    revalidatePath("/dashboard/kanban")
    revalidatePath("/dashboard/orphans")
    return { success: true }
  } catch (error: any) {
    console.error("Failed to activate sponsorship:", error)
    return { success: false, error: error.message }
  }
}

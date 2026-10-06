"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { createNotification } from "@/app/actions/notification-actions"
import { sendWhatsAppNotification } from "@/lib/whatsapp-notify"
import { getCurrentUser } from "@/app/actions/auth-actions"

/**
 * جلب الكفالات التي ستنتهي خلال 30 يوم
 */
export async function getExpiringSponshorships() {
  try {
    const now = new Date()
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const expiring = await prisma.sponsorship.findMany({
      where: {
        status: "ACTIVE",
        deletedAt: null,
        endDate: {
          gte: now,
          lte: in30Days,
        },
      },
      include: {
        sponsor: { select: { fullName: true, phone: true } },
        beneficiary: {
          select: {
            id: true,
            fullName: true,
            orphanCode: true,
            family: { select: { id: true, headFullName: true, headPhoneNumber: true } },
          },
        },
      },
      orderBy: { endDate: "asc" },
    })

    return { success: true, expiring }
  } catch (error: any) {
    return { success: false, error: error.message, expiring: [] }
  }
}

/**
 * جلب الكفالات المنتهية بالفعل والتي لا تزال بحالة ACTIVE وتحتاج تجديد أو مراجعة
 */
export async function getOverdueSponsorships() {
  try {
    const now = new Date()

    const overdue = await prisma.sponsorship.findMany({
      where: {
        status: "ACTIVE",
        deletedAt: null,
        endDate: {
          lt: now,
        },
      },
      include: {
        sponsor: { select: { fullName: true, phone: true } },
        beneficiary: {
          select: {
            id: true,
            fullName: true,
            orphanCode: true,
            family: { select: { id: true, headFullName: true, headPhoneNumber: true } },
          },
        },
      },
      orderBy: { endDate: "asc" },
      take: 100,
    })

    return { success: true, overdue }
  } catch (error: any) {
    return { success: false, error: error.message, overdue: [] }
  }
}

/**
 * جلب الأسر التي لم تُزَر منذ أكثر من 90 يوم مع تفاصيل الموقع الجغرافي
 */
export async function getUnvisitedFamilies(limit: number = 100) {
  try {
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const families = await prisma.family.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        OR: [
          {
            caseActivities: {
              none: {},
            },
          },
          {
            caseActivities: {
              every: {
                createdAt: { lt: ninetyDaysAgo },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        headFullName: true,
        headPhoneNumber: true,
        vulnerabilityScore: true,
        addressDetail: true,
        subDistrict: {
          select: {
            nameAr: true,
            district: {
              select: {
                nameAr: true,
                governorate: { select: { nameAr: true } },
              },
            },
          },
        },
        caseActivities: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true, type: true, title: true },
        },
      },
      orderBy: [
        { vulnerabilityScore: "desc" },
        { headFullName: "asc" },
      ],
      take: limit,
    })

    return { success: true, families }
  } catch (error: any) {
    return { success: false, error: error.message, families: [] }
  }
}

/**
 * جلب الأيتام الذين يقتربون من سن الرشد (17.5 سنة فما فوق) أو تجاوزوا 18 سنة
 */
export async function getAgingOutOrphans() {
  try {
    const seventeenAndHalfAgo = new Date()
    seventeenAndHalfAgo.setMonth(seventeenAndHalfAgo.getMonth() - (17 * 12 + 6))

    const orphans = await prisma.beneficiary.findMany({
      where: {
        category: "ORPHAN",
        deletedAt: null,
        birthdate: {
          lte: seventeenAndHalfAgo,
        },
      },
      select: {
        id: true,
        fullName: true,
        orphanCode: true,
        birthdate: true,
        gender: true,
        sponsorships: {
          where: { status: "ACTIVE", deletedAt: null },
          select: { id: true, amount: true, sponsor: { select: { fullName: true, phone: true } } },
          take: 1,
        },
        family: {
          select: {
            id: true,
            headFullName: true,
            headPhoneNumber: true,
          },
        },
      },
      orderBy: { birthdate: "asc" },
      take: 100,
    })

    return { success: true, orphans }
  } catch (error: any) {
    return { success: false, error: error.message, orphans: [] }
  }
}

/**
 * جلب الأيتام المكفولين الذين لا يوجد لديهم رقم حساب بنكي / كريمي
 */
export async function getMissingAccountOrphans() {
  try {
    const orphans = await prisma.beneficiary.findMany({
      where: {
        category: "ORPHAN",
        deletedAt: null,
        OR: [
          { kuraimiAccount: null },
          { kuraimiAccount: "" },
        ],
        sponsorships: {
          some: {
            status: "ACTIVE",
            deletedAt: null,
          },
        },
      },
      select: {
        id: true,
        fullName: true,
        orphanCode: true,
        kuraimiAccount: true,
        family: {
          select: {
            id: true,
            headFullName: true,
            headPhoneNumber: true,
          },
        },
        sponsorships: {
          where: { status: "ACTIVE", deletedAt: null },
          select: { id: true, sponsor: { select: { fullName: true } } },
          take: 1,
        },
      },
      take: 100,
    })

    return { success: true, orphans }
  } catch (error: any) {
    return { success: false, error: error.message, orphans: [] }
  }
}

/**
 * جلب أيتام الأبوين (أشد الحالات فقراً واحتياجاً) غير المكفولين
 */
export async function getUrgentWaitingOrphans() {
  try {
    const orphans = await prisma.beneficiary.findMany({
      where: {
        category: "ORPHAN",
        deletedAt: null,
        orphanType: "BOTH",
        sponsorships: {
          none: {
            status: "ACTIVE",
            deletedAt: null,
          },
        },
      },
      select: {
        id: true,
        fullName: true,
        orphanCode: true,
        birthdate: true,
        orphanType: true,
        family: {
          select: {
            id: true,
            headFullName: true,
            headPhoneNumber: true,
            vulnerabilityScore: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    return { success: true, orphans }
  } catch (error: any) {
    return { success: false, error: error.message, orphans: [] }
  }
}

/**
 * تسجيل نشاط أو زيارة ميدانية لأسرة أو يتيم مباشرة
 */
export async function recordCaseActivity(data: {
  familyId?: string
  beneficiaryId?: string
  type: string
  title: string
  description: string
}) {
  try {
    const currentUser = await getCurrentUser()
    const activity = await prisma.caseActivity.create({
      data: {
        familyId: data.familyId || null,
        beneficiaryId: data.beneficiaryId || null,
        type: data.type || "VISIT",
        title: data.title,
        description: data.description,
        recordedById: currentUser?.id || null,
        recordedByName: currentUser?.name || "مشرف النظام",
      },
    })

    revalidatePath("/dashboard/alerts")
    revalidatePath("/dashboard/families")
    return { success: true, activity }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * فحص ومعالجة التنبيهات التلقائية
 */
export async function checkAndCreateAlerts() {
  try {
    const { expiring } = await getExpiringSponshorships()
    if (!expiring || expiring.length === 0) return { success: true, created: 0 }

    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
      select: { phone: true, name: true },
    })

    let created = 0
    for (const sp of expiring) {
      const beneficiaryName =
        sp.beneficiary?.fullName || sp.beneficiary?.family?.headFullName || "—"
      const sponsorName = sp.sponsor?.fullName || "—"
      const endDate = sp.endDate
        ? new Date(sp.endDate).toLocaleDateString("en-GB")
        : "—"

      const daysLeft = sp.endDate
        ? Math.ceil(
            (new Date(sp.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          )
        : 0

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const existingToday = await prisma.notification.findFirst({
        where: {
          title: { contains: "كفالة ستنتهي" },
          message: { contains: sp.id },
          createdAt: { gte: today },
        },
      })
      if (existingToday) continue

      await createNotification({
        title: `⚠️ كفالة ستنتهي خلال ${daysLeft} يوم`,
        message: `كفالة المستفيد "${beneficiaryName}" من الكفيل "${sponsorName}" ستنتهي بتاريخ ${endDate}. (ID: ${sp.id})`,
        type: "WARNING",
      })
      created++

      if (adminUser?.phone) {
        await sendWhatsAppNotification(
          adminUser.phone,
          `⚠️ *تنبيه: كفالة ستنتهي قريباً*\n\n` +
            `المستفيد: ${beneficiaryName}\n` +
            `الكفيل: ${sponsorName}\n` +
            `تاريخ الانتهاء: ${endDate}\n` +
            `المتبقي: ${daysLeft} يوم\n\n` +
            `يرجى التواصل مع الكفيل لتجديد الكفالة.`
        )
      }
    }

    return { success: true, created }
  } catch (error: any) {
    console.error("checkAndCreateAlerts error:", error)
    return { success: false, error: error.message, created: 0 }
  }
}

/**
 * جلب إحصائيات التنبيهات للوحة القيادة
 */
export async function getAlertStats() {
  try {
    const now = new Date()
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const [expiringCount, unvisitedCount] = await Promise.all([
      prisma.sponsorship.count({
        where: {
          status: "ACTIVE",
          deletedAt: null,
          endDate: { gte: now, lte: in30Days },
        },
      }),
      prisma.family.count({
        where: {
          isActive: true,
          deletedAt: null,
          caseActivities: { none: {} },
        },
      }),
    ])

    return { success: true, expiringCount, unvisitedCount }
  } catch (error: any) {
    return { success: false, error: error.message, expiringCount: 0, unvisitedCount: 0 }
  }
}

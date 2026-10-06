"use server"

import { prisma } from "@/lib/prisma"

// قاموس تعريب الحقول
const FIELD_LABELS: Record<string, string> = {
  headFullName: "اسم رب الأسرة",
  headPhoneNumber: "رقم هاتف رب الأسرة",
  headNationalId: "الرقم الوطني لرب الأسرة",
  fullName: "الاسم الكامل",
  orphanCode: "كود اليتيم",
  birthdate: "تاريخ الميلاد",
  gender: "الجنس",
  orphanType: "نوع اليتم",
  vulnerabilityScore: "معدل الاحتياج / الفقر",
  kuraimiAccount: "رقم حساب الكريمي",
  addressDetail: "تفاصيل السكن / العنوان",
  socialStatus: "الحالة الاجتماعية",
  monthlyIncome: "الدخل الشهري",
  housingType: "نوع السكن",
  status: "الحالة",
  isActive: "نشط / معطل",
  name: "الاسم",
  phone: "رقم الهاتف",
  email: "البريد الإلكتروني",
  role: "الدور / الصلاحية",
  amount: "المبلغ",
  startDate: "تاريخ البدء",
  endDate: "تاريخ الانتهاء",
  healthCondition: "الحالة الصحية",
  educationLevel: "المستوى التعليمي",
}

/**
 * جلب السجل الرقابي الشامل لجميع عمليات النظام مع حل الأسماء ومقارنة التعديلات
 */
export async function getGlobalAuditLogs(limit = 250) {
  try {
    const [auditLogs, totalCount, caseActivities] = await Promise.all([
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.auditLog.count(),
      prisma.caseActivity.findMany({
        include: {
          family: { select: { id: true, headFullName: true } },
          beneficiary: { select: { id: true, fullName: true, orphanCode: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ])

    // جمع المعرفات لحل الأسماء دفعة واحدة
    const beneficiaryIds = new Set<string>()
    const familyIds = new Set<string>()
    const sponsorIds = new Set<string>()
    const projectIds = new Set<string>()

    for (const log of auditLogs) {
      if (log.entityType === "BENEFICIARY" || log.entityType === "ORPHAN") {
        beneficiaryIds.add(log.entityId)
      } else if (log.entityType === "FAMILY") {
        familyIds.add(log.entityId)
      } else if (log.entityType === "SPONSOR") {
        sponsorIds.add(log.entityId)
      } else if (log.entityType === "PROJECT") {
        projectIds.add(log.entityId)
      }
    }

    const [beneficiaries, families, sponsors, projects] = await Promise.all([
      beneficiaryIds.size > 0
        ? prisma.beneficiary.findMany({
            where: { id: { in: Array.from(beneficiaryIds) } },
            select: { id: true, fullName: true, orphanCode: true },
          })
        : [],
      familyIds.size > 0
        ? prisma.family.findMany({
            where: { id: { in: Array.from(familyIds) } },
            select: { id: true, headFullName: true },
          })
        : [],
      sponsorIds.size > 0
        ? prisma.sponsor.findMany({
            where: { id: { in: Array.from(sponsorIds) } },
            select: { id: true, fullName: true },
          })
        : [],
      projectIds.size > 0
        ? prisma.project.findMany({
            where: { id: { in: Array.from(projectIds) } },
            select: { id: true, name: true },
          })
        : [],
    ])

    const nameMap: Record<string, { name: string; code?: string; link?: string }> = {}

    for (const b of beneficiaries) {
      nameMap[b.id] = { name: b.fullName, code: b.orphanCode || undefined, link: `/dashboard/orphans/${b.id}` }
    }
    for (const f of families) {
      nameMap[f.id] = { name: f.headFullName, link: `/dashboard/families` }
    }
    for (const s of sponsors) {
      nameMap[s.id] = { name: s.fullName, link: `/dashboard/sponsors` }
    }
    for (const p of projects) {
      nameMap[p.id] = { name: p.name, link: `/dashboard/projects` }
    }

    const enrichedAuditLogs = auditLogs.map((log) => {
      let rawChanges: Record<string, { old: any; new: any }> = {}
      try {
        rawChanges = JSON.parse(log.changes || "{}")
      } catch {
        rawChanges = {}
      }

      const formattedDiffs = Object.entries(rawChanges).map(([field, vals]) => {
        const fieldAr = FIELD_LABELS[field] || field
        let oldVal = vals.old
        let newVal = vals.new

        if (typeof oldVal === "boolean") oldVal = oldVal ? "نعم" : "لا"
        if (typeof newVal === "boolean") newVal = newVal ? "نعم" : "لا"
        if (oldVal === null || oldVal === undefined || oldVal === "") oldVal = "(فارغ)"
        if (newVal === null || newVal === undefined || newVal === "") newVal = "(فارغ)"

        return {
          field,
          fieldAr,
          oldVal: String(oldVal),
          newVal: String(newVal),
        }
      })

      const entityInfo = nameMap[log.entityId]

      return {
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        entityName: entityInfo?.name || log.entityId,
        entityCode: entityInfo?.code,
        entityLink: entityInfo?.link,
        userName: log.userName || "مشرف النظام",
        userEmail: log.userEmail || "admin@ngo-erp.org",
        diffs: formattedDiffs,
        changesCount: formattedDiffs.length,
        createdAt: log.createdAt,
        type: "AUDIT",
      }
    })

    const enrichedActivities = caseActivities.map((act) => ({
      id: act.id,
      action: act.type,
      entityType: act.beneficiary ? "BENEFICIARY" : "FAMILY",
      entityId: act.beneficiaryId || act.familyId || "",
      entityName: act.beneficiary?.fullName || act.family?.headFullName || "نشاط ميداني",
      entityCode: act.beneficiary?.orphanCode || undefined,
      entityLink: act.beneficiaryId ? `/dashboard/orphans/${act.beneficiaryId}` : `/dashboard/families`,
      userName: act.recordedByName || "باحث ميداني",
      userEmail: "field@ngo-erp.org",
      diffs: [],
      changesCount: 0,
      title: act.title,
      description: act.description,
      createdAt: act.createdAt,
      type: "FIELD_ACTIVITY",
    }))

    const allEvents = [...enrichedAuditLogs, ...enrichedActivities].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    // حساب الإحصائيات
    const updatesCount = enrichedAuditLogs.filter((l) => l.action === "UPDATE").length
    const createsCount = enrichedAuditLogs.filter((l) => l.action === "CREATE").length
    const deletesCount = enrichedAuditLogs.filter((l) => l.action === "DELETE").length
    const activitiesCount = enrichedActivities.length

    return {
      success: true,
      logs: allEvents,
      totalCount: totalCount + caseActivities.length,
      stats: {
        total: allEvents.length,
        updates: updatesCount,
        creates: createsCount,
        deletes: deletesCount,
        fieldActivities: activitiesCount,
      },
    }
  } catch (error: any) {
    console.error("Failed to fetch global audit logs:", error)
    return { success: false, error: error.message, logs: [], totalCount: 0, stats: null }
  }
}

export async function getAuditLogsForEntity(entityType: string, entityId: string) {
  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return {
      success: true,
      logs: logs.map((log) => ({
        ...log,
        changes: JSON.parse(log.changes || "{}"),
      })),
    }
  } catch (error: any) {
    console.error("Failed to fetch entity audit logs:", error)
    return { success: false, error: error.message, logs: [] }
  }
}

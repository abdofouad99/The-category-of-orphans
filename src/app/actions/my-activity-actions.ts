"use server"

import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/app/actions/auth-actions"

// قاموس ترجمة أسماء الحقول إلى العربية
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
 * جلب سجل نشاط المستخدم الحالي مع استخراج الأسماء الحقيقية وتفاصيل التغييرات
 */
export async function getMyActivityLog(limit = 250) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: "غير مصرح", logs: [], caseActivities: [], stats: null }
    }

    // جلب سجلات التدقيق للمستخدم
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { userId: currentUser.id },
          { userEmail: currentUser.email },
          // للمسؤول: جلب السجلات التي تمت تحت مسمى المسؤول العام إذا لم تكن مسجلة بالـ ID تحديداً
          ...(currentUser.role === "ADMIN" ? [{ userEmail: "admin@ngo-erp.org" }, { userName: "مسؤول النظام" }] : []),
        ],
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    })

    // جلب الأنشطة والزيارات الميدانية التي سجلها هذا المستخدم
    const caseActivities = await prisma.caseActivity.findMany({
      where: {
        OR: [
          { recordedById: currentUser.id },
          { recordedByName: currentUser.name },
        ],
      },
      include: {
        family: { select: { id: true, headFullName: true } },
        beneficiary: { select: { id: true, fullName: true, orphanCode: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    })

    // استخراج المعرفات لحل الأسماء الحقيقية
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

    // استعلام الأسماء دفعة واحدة
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

    // معالجة وتنسيق السجلات
    const enrichedLogs = auditLogs.map((log) => {
      let rawChanges: Record<string, { old: any; new: any }> = {}
      try {
        rawChanges = JSON.parse(log.changes || "{}")
      } catch {
        rawChanges = {}
      }

      // تحويل التغييرات إلى صيغة معربة ومفهومة
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
        diffs: formattedDiffs,
        changesCount: formattedDiffs.length,
        createdAt: log.createdAt,
        type: "AUDIT",
      }
    })

    // معالجة الأنشطة الميدانية
    const enrichedActivities = caseActivities.map((act) => ({
      id: act.id,
      action: act.type, // VISIT, CALL, etc.
      entityType: act.beneficiary ? "BENEFICIARY" : "FAMILY",
      entityId: act.beneficiaryId || act.familyId || "",
      entityName: act.beneficiary?.fullName || act.family?.headFullName || "نشاط ميداني",
      entityCode: act.beneficiary?.orphanCode || undefined,
      entityLink: act.beneficiaryId ? `/dashboard/orphans/${act.beneficiaryId}` : `/dashboard/families`,
      title: act.title,
      description: act.description,
      createdAt: act.createdAt,
      type: "FIELD_ACTIVITY",
    }))

    // دمج السجلين وترتيبهما زمنياً
    const allEvents = [...enrichedLogs, ...enrichedActivities].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    // حساب الإحصائيات
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()

    const todayActions = allEvents.filter(
      (e) => new Date(e.createdAt).getTime() >= todayStart
    ).length

    const updatesCount = enrichedLogs.filter((l) => l.action === "UPDATE").length
    const createsCount = enrichedLogs.filter((l) => l.action === "CREATE").length
    const deletesCount = enrichedLogs.filter((l) => l.action === "DELETE").length
    const fieldVisitsCount = enrichedActivities.length

    return {
      success: true,
      currentUser,
      logs: allEvents,
      stats: {
        total: allEvents.length,
        today: todayActions,
        updates: updatesCount,
        creates: createsCount,
        deletes: deletesCount,
        fieldVisits: fieldVisitsCount,
      },
    }
  } catch (error: any) {
    console.error("getMyActivityLog error:", error)
    return { success: false, error: error.message, logs: [], stats: null }
  }
}

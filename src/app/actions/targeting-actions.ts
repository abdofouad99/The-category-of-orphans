"use server"

import { prisma } from "@/lib/prisma"
import { calculateFamilyNeedScore } from "@/lib/need-score-calculator"
import { revalidatePath } from "next/cache"

export interface TargetFilterCriteria {
  minNeedScore: number
  governorateId?: string
  districtId?: string
  subDistrictId?: string
  limit?: number
  excludeAidedDays?: number  // exclude families that received aid in the last N days
  hasOrphansOnly?: boolean
  hasWidowsOnly?: boolean
  hasDisabledOnly?: boolean
  hasDisplacedOnly?: boolean
  hasUnemployedOnly?: boolean
  hasElderlyOnly?: boolean
  hasKidsUnder5Only?: boolean
  hasLargeFamilyOnly?: boolean
  noAidBefore?: boolean       // never received aid
  hasDivorcedOnly?: boolean   // socialStatus includes مطلق
}

export async function filterBeneficiariesForTargeting(criteria: TargetFilterCriteria) {
  try {
    const where: any = {
      deletedAt: null,
      isActive: true,
    }

    // --- Geography cascade ---
    if (criteria.subDistrictId) {
      where.subDistrictId = parseInt(criteria.subDistrictId)
    } else if (criteria.districtId) {
      where.subDistrict = { districtId: parseInt(criteria.districtId) }
    } else if (criteria.governorateId) {
      where.subDistrict = { district: { governorateId: parseInt(criteria.governorateId) } }
    }

    // --- Vulnerability filters (AND logic — all must be true) ---
    if (criteria.hasOrphansOnly) {
      where.OR = [{ hasOrphans: true }, { orphansCount: { gt: 0 } }]
    }
    if (criteria.hasWidowsOnly) {
      where.hasWidow = true
    }
    if (criteria.hasDisabledOnly) {
      where.specialNeedsCount = { gt: 0 }
    }
    if (criteria.hasDisplacedOnly) {
      where.isDisplaced = true
    }
    if (criteria.hasUnemployedOnly) {
      where.hasUnemployed = true
    }
    if (criteria.hasElderlyOnly) {
      where.elderlyAbove60Count = { gt: 0 }
    }
    if (criteria.hasKidsUnder5Only) {
      where.kidsUnder5Count = { gt: 0 }
    }
    if (criteria.hasLargeFamilyOnly) {
      // Large family = 6+ members
      where.manualMembersCount = { gte: 6 }
    }
    if (criteria.noAidBefore) {
      where.receivedAidBefore = { not: true }
    }
    if (criteria.hasDivorcedOnly) {
      where.socialStatus = { contains: "مطلق", mode: "insensitive" }
    }

    // --- Exclude families that received aid in the last N days ---
    let excludedFamilyIds: Set<string> = new Set()
    if (criteria.excludeAidedDays && criteria.excludeAidedDays > 0) {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - criteria.excludeAidedDays)

      // Find families that had aid delivered recently via ProjectBeneficiary
      const recentAid = await prisma.projectBeneficiary.findMany({
        where: {
          isDelivered: true,
          createdAt: { gte: cutoffDate },
          beneficiary: { deletedAt: null },
        },
        select: { beneficiary: { select: { familyId: true } } },
      })
      for (const rec of recentAid) {
        if (rec.beneficiary?.familyId) {
          excludedFamilyIds.add(rec.beneficiary.familyId)
        }
      }
    }

    const families = await prisma.family.findMany({
      where,
      include: {
        subDistrict: {
          include: {
            district: {
              include: { governorate: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Score each family
    const scored = families
      .filter(fam => !excludedFamilyIds.has(fam.id))
      .map(fam => {
        const scoreRes = calculateFamilyNeedScore({
          manualMembersCount: fam.manualMembersCount,
          familyMembersCount: fam.familyMembersCount,
          monthlyIncome: fam.monthlyIncome,
          orphansCount: fam.orphansCount,
          hasOrphans: fam.hasOrphans,
          hasWidow: fam.hasWidow,
          specialNeedsCount: fam.specialNeedsCount,
          kidsUnder5Count: fam.kidsUnder5Count,
          elderlyAbove60Count: fam.elderlyAbove60Count,
          housingCondition: fam.housingCondition,
          housingType: fam.housingType,
          povertyLevel: fam.povertyLevel,
        })

        return {
          family: fam,
          needScore: scoreRes.score,
          priorityAr: scoreRes.priorityAr,
          reasons: scoreRes.reasons,
        }
      })
      .filter(item => item.needScore >= criteria.minNeedScore)

    // Sort by highest need score
    scored.sort((a, b) => b.needScore - a.needScore)

    const totalMatched = scored.length
    const finalResults = criteria.limit && criteria.limit > 0
      ? scored.slice(0, criteria.limit)
      : scored

    return {
      success: true,
      totalMatched,
      results: JSON.parse(JSON.stringify(finalResults)),
    }
  } catch (error: any) {
    console.error("filterBeneficiariesForTargeting error:", error)
    return { success: false, error: "فشل استعلام الاستهداف", results: [], totalMatched: 0 }
  }
}

export async function createDistributionFromTargeting(
  projectName: string,
  itemDescription: string,
  familyIds: string[]
) {
  try {
    if (!projectName || familyIds.length === 0) {
      return { success: false, error: "بيانات المشروع أو المستفيدين غير مكتملة" }
    }

    // Get a system user for audit (admin or manager)
    const systemUser = await prisma.user.findFirst({
      where: { role: { in: ["ADMIN", "MANAGER"] } },
      select: { id: true },
    })
    if (!systemUser) return { success: false, error: "لا يوجد مستخدم مدير في النظام" }

    // Create a new Project — category IN_KIND = عيني (سلل، ملابس...)
    const project = await prisma.project.create({
      data: {
        name: projectName,
        description: `مشروع استهداف آلي — ${itemDescription}`,
        category: "IN_KIND",
        currency: "USD",
        startDate: new Date(),
        createdById: systemUser.id,
      },
    })

    // Get beneficiary IDs for these families (first member per family)
    const beneficiaries = await prisma.beneficiary.findMany({
      where: { familyId: { in: familyIds }, isActive: true, deletedAt: null },
      select: { id: true, familyId: true },
    })

    // Map: one beneficiary per family (the first found)
    const familyToBeneficiary: Record<string, string> = {}
    for (const b of beneficiaries) {
      if (!familyToBeneficiary[b.familyId]) {
        familyToBeneficiary[b.familyId] = b.id
      }
    }

    const records = Object.values(familyToBeneficiary).map(beneficiaryId => ({
      projectId: project.id,
      beneficiaryId,
      batchNumber: 1,
      deliveredItem: itemDescription,
      isDelivered: false,
    }))

    if (records.length > 0) {
      await prisma.projectBeneficiary.createMany({ data: records })
    }

    revalidatePath("/dashboard/projects")
    revalidatePath("/dashboard/targeting")

    return { success: true, projectId: project.id, linked: records.length }
  } catch (error: any) {
    console.error("createDistributionFromTargeting error:", error)
    return { success: false, error: "حدث خطأ أثناء إنشاء كشف التوزيع" }
  }
}

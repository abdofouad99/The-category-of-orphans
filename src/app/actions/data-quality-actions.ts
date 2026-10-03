"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

function computeCompletenessScore(fam: any): number {
  let score = 0
  if (fam.headFullName && fam.headFullName.trim().length > 3) score += 2
  if (fam.headNationalId && fam.headNationalId.trim().length > 5) score += 3
  if (fam.headPhoneNumber && fam.headPhoneNumber.trim().length > 5) score += 2
  if (fam.addressDetail && fam.addressDetail.trim().length > 3) score += 2
  if (fam.subDistrictId) score += 1
  if (fam.manualMembersCount || fam.familyMembersCount) score += 1
  if (fam._count?.members) score += fam._count.members * 3
  if (fam._count?.attachments) score += fam._count.attachments * 2
  if (fam._count?.sponsorships) score += fam._count.sponsorships * 4
  return score
}

export async function scanDataQualityIssues() {
  try {
    const families = await prisma.family.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        headFullName: true,
        headNationalId: true,
        headPhoneNumber: true,
        headAltPhone: true,
        familyMembersCount: true,
        manualMembersCount: true,
        subDistrictId: true,
        addressDetail: true,
        createdAt: true,
        subDistrict: {
          select: {
            nameAr: true,
            district: {
              select: {
                nameAr: true,
                governorate: {
                  select: { nameAr: true },
                },
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            attachments: true,
            sponsorships: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const totalFamilies = families.length

    // 1. Group Duplicates
    const duplicatesById: Record<string, any[]> = {}
    const duplicatesByPhone: Record<string, any[]> = {}
    const duplicatesByName: Record<string, any[]> = {}
    const incompleteFamilies: any[] = []
    const duplicateFamilyIdsSet = new Set<string>()

    for (const fam of families) {
      const enrichedFam = {
        ...fam,
        completenessScore: computeCompletenessScore(fam),
      }

      // Duplicates by National ID
      if (fam.headNationalId && fam.headNationalId.trim().length > 4) {
        const key = fam.headNationalId.trim()
        if (!duplicatesById[key]) duplicatesById[key] = []
        duplicatesById[key].push(enrichedFam)
      }

      // Duplicates by Phone
      if (fam.headPhoneNumber && fam.headPhoneNumber.trim().length > 5) {
        const key = fam.headPhoneNumber.trim()
        if (!duplicatesByPhone[key]) duplicatesByPhone[key] = []
        duplicatesByPhone[key].push(enrichedFam)
      }

      // Duplicates by Full Name
      if (fam.headFullName && fam.headFullName.trim().length > 6) {
        const key = fam.headFullName.trim()
        if (!duplicatesByName[key]) duplicatesByName[key] = []
        duplicatesByName[key].push(enrichedFam)
      }

      // Incomplete data check
      const isMissingPhone = !fam.headPhoneNumber || fam.headPhoneNumber.trim().length === 0
      const isMissingAddress = !fam.addressDetail || fam.addressDetail.trim().length === 0
      const isMissingMembers = !fam.manualMembersCount && !fam.familyMembersCount

      if (isMissingPhone || isMissingAddress || isMissingMembers) {
        incompleteFamilies.push({
          family: enrichedFam,
          missingPhone: isMissingPhone,
          missingAddress: isMissingAddress,
          missingMembers: isMissingMembers,
        })
      }
    }

    // Filter duplicate groups with count > 1 and sort items by completenessScore DESC
    const sortGroupByCompleteness = (list: any[]) => {
      list.forEach(item => duplicateFamilyIdsSet.add(item.id))
      return [...list].sort((a, b) => (b.completenessScore || 0) - (a.completenessScore || 0))
    }

    const duplicateIdGroups = Object.entries(duplicatesById)
      .filter(([_, list]) => list.length > 1)
      .map(([idVal, list]) => ({
        type: "NATIONAL_ID",
        value: idVal,
        items: sortGroupByCompleteness(list),
      }))

    const duplicatePhoneGroups = Object.entries(duplicatesByPhone)
      .filter(([_, list]) => list.length > 1)
      .map(([phoneVal, list]) => ({
        type: "PHONE",
        value: phoneVal,
        items: sortGroupByCompleteness(list),
      }))

    const duplicateNameGroups = Object.entries(duplicatesByName)
      .filter(([_, list]) => list.length > 1)
      .map(([nameVal, list]) => ({
        type: "NAME",
        value: nameVal,
        items: sortGroupByCompleteness(list),
      }))

    // Calculate real dynamic quality health score
    const uniqueDuplicateCount = duplicateFamilyIdsSet.size
    const incompleteCount = incompleteFamilies.length
    const issuesCount = Math.min(totalFamilies, uniqueDuplicateCount + incompleteCount)
    const healthScore =
      totalFamilies > 0
        ? Math.max(0, Math.min(100, Math.round(((totalFamilies - issuesCount) / totalFamilies) * 1000) / 10))
        : 100

    const result = {
      success: true,
      totalFamilies,
      healthScore,
      duplicateIdGroups,
      duplicatePhoneGroups,
      duplicateNameGroups,
      incompleteFamilies,
      totalDuplicatesCount: duplicateIdGroups.length + duplicatePhoneGroups.length + duplicateNameGroups.length,
      totalIncompleteCount: incompleteFamilies.length,
    }

    return JSON.parse(JSON.stringify(result))
  } catch (error: any) {
    console.error("scanDataQualityIssues error:", error)
    return {
      success: false,
      error: "فشل فحص جودة البيانات",
      totalFamilies: 0,
      healthScore: 100,
      duplicateIdGroups: [],
      duplicatePhoneGroups: [],
      duplicateNameGroups: [],
      incompleteFamilies: [],
      totalDuplicatesCount: 0,
      totalIncompleteCount: 0,
    }
  }
}

// Smart Merge: moves all relations and backfills empty fields on primary
export async function mergeDuplicateFamilies(primaryFamilyId: string, duplicateFamilyId: string) {
  try {
    if (!primaryFamilyId || !duplicateFamilyId || primaryFamilyId === duplicateFamilyId) {
      return { success: false, error: "المعرفات غير صحيحة" }
    }

    const [primary, duplicate] = await Promise.all([
      prisma.family.findUnique({ where: { id: primaryFamilyId } }),
      prisma.family.findUnique({ where: { id: duplicateFamilyId } }),
    ])

    if (!primary || !duplicate) {
      return { success: false, error: "أحد السجلين غير موجود" }
    }

    // 1. Backfill missing fields on primary from duplicate
    const backfillData: any = {}
    const fieldsToBackfill = [
      "headPhoneNumber",
      "headAltPhone",
      "headWhatsApp",
      "addressDetail",
      "nearestLandmark",
      "rentAmount",
      "waterSource",
      "electricitySource",
      "housingNotes",
      "housingType",
      "housingCondition",
      "monthlyIncome",
      "manualMembersCount",
      "manualMalesCount",
      "manualFemalesCount",
      "kidsUnder5Count",
      "kids5To17Count",
      "adults18To59Count",
      "elderlyAbove60Count",
      "specialNeedsCount",
      "disabilityType",
      "guardianName",
      "guardianRelation",
      "guardianPhone",
      "socialStatus",
      "povertyLevel",
      "kuraimiAccountYemeni",
      "kuraimiAccountSaudi",
    ]

    for (const field of fieldsToBackfill) {
      if ((primary as any)[field] == null || (primary as any)[field] === "") {
        if ((duplicate as any)[field] != null && (duplicate as any)[field] !== "") {
          backfillData[field] = (duplicate as any)[field]
        }
      }
    }

    // 2. Move all beneficiaries (orphans & members)
    await prisma.beneficiary.updateMany({
      where: { familyId: duplicateFamilyId },
      data: { familyId: primaryFamilyId },
    })

    // 3. Move all patients
    await prisma.patient.updateMany({
      where: { familyId: duplicateFamilyId },
      data: { familyId: primaryFamilyId },
    })

    // 4. Move attachments
    await prisma.attachment.updateMany({
      where: { familyId: duplicateFamilyId },
      data: { familyId: primaryFamilyId },
    })

    // 5. Move household sponsorships
    await prisma.sponsorship.updateMany({
      where: { familyId: duplicateFamilyId },
      data: { familyId: primaryFamilyId },
    })

    // 6. Move case activities
    await prisma.caseActivity.updateMany({
      where: { familyId: duplicateFamilyId },
      data: { familyId: primaryFamilyId },
    })

    // 7. Handle FamilyTags safely
    const duplicateTags = await prisma.familyTag.findMany({
      where: { familyId: duplicateFamilyId },
    })
    for (const dTag of duplicateTags) {
      const existing = await prisma.familyTag.findUnique({
        where: {
          familyId_tagId: {
            familyId: primaryFamilyId,
            tagId: dTag.tagId,
          },
        },
      })
      if (!existing) {
        await prisma.familyTag.update({
          where: { id: dTag.id },
          data: { familyId: primaryFamilyId },
        })
      }
    }

    // 8. Update primary with backfilled data if any
    if (Object.keys(backfillData).length > 0) {
      await prisma.family.update({
        where: { id: primaryFamilyId },
        data: backfillData,
      })
    }

    // 9. Soft-delete the duplicate family record
    await prisma.family.update({
      where: { id: duplicateFamilyId },
      data: {
        deletedAt: new Date(),
        isActive: false,
        notes: `${duplicate.notes ? duplicate.notes + " | " : ""}تم دمج السجل آلياً في السجل الرئيسي ID: ${primaryFamilyId}`,
      },
    })

    revalidatePath("/dashboard/data-quality")
    revalidatePath("/dashboard/families")

    return { success: true }
  } catch (error: any) {
    console.error("mergeDuplicateFamilies error:", error)
    return { success: false, error: "فشل عملية دمج الأسرتين المكررتين" }
  }
}

// Bulk merge multiple duplicates into one primary family
export async function mergeMultipleDuplicateFamilies(primaryFamilyId: string, duplicateFamilyIds: string[]) {
  try {
    let successCount = 0
    for (const dupId of duplicateFamilyIds) {
      if (dupId && dupId !== primaryFamilyId) {
        const res = await mergeDuplicateFamilies(primaryFamilyId, dupId)
        if (res.success) successCount++
      }
    }

    revalidatePath("/dashboard/data-quality")
    revalidatePath("/dashboard/families")

    return { success: true, count: successCount }
  } catch (error: any) {
    console.error("mergeMultipleDuplicateFamilies error:", error)
    return { success: false, error: "فشل دمج السجلات المكررة المحددة" }
  }
}

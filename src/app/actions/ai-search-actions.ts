"use server"

import { prisma } from "@/lib/prisma"

export interface AISearchResult {
  type: "STAT" | "ORPHANS" | "FAMILIES" | "SPONSORSHIPS" | "NAV"
  title: string
  description: string
  actionUrl?: string
  actionLabel?: string
  badge?: string
  data?: any
}

export interface NaturalQueryResponse {
  success: boolean
  answer: string
  results: AISearchResult[]
  interpretedIntent?: string
}

/**
 * Universal Natural Language AI Query Engine
 * Parses natural queries in Arabic and retrieves precise answers, records, and statistics
 */
export async function naturalLanguageQuery(rawQuery: string): Promise<NaturalQueryResponse> {
  const query = (rawQuery || "").trim().toLowerCase()
  if (!query) {
    return {
      success: true,
      answer: "يرجى كتابة سؤال أو استفسار للبدء.",
      results: [],
    }
  }

  try {
    const results: AISearchResult[] = []
    let answer = ""

    // 1. استعلامات الأيتام غير المكفولين
    if (query.includes("غير مكفول") || query.includes("بدون كفيل") || query.includes("غير المكفولين") || query.includes("غير مكفولين")) {
      const unsponsoredOrphans = await prisma.beneficiary.findMany({
        where: {
          category: "ORPHAN",
          deletedAt: null,
          sponsorships: {
            none: {
              status: "ACTIVE",
              deletedAt: null,
            },
          },
        },
        include: {
          family: {
            include: {
              subDistrict: {
                include: {
                  district: {
                    include: {
                      governorate: true,
                    },
                  },
                },
              },
            },
          },
        },
        take: 8,
        orderBy: { createdAt: "desc" },
      })

      const totalUnsponsored = await prisma.beneficiary.count({
        where: {
          category: "ORPHAN",
          deletedAt: null,
          sponsorships: {
            none: {
              status: "ACTIVE",
              deletedAt: null,
            },
          },
        },
      })

      answer = `يوجد في النظام حالياً ${totalUnsponsored.toLocaleString("ar-SA-u-nu-latn")} يتيم بحاجة لكفالة (غير مكفولين).`

      results.push({
        type: "STAT",
        title: "إجمالي الأيتام غير المكفولين",
        description: `${totalUnsponsored} يتيم ينتظرون الكفالة والرعاية`,
        actionUrl: "/dashboard/orphans",
        actionLabel: "عرض كل الأيتام في قائمة الأيتام",
        badge: "أولوية قصوى",
      })

      unsponsoredOrphans.forEach((orphan) => {
        const gov = orphan.family?.subDistrict?.district?.governorate?.nameAr || "غير محدد"
        results.push({
          type: "ORPHANS",
          title: orphan.fullName,
          description: `المحافظة: ${gov} | كود: ${orphan.orphanCode || "-"} | العمر: ${orphan.birthdate ? Math.floor((Date.now() - new Date(orphan.birthdate).getTime()) / (365.25 * 24 * 3600 * 1000)) + " سنة" : "غير محدد"}`,
          actionUrl: `/dashboard/orphans/${orphan.id}`,
          actionLabel: "عرض ملف اليتيم",
          badge: "غير مكفول",
        })
      })

      return {
        success: true,
        answer,
        results,
        interpretedIntent: "حصر الأيتام غير المكفولين",
      }
    }

    // 2. استعلامات حسابات بنك الكريمي المفقودة
    if (query.includes("كريمي") || query.includes("حساب") || query.includes("حسابات")) {
      const missingKuraimi = await prisma.beneficiary.findMany({
        where: {
          category: "ORPHAN",
          deletedAt: null,
          OR: [
            { kuraimiAccount: null },
            { kuraimiAccount: "" },
          ],
        },
        include: {
          family: true,
        },
        take: 6,
        orderBy: { createdAt: "desc" },
      })

      const totalMissing = await prisma.beneficiary.count({
        where: {
          category: "ORPHAN",
          deletedAt: null,
          OR: [
            { kuraimiAccount: null },
            { kuraimiAccount: "" },
          ],
        },
      })

      answer = `يوجد ${totalMissing.toLocaleString("ar-SA-u-nu-latn")} يتيم مسجل بدون رقم حساب كريمي، مما قد يؤخر صرف المستحقات.`

      results.push({
        type: "STAT",
        title: "أيتام بدون حساب كريمي",
        description: `${totalMissing} يتيم يحتاجون لتسجيل حساب بنكي للصرف`,
        actionUrl: "/dashboard/alerts",
        actionLabel: "الانتقال للتنبيهات الذكية",
        badge: "نقص بيانات",
      })

      missingKuraimi.forEach((o) => {
        results.push({
          type: "ORPHANS",
          title: o.fullName,
          description: `رب الأسرة: ${o.family?.headFullName || "-"} | هاتف: ${o.family?.headPhoneNumber || "-"}`,
          actionUrl: `/dashboard/orphans/${o.id}`,
          actionLabel: "تحديث ملف اليتيم",
          badge: "بدون حساب",
        })
      })

      return {
        success: true,
        answer,
        results,
        interpretedIntent: "البحث عن الأيتام بدون حساب بنك الكريمي",
      }
    }

    // 3. استعلامات الأسر الأشد فقراً / الهشاشة
    if (query.includes("فقر") || query.includes("شديد") || query.includes("هشاشة") || query.includes("الاشد") || query.includes("أشد")) {
      const severeFamilies = await prisma.family.findMany({
        where: {
          deletedAt: null,
          OR: [
            { povertyLevel: "SEVERE" },
            { vulnerabilityScore: { gte: 80 } },
          ],
        },
        include: {
          subDistrict: {
            include: {
              district: {
                include: {
                  governorate: true,
                },
              },
            },
          },
        },
        take: 6,
        orderBy: { vulnerabilityScore: "desc" },
      })

      const totalSevere = await prisma.family.count({
        where: {
          deletedAt: null,
          povertyLevel: "SEVERE",
        },
      })

      answer = `تم رصد ${totalSevere.toLocaleString("ar-SA-u-nu-latn")} أسرة مصنفة ضمن فئة (الفقر الشديد / الهشاشة الحرجة).`

      results.push({
        type: "STAT",
        title: "أسر الفقر الشديد",
        description: `${totalSevere} أسرة ذات مؤشر احتياج حرج`,
        actionUrl: "/dashboard/families",
        actionLabel: "إدارة ملفات الأسر",
        badge: "أولوية إغاثية",
      })

      severeFamilies.forEach((f) => {
        const gov = f.subDistrict?.district?.governorate?.nameAr || "اليمن"
        results.push({
          type: "FAMILIES",
          title: f.headFullName,
          description: `المحافظة: ${gov} | درجة الهشاشة: ${f.vulnerabilityScore || 0}/100 | مستوى الفقر: ${f.povertyLevel === "SEVERE" ? "شديد" : "متوسط"}`,
          actionUrl: `/dashboard/families`,
          actionLabel: "عرض تفاصيل الأسرة",
          badge: "هشاشة عالية",
        })
      })

      return {
        success: true,
        answer,
        results,
        interpretedIntent: "حصر أسر الفقر الشديد ومؤشرات الهشاشة",
      }
    }

    // 4. استعلامات انتهاء الكفالات
    if (query.includes("كفالة") || query.includes("تنتهي") || query.includes("منتهية") || query.includes("متأخرة")) {
      const today = new Date()
      const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

      const expiringSponsorships = await prisma.sponsorship.findMany({
        where: {
          deletedAt: null,
          status: "ACTIVE",
          endDate: {
            lte: nextMonth,
          },
        },
        include: {
          sponsor: true,
          beneficiary: true,
        },
        take: 6,
        orderBy: { endDate: "asc" },
      })

      const countExpiring = await prisma.sponsorship.count({
        where: {
          deletedAt: null,
          status: "ACTIVE",
          endDate: {
            lte: nextMonth,
          },
        },
      })

      answer = `يوجد ${countExpiring.toLocaleString("ar-SA-u-nu-latn")} كفالة نشطة شارفت على الانتهاء خلال الثلاثين يوماً القادمة أو متأخرة التجديد.`

      results.push({
        type: "STAT",
        title: "كفالات تقترب من الانتهاء",
        description: `${countExpiring} كفالة تتطلب التواصل مع الكفيل للتجديد`,
        actionUrl: "/dashboard/sponsors",
        actionLabel: "إدارة الكفلاء والكفالات",
        badge: "متابعة التجديد",
      })

      expiringSponsorships.forEach((sp) => {
        results.push({
          type: "SPONSORSHIPS",
          title: `كفالة اليتيم: ${sp.beneficiary?.fullName || "-"}`,
          description: `الكفيل: ${sp.sponsor?.fullName || "-"} | المبلغ: ${sp.amount} ${sp.currency} | تاريخ الانتهاء: ${sp.endDate ? new Date(sp.endDate).toLocaleDateString("ar-SA") : "-"}`,
          actionUrl: "/dashboard/sponsors",
          actionLabel: "متابعة الكفيل",
          badge: "توشك على الانتهاء",
        })
      })

      return {
        success: true,
        answer,
        results,
        interpretedIntent: "متابعة الكفالات المنتهية أو القريبة من الانتهاء",
      }
    }

    // 5. استعلامات الأعداد والإحصائيات العامة (كم عدد / إحصائية / كم)
    if (query.includes("كم") || query.includes("عدد") || query.includes("إحصاء") || query.includes("احصائيات")) {
      const [orphansCount, maleCount, femaleCount, familiesCount, sponsorsCount, activeSponsorships] = await Promise.all([
        prisma.beneficiary.count({ where: { category: "ORPHAN", deletedAt: null } }),
        prisma.beneficiary.count({ where: { category: "ORPHAN", gender: "MALE", deletedAt: null } }),
        prisma.beneficiary.count({ where: { category: "ORPHAN", gender: "FEMALE", deletedAt: null } }),
        prisma.family.count({ where: { deletedAt: null } }),
        prisma.sponsor.count({ where: { deletedAt: null } }),
        prisma.sponsorship.count({ where: { status: "ACTIVE", deletedAt: null } }),
      ])

      if (query.includes("انثى") || query.includes("إناث") || query.includes("بنات")) {
        answer = `عدد الأيتام الإناث المسجلات في النظام هو ${femaleCount.toLocaleString("ar-SA-u-nu-latn")} يتيمة.`
        results.push({
          type: "STAT",
          title: "الأيتام الإناث",
          description: `يمثلن ${Math.round((femaleCount / (orphansCount || 1)) * 100)}% من إجمالي الأيتام`,
          actionUrl: "/dashboard/orphans",
          actionLabel: "عرض قائمة الأيتام",
          badge: "إحصائية جنسية",
        })
      } else if (query.includes("ذكر") || query.includes("ذكور") || query.includes("أولاد")) {
        answer = `عدد الأيتام الذكور المسجلين في النظام هو ${maleCount.toLocaleString("ar-SA-u-nu-latn")} يتيماً.`
        results.push({
          type: "STAT",
          title: "الأيتام الذكور",
          description: `يمثلون ${Math.round((maleCount / (orphansCount || 1)) * 100)}% من إجمالي الأيتام`,
          actionUrl: "/dashboard/orphans",
          actionLabel: "عرض قائمة الأيتام",
          badge: "إحصائية جنسية",
        })
      } else {
        answer = `الإحصائيات الإجمالية: ${orphansCount} يتيم (${maleCount} ذكور، ${femaleCount} إناث)، و${familiesCount} أسرة، و${sponsorsCount} كفيل مع ${activeSponsorships} كفالة نشطة.`
        results.push({
          type: "STAT",
          title: "إجمالي الأيتام",
          description: `${orphansCount} يتيم مسجل في النظام`,
          actionUrl: "/dashboard/orphans",
          actionLabel: "صفحة الأيتام",
        })
        results.push({
          type: "STAT",
          title: "إجمالي الأسر",
          description: `${familiesCount} أسرة مستفيدة`,
          actionUrl: "/dashboard/families",
          actionLabel: "صفحة الأسر",
        })
        results.push({
          type: "STAT",
          title: "الكفالات النشطة",
          description: `${activeSponsorships} كفالة جارية لـ ${sponsorsCount} كفيل`,
          actionUrl: "/dashboard/sponsors",
          actionLabel: "صفحة الكفالات",
        })
      }

      return {
        success: true,
        answer,
        results,
        interpretedIntent: "استخراج الإحصائيات العامة",
      }
    }

    // 6. البحث الذكي الموحد الشامل (Fallback Direct Smart Search)
    const [matchingOrphans, matchingFamilies, matchingSponsors, matchingProjects] = await Promise.all([
      prisma.beneficiary.findMany({
        where: {
          deletedAt: null,
          OR: [
            { fullName: { contains: query, mode: "insensitive" } },
            { orphanCode: { contains: query, mode: "insensitive" } },
            { nationalId: { contains: query } },
          ],
        },
        take: 4,
        include: { family: true },
      }),
      prisma.family.findMany({
        where: {
          deletedAt: null,
          OR: [
            { headFullName: { contains: query, mode: "insensitive" } },
            { headNationalId: { contains: query } },
            { headPhoneNumber: { contains: query } },
          ],
        },
        take: 3,
      }),
      prisma.sponsor.findMany({
        where: {
          deletedAt: null,
          OR: [
            { fullName: { contains: query, mode: "insensitive" } },
            { phone: { contains: query } },
            { organization: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 3,
      }),
      prisma.project.findMany({
        where: {
          deletedAt: null,
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 2,
      }),
    ])

    const totalFound = matchingOrphans.length + matchingFamilies.length + matchingSponsors.length + matchingProjects.length

    if (totalFound > 0) {
      answer = `تم العثور على ${totalFound} نتيجة مطابقة لـ "${rawQuery}".`

      matchingOrphans.forEach((o) => {
        results.push({
          type: "ORPHANS",
          title: o.fullName,
          description: `يتيم | كود: ${o.orphanCode || "-"} | الأسرة: ${o.family?.headFullName || "-"}`,
          actionUrl: `/dashboard/orphans/${o.id}`,
          actionLabel: "عرض ملف اليتيم",
          badge: "يتيم",
        })
      })

      matchingFamilies.forEach((f) => {
        results.push({
          type: "FAMILIES",
          title: f.headFullName,
          description: `أسرة | هوية: ${f.headNationalId} | هاتف: ${f.headPhoneNumber || "-"}`,
          actionUrl: "/dashboard/families",
          actionLabel: "عرض ملف الأسرة",
          badge: "أسرة",
        })
      })

      matchingSponsors.forEach((s) => {
        results.push({
          type: "SPONSORSHIPS",
          title: s.fullName,
          description: `كفيل | جهة: ${s.organization || "فرد"} | هاتف: ${s.phone || "-"}`,
          actionUrl: "/dashboard/sponsors",
          actionLabel: "عرض الكفيل",
          badge: "كفيل",
        })
      })

      matchingProjects.forEach((p) => {
        results.push({
          type: "NAV",
          title: p.name,
          description: `مشروع | الحالة: ${p.status} | المستهدف: ${p.targetCount || 0}`,
          actionUrl: "/dashboard/projects",
          actionLabel: "عرض المشروع",
          badge: "مشروع",
        })
      })
    } else {
      answer = `لم أعثر على نتائج محددة لـ "${rawQuery}". يمكنك تجربة أسئلة مثل: "الأيتام غير المكفولين"، "أسر الفقر الشديد"، "كفالات تنتهي قريباً"، أو كتابة اسم شخص أو رقم هوية.`
      results.push({
        type: "NAV",
        title: "تصفح الأيتام",
        description: "عرض كافة ملفات الأيتام والبحث المتقدم",
        actionUrl: "/dashboard/orphans",
        actionLabel: "فتح صفحة الأيتام",
      })
      results.push({
        type: "NAV",
        title: "التنبيهات الذكية",
        description: "استعراض الإشعارات التلقائية للمنظومة",
        actionUrl: "/dashboard/alerts",
        actionLabel: "فتح صفحة التنبيهات",
      })
    }

    return {
      success: true,
      answer,
      results,
      interpretedIntent: "بحث واستعلام تلقائي",
    }
  } catch (error: any) {
    console.error("AI Search Query Error:", error)
    return {
      success: false,
      answer: "حدث خطأ أثناء معالجة الاستعلام الذكي.",
      results: [],
    }
  }
}

"use client"

import { useState, useTransition, useMemo } from "react"
import Link from "next/link"
import {
  ShieldCheck,
  AlertTriangle,
  Copy,
  GitMerge,
  Loader2,
  FileQuestion,
  PhoneOff,
  MapPinOff,
  Users,
  CheckCircle2,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  MapPin,
  Paperclip,
  HeartHandshake,
  Check,
  Filter,
  EyeOff,
} from "lucide-react"
import {
  mergeDuplicateFamilies,
  mergeMultipleDuplicateFamilies,
  scanDataQualityIssues,
} from "@/app/actions/data-quality-actions"

interface DataQualityClientProps {
  initialData: any
}

export function DataQualityClient({ initialData }: DataQualityClientProps) {
  const [data, setData] = useState(initialData)
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<"duplicates" | "incomplete">("duplicates")

  // Duplicate Tab State
  const [duplicateFilterType, setDuplicateFilterType] = useState<"ALL" | "PHONE" | "NAME" | "NATIONAL_ID">("ALL")
  const [duplicateSearch, setDuplicateSearch] = useState("")
  const [mergingId, setMergingId] = useState<string | null>(null)
  const [bulkMergingGroupKey, setBulkMergingGroupKey] = useState<string | null>(null)
  const [selectedPrimaryMap, setSelectedPrimaryMap] = useState<Record<string, string>>({})
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [dismissedGroupKeys, setDismissedGroupKeys] = useState<string[]>([])

  // Incomplete Tab State
  const [incompleteFilterType, setIncompleteFilterType] = useState<"ALL" | "PHONE" | "ADDRESS" | "MEMBERS">("ALL")
  const [incompleteSearch, setIncompleteSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 25

  function handleRescan() {
    startTransition(async () => {
      const res = await scanDataQualityIssues()
      if (res.success) {
        setData(res)
        setSelectedPrimaryMap({})
        setDismissedGroupKeys([])
      }
    })
  }

  // Handle single duplicate merge
  async function handleMerge(primaryId: string, duplicateId: string) {
    if (
      !confirm(
        "هل أنت متأكد من دمج هذا السجل في السجل الرئيسي المختار؟\nسيتم نقل جميع الأيتام، المستفيدين، المرفقات، والكفالات إلى السجل الرئيسي، وإلغاء تنشيط السجل المكرر."
      )
    ) {
      return
    }

    setMergingId(duplicateId)
    const res = await mergeDuplicateFamilies(primaryId, duplicateId)
    setMergingId(null)

    if (res.success) {
      handleRescan()
    } else {
      alert(res.error || "فشل دمج السجلين")
    }
  }

  // Handle bulk merge all in a group
  async function handleBulkMerge(groupKey: string, primaryId: string, allItems: any[]) {
    const duplicateIds = allItems.filter(item => item.id !== primaryId).map(item => item.id)
    if (duplicateIds.length === 0) return

    if (
      !confirm(
        `هل أنت متأكد من دمج كافة السجلات المكررة (${duplicateIds.length} سجل) في السجل الرئيسي دفعة واحدة؟\nسيتم نقل كافة البيانات والأيتام والمرفقات وحفظها داخل السجل الرئيسي.`
      )
    ) {
      return
    }

    setBulkMergingGroupKey(groupKey)
    const res = await mergeMultipleDuplicateFamilies(primaryId, duplicateIds)
    setBulkMergingGroupKey(null)

    if (res.success) {
      handleRescan()
    } else {
      alert(res.error || "فشل الدمج الجماعي")
    }
  }

  // Dismiss a group from view for this session
  function handleDismissGroup(groupKey: string) {
    setDismissedGroupKeys(prev => [...prev, groupKey])
  }

  // Combine and filter duplicate groups
  const filteredDuplicateGroups = useMemo(() => {
    const allGroups: any[] = [
      ...(data?.duplicateIdGroups || []),
      ...(data?.duplicatePhoneGroups || []),
      ...(data?.duplicateNameGroups || []),
    ]

    return allGroups.filter((group: any) => {
      const groupKey = `${group.type}_${group.value}`
      if (dismissedGroupKeys.includes(groupKey)) return false

      // Type filter
      if (duplicateFilterType !== "ALL" && group.type !== duplicateFilterType) {
        return false
      }

      // Search query
      if (duplicateSearch.trim()) {
        const q = duplicateSearch.trim().toLowerCase()
        const matchesValue = group.value?.toLowerCase().includes(q)
        const matchesMember = group.items.some(
          (it: any) =>
            it.headFullName?.toLowerCase().includes(q) ||
            it.headNationalId?.toLowerCase().includes(q) ||
            it.headPhoneNumber?.includes(q) ||
            it.id.toLowerCase().includes(q)
        )
        if (!matchesValue && !matchesMember) return false
      }

      return true
    })
  }, [data, duplicateFilterType, duplicateSearch, dismissedGroupKeys])

  // Filter incomplete families
  const filteredIncompleteFamilies = useMemo(() => {
    const list: any[] = data?.incompleteFamilies || []

    return list.filter((item: any) => {
      // Type filter
      if (incompleteFilterType === "PHONE" && !item.missingPhone) return false
      if (incompleteFilterType === "ADDRESS" && !item.missingAddress) return false
      if (incompleteFilterType === "MEMBERS" && !item.missingMembers) return false

      // Search filter
      if (incompleteSearch.trim()) {
        const q = incompleteSearch.trim().toLowerCase()
        const fam = item.family
        const matches =
          fam.headFullName?.toLowerCase().includes(q) ||
          fam.headNationalId?.toLowerCase().includes(q) ||
          fam.headPhoneNumber?.includes(q) ||
          fam.id.toLowerCase().includes(q)
        if (!matches) return false
      }

      return true
    })
  }, [data, incompleteFilterType, incompleteSearch])

  // Pagination for Incomplete tab
  const totalIncompletePages = Math.ceil(filteredIncompleteFamilies.length / pageSize) || 1
  const paginatedIncompleteFamilies = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredIncompleteFamilies.slice(start, start + pageSize)
  }, [filteredIncompleteFamilies, currentPage])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap bg-white dark:bg-slate-900/60 p-5 rounded-2xl border border-border/50 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white shadow-xl shadow-amber-900/30">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-500 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                Data Quality &amp; Governance
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 mt-1">
              مركز فحص جودة البيانات والدمج الذكي
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              اكتشاف التكرارات، اختيار السجل الأكثر اكتمالاً، ونقل الأيتام والمرفقات بضغطة زر
            </p>
          </div>
        </div>

        <button
          onClick={handleRescan}
          disabled={isPending}
          className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-border/60 rounded-xl px-4 py-2.5 text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-60 shadow-sm"
        >
          <RefreshCw className={`h-4 w-4 text-amber-500 ${isPending ? "animate-spin" : ""}`} />
          إعادة الفحص الشامل
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white dark:bg-slate-900/60 border border-border/50 rounded-2xl p-4 backdrop-blur-md flex items-center justify-between shadow-lg">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block">إجمالي أسر المنظومة</span>
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono mt-1 block">
              {data?.totalFamilies || 0}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 dark:text-blue-400">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white dark:bg-slate-900/60 border border-border/50 rounded-2xl p-4 backdrop-blur-md flex items-center justify-between shadow-lg">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block">مجموعات التكرار المشتبه بها</span>
            <span className="text-2xl font-black text-amber-500 dark:text-amber-400 font-mono mt-1 block">
              {data?.totalDuplicatesCount || 0}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400">
            <Copy className="h-6 w-6" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white dark:bg-slate-900/60 border border-border/50 rounded-2xl p-4 backdrop-blur-md flex items-center justify-between shadow-lg">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block">الأسر ذات البيانات الناقصة</span>
            <span className="text-2xl font-black text-rose-500 dark:text-rose-400 font-mono mt-1 block">
              {data?.totalIncompleteCount || 0}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400">
            <FileQuestion className="h-6 w-6" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white dark:bg-slate-900/60 border border-border/50 rounded-2xl p-4 backdrop-blur-md flex items-center justify-between shadow-lg">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block">مؤشر نظافة وسلامة البيانات</span>
            <span className="text-2xl font-black text-emerald-500 dark:text-emerald-400 font-mono mt-1 block">
              {data?.healthScore !== undefined ? `${data.healthScore}%` : "100%"}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900/60 p-1.5 rounded-xl border border-border/40 w-fit">
        <button
          onClick={() => setActiveTab("duplicates")}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === "duplicates"
              ? "bg-amber-600 text-white shadow-md shadow-amber-900/30"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <Copy className="h-4 w-4" /> السجلات المكررة ({data?.totalDuplicatesCount || 0})
        </button>

        <button
          onClick={() => {
            setActiveTab("incomplete")
            setCurrentPage(1)
          }}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === "incomplete"
              ? "bg-amber-600 text-white shadow-md shadow-amber-900/30"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <FileQuestion className="h-4 w-4" /> البيانات الناقصة ({data?.totalIncompleteCount || 0})
        </button>
      </div>

      {/* ============================================================== */}
      {/* Tab 1: DUPLICATES */}
      {/* ============================================================== */}
      {activeTab === "duplicates" && (
        <div className="space-y-4">
          {/* Sub Filters & Search */}
          <div className="bg-white dark:bg-slate-900/60 border border-border/50 rounded-2xl p-4 backdrop-blur-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-md">
            {/* Filter Chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 flex items-center gap-1">
                <Filter className="h-3.5 w-3.5 text-amber-500" /> تصفية:
              </span>
              <button
                onClick={() => setDuplicateFilterType("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  duplicateFilterType === "ALL"
                    ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                الكل ({data?.totalDuplicatesCount || 0})
              </button>
              <button
                onClick={() => setDuplicateFilterType("PHONE")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  duplicateFilterType === "PHONE"
                    ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                رقم الهاتف ({data?.duplicatePhoneGroups?.length || 0})
              </button>
              <button
                onClick={() => setDuplicateFilterType("NAME")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  duplicateFilterType === "NAME"
                    ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                اسم رب الأسرة ({data?.duplicateNameGroups?.length || 0})
              </button>
              <button
                onClick={() => setDuplicateFilterType("NATIONAL_ID")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  duplicateFilterType === "NATIONAL_ID"
                    ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                الرقم الوطني ({data?.duplicateIdGroups?.length || 0})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[260px]">
              <Search className="h-4 w-4 absolute right-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="ابحث بالاسم، الهاتف، أو الرقم الوطني..."
                value={duplicateSearch}
                onChange={e => setDuplicateSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-border/60 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-slate-400"
              />
            </div>
          </div>

          {/* Groups List */}
          {filteredDuplicateGroups.length === 0 ? (
            <div className="bg-white dark:bg-slate-900/60 border border-border/50 rounded-2xl p-12 text-center text-slate-500 dark:text-slate-400 space-y-3">
              <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500 opacity-80" />
              <p className="text-base font-bold text-slate-800 dark:text-slate-200">
                لا توجد سجلات مكررة مطابقة للمعايير المحددة
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                جميع السجلات نظيفة أو تم معالجتها بالكامل
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDuplicateGroups.map((group: any) => {
                const groupKey = `${group.type}_${group.value}`
                const isExpanded = !!expandedGroups[groupKey]
                const selectedPrimaryId = selectedPrimaryMap[groupKey] || group.items[0]?.id
                const isBulkMerging = bulkMergingGroupKey === groupKey

                // Limit visible items unless expanded
                const visibleItems = isExpanded ? group.items : group.items.slice(0, 4)
                const hasMore = group.items.length > 4

                return (
                  <div
                    key={groupKey}
                    className="bg-white dark:bg-slate-900/70 border border-amber-500/30 rounded-2xl p-5 backdrop-blur-md space-y-4 shadow-xl transition-all"
                  >
                    {/* Group Header */}
                    <div className="flex items-center justify-between border-b border-border/40 pb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                          تكرار حسب{" "}
                          {group.type === "NATIONAL_ID"
                            ? "الرقم الوطني"
                            : group.type === "PHONE"
                            ? "رقم الهاتف"
                            : "اسم رب الأسرة"}
                          :
                        </span>
                        <span className="text-xs font-black text-slate-900 dark:text-slate-100 font-mono bg-slate-100 dark:bg-slate-950 px-2.5 py-0.5 rounded-lg border border-border/40">
                          {group.value}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                          عدد السجلات: <b className="font-mono text-amber-600 dark:text-amber-400">{group.items.length}</b>
                        </span>
                      </div>

                      {/* Group Quick Actions */}
                      <div className="flex items-center gap-2">
                        {group.items.length > 2 && (
                          <button
                            onClick={() => handleBulkMerge(groupKey, selectedPrimaryId, group.items)}
                            disabled={isBulkMerging}
                            className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-amber-900/20 transition-all disabled:opacity-60"
                          >
                            {isBulkMerging ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" /> جاري الدمج الجماعي...
                              </>
                            ) : (
                              <>
                                <GitMerge className="h-3.5 w-3.5" /> دمج الكل في السجل المختار ({group.items.length - 1})
                              </>
                            )}
                          </button>
                        )}

                        <button
                          onClick={() => handleDismissGroup(groupKey)}
                          title="تخطي هذه المجموعة لهذه الجلسة"
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg border border-border/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-xs flex items-center gap-1"
                        >
                          <EyeOff className="h-3.5 w-3.5" /> تخطي
                        </button>
                      </div>
                    </div>

                    {/* Compare Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                      {visibleItems.map((item: any) => {
                        const isPrimary = item.id === selectedPrimaryId
                        const isMergingThis = mergingId === item.id

                        return (
                          <div
                            key={item.id}
                            className={`p-4 rounded-xl border space-y-3 text-xs transition-all relative ${
                              isPrimary
                                ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/60 shadow-md ring-1 ring-emerald-500/30"
                                : "bg-slate-50 dark:bg-slate-950/60 border-border/60 hover:border-slate-400 dark:hover:border-slate-700"
                            }`}
                          >
                            {/* Primary Badge or Select Button */}
                            <div className="flex items-center justify-between gap-2 border-b border-border/30 pb-2">
                              {isPrimary ? (
                                <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                                  <Check className="h-3 w-3 stroke-[3]" /> السجل الرئيسي المعتمد
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedPrimaryMap(prev => ({
                                      ...prev,
                                      [groupKey]: item.id,
                                    }))
                                  }
                                  className="text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 border border-border/50 px-2 py-0.5 rounded transition-all"
                                >
                                  تعيين كسجل رئيسي بديل
                                </button>
                              )}

                              <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-border/40 font-bold">
                                ID: {item.id.slice(-6).toUpperCase()}
                              </span>
                            </div>

                            {/* Head Details */}
                            <div>
                              <div className="font-black text-slate-900 dark:text-slate-100 text-sm">
                                {item.headFullName}
                              </div>
                              <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono mt-1 space-x-2 space-x-reverse">
                                <span>الهوية: <b className="text-slate-800 dark:text-slate-200">{item.headNationalId || "غير مسجل"}</b></span>
                                <span>•</span>
                                <span>الهاتف: <b className="text-slate-800 dark:text-slate-200">{item.headPhoneNumber || "غير مسجل"}</b></span>
                              </div>
                            </div>

                            {/* Location & Members Details */}
                            <div className="grid grid-cols-2 gap-2 text-[11px] bg-white/60 dark:bg-slate-900/60 p-2 rounded-lg border border-border/30">
                              <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400 truncate">
                                <MapPin className="h-3 w-3 text-slate-400 flex-shrink-0" />
                                <span className="truncate">
                                  {item.subDistrict?.district?.governorate?.nameAr
                                    ? `${item.subDistrict.district.governorate.nameAr} - ${item.subDistrict.district.nameAr || ""}`
                                    : item.addressDetail || "العنوان غير محدد"}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 justify-end text-slate-600 dark:text-slate-400 font-bold">
                                <span className="flex items-center gap-0.5" title="عدد أفراد / أيتام الأسرة">
                                  <Users className="h-3 w-3 text-amber-500" />
                                  <b className="font-mono text-slate-800 dark:text-slate-200">
                                    {item._count?.members || item.manualMembersCount || item.familyMembersCount || 0}
                                  </b>
                                </span>

                                {item._count?.attachments > 0 && (
                                  <span className="flex items-center gap-0.5" title="عدد المرفقات">
                                    <Paperclip className="h-3 w-3 text-blue-500" />
                                    <b className="font-mono text-slate-800 dark:text-slate-200">{item._count.attachments}</b>
                                  </span>
                                )}

                                {item._count?.sponsorships > 0 && (
                                  <span className="flex items-center gap-0.5" title="كفالة أسرة نشطة">
                                    <HeartHandshake className="h-3 w-3 text-emerald-500" />
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 pt-1">
                              <span>
                                تاريخ التسجيل:{" "}
                                {item.createdAt ? new Date(item.createdAt).toLocaleDateString("ar-YE") : "—"}
                              </span>
                              <Link
                                href={`/dashboard/families?search=${encodeURIComponent(item.headNationalId || item.headFullName)}`}
                                target="_blank"
                                className="text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-0.5 font-bold"
                              >
                                عرض الملف <ExternalLink className="h-2.5 w-2.5" />
                              </Link>
                            </div>

                            {/* Merge Action Button for Non-Primary */}
                            {!isPrimary && (
                              <button
                                onClick={() => handleMerge(selectedPrimaryId, item.id)}
                                disabled={isMergingThis || isBulkMerging}
                                className="w-full bg-slate-100 hover:bg-amber-600 dark:bg-slate-800 dark:hover:bg-amber-600 text-slate-800 hover:text-white dark:text-slate-200 dark:hover:text-white border border-border/60 hover:border-amber-600 rounded-xl py-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-60 shadow-sm"
                              >
                                {isMergingThis ? (
                                  <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> جاري الدمج في السجل الرئيسي...
                                  </>
                                ) : (
                                  <>
                                    <GitMerge className="h-3.5 w-3.5 text-amber-500" /> دمج هذا السجل في السجل الرئيسي
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Expand/Collapse Toggle for Large Groups */}
                    {hasMore && (
                      <div className="pt-2 text-center border-t border-border/30">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedGroups(prev => ({
                              ...prev,
                              [groupKey]: !isExpanded,
                            }))
                          }
                          className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1 py-1 px-3 rounded-lg hover:bg-amber-500/10 transition-all"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="h-4 w-4" /> طي السجلات الإضافية
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4" /> عرض باقي السجلات المكررة في هذه المجموعة (
                              {group.items.length - 4} سجل إضافي)
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* Tab 2: INCOMPLETE DATA */}
      {/* ============================================================== */}
      {activeTab === "incomplete" && (
        <div className="space-y-4">
          {/* Sub Filters & Search */}
          <div className="bg-white dark:bg-slate-900/60 border border-border/50 rounded-2xl p-4 backdrop-blur-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-md">
            {/* Filter Chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 flex items-center gap-1">
                <Filter className="h-3.5 w-3.5 text-rose-500" /> نقص في:
              </span>
              <button
                onClick={() => {
                  setIncompleteFilterType("ALL")
                  setCurrentPage(1)
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  incompleteFilterType === "ALL"
                    ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/40"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                الكل ({data?.totalIncompleteCount || 0})
              </button>
              <button
                onClick={() => {
                  setIncompleteFilterType("PHONE")
                  setCurrentPage(1)
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  incompleteFilterType === "PHONE"
                    ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/40"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                بدون رقم هاتف
              </button>
              <button
                onClick={() => {
                  setIncompleteFilterType("ADDRESS")
                  setCurrentPage(1)
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  incompleteFilterType === "ADDRESS"
                    ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/40"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                بدون عنوان تفصيلي
              </button>
              <button
                onClick={() => {
                  setIncompleteFilterType("MEMBERS")
                  setCurrentPage(1)
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  incompleteFilterType === "MEMBERS"
                    ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/40"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                عدد الأفراد غير محدد
              </button>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[260px]">
              <Search className="h-4 w-4 absolute right-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="ابحث باسم رب الأسرة أو الرقم الوطني..."
                value={incompleteSearch}
                onChange={e => {
                  setIncompleteSearch(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-border/60 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 placeholder-slate-400"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-900/60 border border-border/50 rounded-2xl overflow-hidden backdrop-blur-md shadow-xl">
            {filteredIncompleteFamilies.length === 0 ? (
              <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-2">
                <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500 opacity-80" />
                <p className="text-base font-bold text-slate-800 dark:text-slate-200">
                  لا توجد سجلات ناقصة مطابقة للمعايير المحددة
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  جميع بيانات الأسر مكتملة وموثقة
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 border-b border-border/60 font-bold">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">اسم رب الأسرة</th>
                      <th className="p-3">الرقم الوطني</th>
                      <th className="p-3">المحافظة / المديرية</th>
                      <th className="p-3">البيانات الناقصة</th>
                      <th className="p-3 text-center">إجراء الاستكمال</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {paginatedIncompleteFamilies.map((item: any, idx: number) => {
                      const absoluteIndex = (currentPage - 1) * pageSize + idx + 1
                      const fam = item.family

                      return (
                        <tr
                          key={fam.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all"
                        >
                          <td className="p-3 font-mono text-slate-400 font-bold">{absoluteIndex}</td>
                          <td className="p-3">
                            <span className="font-bold text-slate-900 dark:text-slate-100 block">
                              {fam.headFullName}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">
                              ID: {fam.id.slice(-6).toUpperCase()}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-slate-700 dark:text-slate-300">
                            {fam.headNationalId || "—"}
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-400">
                            {fam.subDistrict?.district?.governorate?.nameAr
                              ? `${fam.subDistrict.district.governorate.nameAr} - ${fam.subDistrict.district.nameAr || ""}`
                              : "—"}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {item.missingPhone && (
                                <span className="bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                                  <PhoneOff className="h-3 w-3" /> بدون رقم هاتف
                                </span>
                              )}
                              {item.missingAddress && (
                                <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                                  <MapPinOff className="h-3 w-3" /> بدون عنوان تفصيلي
                                </span>
                              )}
                              {item.missingMembers && (
                                <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-border/40 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                                  <Users className="h-3 w-3" /> عدد الأفراد غير محدد
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <Link
                              href={`/dashboard/families?search=${encodeURIComponent(fam.headNationalId || fam.headFullName)}`}
                              target="_blank"
                              className="inline-flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-sm"
                            >
                              استكمال البيانات <ExternalLink className="h-3 w-3" />
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {totalIncompletePages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-950/80 border-t border-border/40 text-xs">
                <span className="text-slate-500 font-bold">
                  عرض {Math.min(filteredIncompleteFamilies.length, (currentPage - 1) * pageSize + 1)} -{" "}
                  {Math.min(filteredIncompleteFamilies.length, currentPage * pageSize)} من أصل{" "}
                  {filteredIncompleteFamilies.length} أسرة
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded-lg border border-border/60 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-bold"
                  >
                    السابق
                  </button>

                  <span className="px-2 font-mono font-bold text-amber-500">
                    {currentPage} / {totalIncompletePages}
                  </span>

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalIncompletePages, p + 1))}
                    disabled={currentPage === totalIncompletePages}
                    className="px-3 py-1 rounded-lg border border-border/60 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-bold"
                  >
                    التالي
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

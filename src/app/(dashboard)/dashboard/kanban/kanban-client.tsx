"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  getKanbanData,
  updateOrphanVerificationStatus,
  pauseOrphanSponsorship,
  activateOrphanSponsorship,
} from "@/app/actions/kanban-actions"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  User,
  Search,
  MapPin,
  HeartPulse,
  GraduationCap,
  Calendar,
  ArrowLeftRight,
  RefreshCw,
  TrendingUp,
  Eye,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Phone,
  Home,
  ExternalLink,
  ChevronDown,
  Sparkles,
} from "lucide-react"

interface SponsorItem {
  id: string
  fullName: string
  organization?: string | null
}

interface OrphanItem {
  id: string
  fullName: string
  orphanCode?: string | null
  gender: string
  birthdate: string
  healthStatus?: string | null
  educationalStage?: string | null
  verificationStatus: "PENDING" | "APPROVED" | "REJECTED"
  family?: {
    id: string
    headFullName?: string | null
    addressDetail?: string | null
    housingType?: string | null
    povertyLevel?: string | null
    guardianPhone?: string | null
  } | null
  guardians?: {
    fullName: string
    relation?: string | null
    phone1?: string | null
  }[]
  sponsorships?: {
    id: string
    status: "ACTIVE" | "PAUSED" | "STOPPED"
    amount: any
    currency: string
    sponsor: {
      id: string
      fullName: string
    }
  }[]
}

interface KanbanClientProps {
  initialOrphans: OrphanItem[]
  sponsors: SponsorItem[]
}

const ITEMS_PER_PAGE = 30

export function KanbanClient({ initialOrphans, sponsors }: KanbanClientProps) {
  const [orphans, setOrphans] = useState<OrphanItem[]>(initialOrphans)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSponsor, setSelectedSponsor] = useState("ALL")
  const [selectedGender, setSelectedGender] = useState("ALL")
  const [selectedOrphan, setSelectedOrphan] = useState<OrphanItem | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Visible items count per column for performance
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>({
    pending: ITEMS_PER_PAGE,
    approvedWaiting: ITEMS_PER_PAGE,
    sponsoredActive: ITEMS_PER_PAGE,
    rejected: ITEMS_PER_PAGE,
  })

  const fetchData = async () => {
    setLoading(true)
    const result = await getKanbanData()
    if (result.success) {
      setOrphans(result.orphans || [])
    }
    setLoading(false)
  }

  const handleVerificationChange = async (
    id: string,
    newStatus: "PENDING" | "APPROVED" | "REJECTED"
  ) => {
    setUpdatingId(id)
    const result = await updateOrphanVerificationStatus(id, newStatus)
    if (result.success) {
      await fetchData()
      if (selectedOrphan?.id === id) {
        setSelectedOrphan((prev) => (prev ? { ...prev, verificationStatus: newStatus } : null))
      }
    } else {
      alert("حدث خطأ أثناء تحديث حالة المسار: " + (result.error || ""))
    }
    setUpdatingId(null)
  }

  const handlePauseSponsorship = async (id: string) => {
    if (!confirm("هل تريد تعليق كفالة هذا اليتيم ونقله لمرحلة 'معتمد بانتظار كفيل'؟")) return
    setUpdatingId(id)
    const result = await pauseOrphanSponsorship(id)
    if (result.success) {
      await fetchData()
      setSelectedOrphan(null)
    } else {
      alert("حدث خطأ أثناء تعليق الكفالة: " + (result.error || ""))
    }
    setUpdatingId(null)
  }

  const handleActivateSponsorship = async (id: string, sponsorId?: string) => {
    setUpdatingId(id)
    const result = await activateOrphanSponsorship(id, sponsorId)
    if (result.success) {
      await fetchData()
      setSelectedOrphan(null)
    } else {
      alert("حدث خطأ أثناء تفعيل الكفالة: " + (result.error || ""))
    }
    setUpdatingId(null)
  }

  // Filter orphans by search, sponsor, and gender
  const filteredOrphans = useMemo(() => {
    return orphans.filter((o) => {
      const matchSearch =
        searchQuery === "" ||
        o.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.orphanCode && o.orphanCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (o.family?.headFullName && o.family.headFullName.toLowerCase().includes(searchQuery.toLowerCase()))

      const activeSponsorship = o.sponsorships?.find((s) => s.status === "ACTIVE")
      const matchSponsor =
        selectedSponsor === "ALL" ||
        (selectedSponsor === "NONE" && !activeSponsorship) ||
        activeSponsorship?.sponsor.id === selectedSponsor

      const matchGender =
        selectedGender === "ALL" || o.gender === selectedGender

      return matchSearch && matchSponsor && matchGender
    })
  }, [orphans, searchQuery, selectedSponsor, selectedGender])

  // Group into Pipeline Columns
  const columns = useMemo(() => {
    const pending: OrphanItem[] = []
    const approvedWaiting: OrphanItem[] = []
    const sponsoredActive: OrphanItem[] = []
    const rejected: OrphanItem[] = []

    filteredOrphans.forEach((o) => {
      const hasActiveSponsorship = o.sponsorships?.some((s) => s.status === "ACTIVE")
      if (hasActiveSponsorship) {
        sponsoredActive.push(o)
      } else if (o.verificationStatus === "PENDING") {
        pending.push(o)
      } else if (o.verificationStatus === "APPROVED") {
        approvedWaiting.push(o)
      } else if (o.verificationStatus === "REJECTED") {
        rejected.push(o)
      } else {
        // Fallback: unclassified orphans default to pending
        pending.push(o)
      }
    })

    return { pending, approvedWaiting, sponsoredActive, rejected }
  }, [filteredOrphans])

  const getAge = (birthdate: string) => {
    if (!birthdate) return "-"
    const diff = Date.now() - new Date(birthdate).getTime()
    const ageDate = new Date(diff)
    return Math.abs(ageDate.getUTCFullYear() - 1970)
  }

  const loadMore = (colKey: string) => {
    setVisibleCounts((prev) => ({
      ...prev,
      [colKey]: (prev[colKey] || ITEMS_PER_PAGE) + ITEMS_PER_PAGE,
    }))
  }

  return (
    <div className="space-y-6 pb-12 text-right" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/50 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <ArrowLeftRight className="h-7 w-7 text-indigo-500" />
            خط الإنتاج ومراحل كفالة الأيتام (Kanban Pipeline)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            متابعة انتقال الأيتام عبر مراحل الاعتماد والكفالة اللحظية بمرونة وإدارة شاملة.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            onClick={fetchData}
            disabled={loading}
            variant="outline"
            className="border-border hover:bg-muted text-xs h-9 gap-1.5 font-bold transition-all"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
            تحديث البيانات
          </Button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-card border border-border/60 rounded-xl p-3.5 flex justify-between items-center shadow-sm">
          <div>
            <span className="text-[11px] font-bold text-muted-foreground block">قيد التحقق والمراجعة</span>
            <span className="text-2xl font-black text-foreground mt-0.5">{columns.pending.length}</span>
          </div>
          <Badge className="bg-blue-500/10 text-blue-500 border border-blue-500/20 font-bold">
            <Clock className="h-3 w-3 ml-1 inline" />
            مراجعة
          </Badge>
        </div>

        <div className="bg-card border border-border/60 rounded-xl p-3.5 flex justify-between items-center shadow-sm">
          <div>
            <span className="text-[11px] font-bold text-amber-500 block">معتمد بانتظار الكفالة</span>
            <span className="text-2xl font-black text-amber-500 mt-0.5">{columns.approvedWaiting.length}</span>
          </div>
          <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold">
            <Sparkles className="h-3 w-3 ml-1 inline" />
            جاهز للكفالة
          </Badge>
        </div>

        <div className="bg-card border border-border/60 rounded-xl p-3.5 flex justify-between items-center shadow-sm">
          <div>
            <span className="text-[11px] font-bold text-emerald-500 block">مكفول نشط</span>
            <span className="text-2xl font-black text-emerald-500 mt-0.5">{columns.sponsoredActive.length}</span>
          </div>
          <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold">
            <CheckCircle2 className="h-3 w-3 ml-1 inline" />
            مكفول
          </Badge>
        </div>

        <div className="bg-card border border-border/60 rounded-xl p-3.5 flex justify-between items-center shadow-sm">
          <div>
            <span className="text-[11px] font-bold text-rose-500 block">مرفوض / معلق</span>
            <span className="text-2xl font-black text-rose-500 mt-0.5">{columns.rejected.length}</span>
          </div>
          <Badge className="bg-rose-500/10 text-rose-500 border border-rose-500/20 font-bold">
            <XCircle className="h-3 w-3 ml-1 inline" />
            معلق
          </Badge>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-card/60 border border-border/50 p-3 rounded-xl">
        <div className="relative flex-1 max-w-md">
          <Input
            placeholder="ابحث عن يتيم بالاسم، كود الملف، أو اسم الأسرة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 text-xs pr-9 rounded-lg bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary shadow-sm"
          />
          <Search className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={selectedSponsor}
              onChange={(e) => setSelectedSponsor(e.target.value)}
              className="h-9 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">جميع جهات الكفالة ({sponsors.length})</option>
              {sponsors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName}
                </option>
              ))}
              <option value="NONE">بدون كفيل مسجل</option>
            </select>
          </div>

          <select
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value)}
            className="h-9 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">الجنس (الكل)</option>
            <option value="MALE">ذكور</option>
            <option value="FEMALE">إناث</option>
          </select>
        </div>
      </div>

      {/* Kanban Board Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-2">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <span className="text-xs font-bold">جاري تحميل لوحة الكانبان...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {/* COLUMN 1: Pending */}
          <KanbanColumn
            title="قيد التحقق والمراجعة"
            count={columns.pending.length}
            badgeColor="bg-blue-500/10 text-blue-500 border-blue-500/20"
            topBorder="border-t-blue-500"
            items={columns.pending.slice(0, visibleCounts.pending)}
            totalCount={columns.pending.length}
            hasMore={columns.pending.length > visibleCounts.pending}
            onLoadMore={() => loadMore("pending")}
            onCardClick={setSelectedOrphan}
            onVerificationChange={handleVerificationChange}
            onPauseSponsorship={handlePauseSponsorship}
            onActivateSponsorship={handleActivateSponsorship}
            updatingId={updatingId}
            currentCol="PENDING"
            getAge={getAge}
          />

          {/* COLUMN 2: Approved / Waiting */}
          <KanbanColumn
            title="معتمد بانتظار كفيل"
            count={columns.approvedWaiting.length}
            badgeColor="bg-amber-500/10 text-amber-500 border-amber-500/20"
            topBorder="border-t-amber-500"
            items={columns.approvedWaiting.slice(0, visibleCounts.approvedWaiting)}
            totalCount={columns.approvedWaiting.length}
            hasMore={columns.approvedWaiting.length > visibleCounts.approvedWaiting}
            onLoadMore={() => loadMore("approvedWaiting")}
            onCardClick={setSelectedOrphan}
            onVerificationChange={handleVerificationChange}
            onPauseSponsorship={handlePauseSponsorship}
            onActivateSponsorship={handleActivateSponsorship}
            updatingId={updatingId}
            currentCol="APPROVED"
            getAge={getAge}
          />

          {/* COLUMN 3: Active Sponsored */}
          <KanbanColumn
            title="مكفول نشط"
            count={columns.sponsoredActive.length}
            badgeColor="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
            topBorder="border-t-emerald-500"
            items={columns.sponsoredActive.slice(0, visibleCounts.sponsoredActive)}
            totalCount={columns.sponsoredActive.length}
            hasMore={columns.sponsoredActive.length > visibleCounts.sponsoredActive}
            onLoadMore={() => loadMore("sponsoredActive")}
            onCardClick={setSelectedOrphan}
            onVerificationChange={handleVerificationChange}
            onPauseSponsorship={handlePauseSponsorship}
            onActivateSponsorship={handleActivateSponsorship}
            updatingId={updatingId}
            currentCol="ACTIVE_SPONSORSHIP"
            getAge={getAge}
          />

          {/* COLUMN 4: Rejected / Suspended */}
          <KanbanColumn
            title="مرفوض / معلق"
            count={columns.rejected.length}
            badgeColor="bg-rose-500/10 text-rose-500 border-rose-500/20"
            topBorder="border-t-rose-500"
            items={columns.rejected.slice(0, visibleCounts.rejected)}
            totalCount={columns.rejected.length}
            hasMore={columns.rejected.length > visibleCounts.rejected}
            onLoadMore={() => loadMore("rejected")}
            onCardClick={setSelectedOrphan}
            onVerificationChange={handleVerificationChange}
            onPauseSponsorship={handlePauseSponsorship}
            onActivateSponsorship={handleActivateSponsorship}
            updatingId={updatingId}
            currentCol="REJECTED"
            getAge={getAge}
          />
        </div>
      )}

      {/* Orphan Quick Detail Modal */}
      <Dialog open={!!selectedOrphan} onOpenChange={(o) => { if (!o) setSelectedOrphan(null) }}>
        <DialogContent className="max-w-lg text-right" dir="rtl">
          {selectedOrphan && (
            <>
              <DialogHeader className="text-right">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-primary px-2.5 py-1 rounded bg-primary/10">
                    {selectedOrphan.orphanCode || "بلا كود"}
                  </span>
                  <Badge className="bg-muted text-foreground text-xs font-bold">
                    {getAge(selectedOrphan.birthdate)} سنة
                  </Badge>
                </div>
                <DialogTitle className="text-lg font-black text-foreground mt-2">
                  {selectedOrphan.fullName}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  تفاصيل ملف اليتيم وإجراءات التحكم المباشر بمرحلة الكفالة.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3.5 my-2 text-xs">
                {/* Family and Location */}
                <div className="p-3 rounded-xl bg-muted/40 border border-border/40 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">رب الأسرة:</span>
                    <strong className="text-foreground">{selectedOrphan.family?.headFullName || "غير محدد"}</strong>
                  </div>
                  {selectedOrphan.family?.addressDetail && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">العنوان:</span>
                      <span className="text-foreground">{selectedOrphan.family.addressDetail}</span>
                    </div>
                  )}
                  {selectedOrphan.family?.guardianPhone && (
                    <div className="flex items-center gap-2 font-mono">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">رقم الهاتف:</span>
                      <span className="text-foreground">{selectedOrphan.family.guardianPhone}</span>
                    </div>
                  )}
                </div>

                {/* Primary Guardian & Siblings */}
                {selectedOrphan.guardians?.[0] && (
                  <div className="p-3 rounded-xl bg-muted/40 border border-border/40 space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">المعيل الأساسي</p>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-foreground">
                        {selectedOrphan.guardians[0].fullName} ({selectedOrphan.guardians[0].relation || "معيل"})
                      </span>
                      {selectedOrphan.guardians[0].phone1 && (
                        <span className="font-mono text-muted-foreground text-[11px]">
                          {selectedOrphan.guardians[0].phone1}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Badges Info */}
                <div className="flex flex-wrap gap-2">
                  {selectedOrphan.healthStatus && (
                    <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20 font-bold flex items-center gap-1">
                      <HeartPulse className="h-3.5 w-3.5" />
                      {selectedOrphan.healthStatus}
                    </span>
                  )}
                  {selectedOrphan.educationalStage && (
                    <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20 font-bold flex items-center gap-1">
                      <GraduationCap className="h-3.5 w-3.5" />
                      {selectedOrphan.educationalStage}
                    </span>
                  )}
                </div>

                {/* Active Sponsorship Details */}
                {selectedOrphan.sponsorships?.[0] && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1 text-emerald-600 dark:text-emerald-400">
                    <p className="text-[10px] font-bold uppercase">بيانات الكفالة الحالية</p>
                    <div className="flex justify-between items-center">
                      <span className="font-bold">{selectedOrphan.sponsorships[0].sponsor.fullName}</span>
                      <span className="font-mono font-bold text-sm">
                        {Number(selectedOrphan.sponsorships[0].amount)} {selectedOrphan.sponsorships[0].currency}
                      </span>
                    </div>
                  </div>
                )}

                {/* Pipeline Quick Transition Actions */}
                <div className="border-t border-border/40 pt-3 space-y-2">
                  <p className="font-bold text-foreground text-xs">نقل حالة اليتيم في خط الإنتاج:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedOrphan.sponsorships?.some((s) => s.status === "ACTIVE") ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePauseSponsorship(selectedOrphan.id)}
                        className="text-xs font-bold border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                      >
                        ⏸️ تعليق الكفالة (انتظار كفيل)
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleActivateSponsorship(selectedOrphan.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        تفعيل الكفالة (مكفول نشط)
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleVerificationChange(selectedOrphan.id, "PENDING")}
                      className="text-xs font-bold border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10"
                    >
                      🔄 إعادة للمراجعة والتدقيق
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleVerificationChange(selectedOrphan.id, "APPROVED")}
                      className="text-xs font-bold border-teal-500/30 text-teal-600 dark:text-teal-400 hover:bg-teal-500/10"
                    >
                      ⭐ معتمد بانتظار كفيل
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleVerificationChange(selectedOrphan.id, "REJECTED")}
                      className="text-xs font-bold border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                    >
                      ❌ تعليق / رفض الاستحقاق
                    </Button>
                  </div>
                </div>

                {/* Direct Link to Orphan Full Profile */}
                <div className="pt-2">
                  <Button asChild className="w-full bg-[#00B2A9] hover:bg-[#00968F] text-white text-xs font-bold gap-2">
                    <Link href={`/dashboard/orphans/${selectedOrphan.id}`}>
                      <ExternalLink className="h-4 w-4" />
                      فتح الملف الكامل لليتيم واستمارة الصرف
                    </Link>
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface KanbanColumnProps {
  title: string
  count: number
  badgeColor: string
  topBorder: string
  items: OrphanItem[]
  totalCount: number
  hasMore: boolean
  onLoadMore: () => void
  onCardClick: (orphan: OrphanItem) => void
  onVerificationChange: (id: string, s: "PENDING" | "APPROVED" | "REJECTED") => void
  onPauseSponsorship: (id: string) => void
  onActivateSponsorship: (id: string) => void
  updatingId: string | null
  currentCol: string
  getAge: (d: string) => number | string
}

function KanbanColumn({
  title,
  count,
  badgeColor,
  topBorder,
  items,
  totalCount,
  hasMore,
  onLoadMore,
  onCardClick,
  onVerificationChange,
  onPauseSponsorship,
  onActivateSponsorship,
  updatingId,
  currentCol,
  getAge,
}: KanbanColumnProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Column Header */}
      <div className={`rounded-xl border border-border/60 bg-card p-3 shadow-sm border-t-4 ${topBorder}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-foreground">{title}</h3>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${badgeColor}`}>
            {count}
          </span>
        </div>
      </div>

      {/* Cards Container */}
      <div className="flex flex-col gap-2.5 min-h-[460px] p-2 rounded-2xl bg-muted/20 border border-dashed border-border/40">
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <p className="text-xs">لا توجد حالات في هذه المرحلة</p>
          </div>
        ) : (
          items.map((orphan) => (
            <OrphanCard
              key={orphan.id}
              orphan={orphan}
              getAge={getAge}
              onCardClick={onCardClick}
              onVerificationChange={onVerificationChange}
              onPauseSponsorship={onPauseSponsorship}
              onActivateSponsorship={onActivateSponsorship}
              updatingId={updatingId}
              currentCol={currentCol}
            />
          ))
        )}

        {hasMore && (
          <Button
            variant="outline"
            size="sm"
            onClick={onLoadMore}
            className="w-full text-xs font-bold border-border/60 text-muted-foreground hover:text-foreground mt-2"
          >
            عرض المزيد ({totalCount - items.length} متبقي) ↓
          </Button>
        )}
      </div>
    </div>
  )
}

interface OrphanCardProps {
  orphan: OrphanItem
  getAge: (d: string) => number | string
  onCardClick: (orphan: OrphanItem) => void
  onVerificationChange: (id: string, s: "PENDING" | "APPROVED" | "REJECTED") => void
  onPauseSponsorship: (id: string) => void
  onActivateSponsorship: (id: string) => void
  updatingId: string | null
  currentCol: string
}

function OrphanCard({
  orphan,
  getAge,
  onCardClick,
  onVerificationChange,
  onPauseSponsorship,
  onActivateSponsorship,
  updatingId,
  currentCol,
}: OrphanCardProps) {
  const isUpdating = updatingId === orphan.id
  const activeSponsorship = orphan.sponsorships?.find((s) => s.status === "ACTIVE")

  return (
    <Card
      className="border border-border/60 bg-card shadow-sm hover:shadow-md hover:border-primary/40 transition-all rounded-xl overflow-hidden relative cursor-pointer group"
      onClick={() => onCardClick(orphan)}
    >
      {isUpdating && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10 rounded-xl">
          <RefreshCw className="h-5 w-5 animate-spin text-primary" />
        </div>
      )}
      <CardContent className="p-3.5 space-y-2.5">
        {/* Title and Code */}
        <div className="flex items-start justify-between gap-1.5">
          <div className="space-y-0.5 flex-1 min-w-0">
            <span className="text-[10px] font-extrabold text-primary font-mono block">
              {orphan.orphanCode || "بلا كود"}
            </span>
            <h4 className="text-xs font-bold text-foreground leading-tight truncate">
              {orphan.fullName}
            </h4>
          </div>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-muted/60 text-muted-foreground border border-border/30 shrink-0">
            {getAge(orphan.birthdate)} سنة
          </span>
        </div>

        {/* Family and Location */}
        <div className="text-[10px] text-muted-foreground space-y-1">
          <div className="flex items-center gap-1 truncate">
            <User className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="truncate">الأسرة: {orphan.family?.headFullName || "غير محدد"}</span>
          </div>
          {orphan.family?.addressDetail && (
            <div className="flex items-center gap-1 truncate">
              <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="truncate">{orphan.family.addressDetail}</span>
            </div>
          )}
        </div>

        {/* Health / Education Quick Badges */}
        <div className="flex flex-wrap gap-1 pt-0.5">
          {orphan.healthStatus && (
            <span className="bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[9px] font-bold px-1.5 py-0.5 rounded truncate max-w-[90px]">
              {orphan.healthStatus}
            </span>
          )}
          {orphan.educationalStage && (
            <span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[9px] font-bold px-1.5 py-0.5 rounded truncate max-w-[90px]">
              {orphan.educationalStage}
            </span>
          )}
        </div>

        {/* If Active Sponsored, show sponsor name */}
        {activeSponsorship && (
          <div className="border-t border-emerald-500/20 bg-emerald-500/5 p-2 rounded-lg text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
            <span className="flex items-center gap-1 truncate max-w-[140px]">
              <TrendingUp className="h-3 w-3 shrink-0" />
              {activeSponsorship.sponsor.fullName}
            </span>
            <span className="font-mono font-bold shrink-0 text-[10px]">
              {Number(activeSponsorship.amount)} {activeSponsorship.currency}
            </span>
          </div>
        )}

        {/* Bottom Quick-Action Buttons (Stops event bubbling so modal isn't triggered) */}
        <div
          className="border-t border-border/30 pt-2 flex items-center justify-between text-[10px] gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {currentCol === "ACTIVE_SPONSORSHIP" ? (
            <button
              onClick={() => onPauseSponsorship(orphan.id)}
              className="text-[10px] font-bold text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 px-2 py-0.5 rounded transition-colors"
              title="تعليق الكفالة ونقل لانتظار كفيل"
            >
              ⏸️ تعليق الكفالة
            </button>
          ) : currentCol === "APPROVED" ? (
            <button
              onClick={() => onActivateSponsorship(orphan.id)}
              className="text-[10px] font-bold text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10 px-2 py-0.5 rounded transition-colors"
              title="تفعيل الكفالة مباشرة"
            >
              ✓ تفعيل كفالة
            </button>
          ) : currentCol === "PENDING" ? (
            <button
              onClick={() => onVerificationChange(orphan.id, "APPROVED")}
              className="text-[10px] font-bold text-teal-500 hover:text-teal-600 hover:bg-teal-500/10 px-2 py-0.5 rounded transition-colors"
              title="اعتماد وبانتظار كفيل"
            >
              ✓ اعتماد
            </button>
          ) : (
            <button
              onClick={() => onVerificationChange(orphan.id, "PENDING")}
              className="text-[10px] font-bold text-blue-500 hover:text-blue-600 hover:bg-blue-500/10 px-2 py-0.5 rounded transition-colors"
              title="إعادة للمراجعة"
            >
              🔄 مراجعة
            </button>
          )}

          <button
            onClick={() => onCardClick(orphan)}
            className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5"
          >
            <Eye className="h-3 w-3" />
            فحص
          </button>
        </div>
      </CardContent>
    </Card>
  )
}

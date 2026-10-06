"use client"

import { useState, useMemo, useEffect } from "react"
import {
  recordCaseActivity,
  getExpiringSponshorships,
  getOverdueSponsorships,
  getUnvisitedFamilies,
  getAgingOutOrphans,
  getMissingAccountOrphans,
  getUrgentWaitingOrphans,
} from "@/app/actions/alert-actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Bell,
  AlertTriangle,
  Clock,
  Users,
  PhoneCall,
  CheckCircle2,
  Calendar,
  CreditCard,
  GraduationCap,
  HeartHandshake,
  MessageSquare,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  ClipboardCheck,
  MapPin,
  Sparkles,
  AlertCircle,
  FileText,
} from "lucide-react"
import Link from "next/link"

interface AlertsClientProps {
  initialExpiring: any[]
  initialOverdue: any[]
  initialUnvisited: any[]
  initialAgingOut: any[]
  initialMissingAccount: any[]
  initialUrgentWaiting: any[]
}

export function AlertsClient({
  initialExpiring,
  initialOverdue,
  initialUnvisited,
  initialAgingOut,
  initialMissingAccount,
  initialUrgentWaiting,
}: AlertsClientProps) {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)

  // Data states
  const [expiring, setExpiring] = useState<any[]>(initialExpiring)
  const [overdue, setOverdue] = useState<any[]>(initialOverdue)
  const [unvisited, setUnvisited] = useState<any[]>(initialUnvisited)
  const [agingOut, setAgingOut] = useState<any[]>(initialAgingOut)
  const [missingAccount, setMissingAccount] = useState<any[]>(initialMissingAccount)
  const [urgentWaiting, setUrgentWaiting] = useState<any[]>(initialUrgentWaiting)

  // Visit recording modal state
  const [visitModalOpen, setVisitModalOpen] = useState(false)
  const [selectedFamily, setSelectedFamily] = useState<any>(null)
  const [visitType, setVisitType] = useState("VISIT")
  const [visitTitle, setVisitTitle] = useState("")
  const [visitDesc, setVisitDesc] = useState("")
  const [submittingVisit, setSubmittingVisit] = useState(false)
  const [actionMessage, setActionMessage] = useState({ text: "", type: "" })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (actionMessage.text) {
      const t = setTimeout(() => setActionMessage({ text: "", type: "" }), 4000)
      return () => clearTimeout(t)
    }
  }, [actionMessage])

  const loadAllData = async () => {
    setLoading(true)
    const [expRes, overRes, unvRes, ageRes, missRes, urgRes] = await Promise.all([
      getExpiringSponshorships(),
      getOverdueSponsorships(),
      getUnvisitedFamilies(100),
      getAgingOutOrphans(),
      getMissingAccountOrphans(),
      getUrgentWaitingOrphans(),
    ])
    if (expRes.success) setExpiring(expRes.expiring || [])
    if (overRes.success) setOverdue(overRes.overdue || [])
    if (unvRes.success) setUnvisited(unvRes.families || [])
    if (ageRes.success) setAgingOut(ageRes.orphans || [])
    if (missRes.success) setMissingAccount(missRes.orphans || [])
    if (urgRes.success) setUrgentWaiting(urgRes.orphans || [])
    setLoading(false)
  }

  // Handle visit submission
  const handleRecordVisit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFamily || !visitTitle.trim()) return
    setSubmittingVisit(true)
    const res = await recordCaseActivity({
      familyId: selectedFamily.id,
      type: visitType,
      title: visitTitle.trim(),
      description: visitDesc.trim() || "تمت الزيارة الميدانية وتحديث سجل الأسرة.",
    })
    if (res.success) {
      setActionMessage({ text: `تم تسجيل ${visitType === "VISIT" ? "الزيارة" : "النشاط"} للأسرة بنجاح! ✅`, type: "success" })
      setVisitModalOpen(false)
      setSelectedFamily(null)
      setVisitTitle("")
      setVisitDesc("")
      // Remove from unvisited locally
      setUnvisited((prev) => prev.filter((f) => f.id !== selectedFamily.id))
      loadAllData()
    } else {
      setActionMessage({ text: res.error || "فشل تسجيل الزيارة", type: "error" })
    }
    setSubmittingVisit(false)
  }

  // Helper WhatsApp sender
  const sendWhatsApp = (phone: string, text: string) => {
    if (!phone) return
    let cleaned = phone.replace(/\D/g, "")
    if (cleaned.startsWith("00")) cleaned = cleaned.substring(2)
    if (cleaned.startsWith("0")) cleaned = "967" + cleaned.substring(1)
    else if (cleaned.length === 9 && (cleaned.startsWith("7") || cleaned.startsWith("1"))) cleaned = "967" + cleaned
    window.open(`https://wa.me/${cleaned}?text=${encodeURIComponent(text)}`, "_blank")
  }

  // Total counts
  const totalAlerts =
    expiring.length +
    overdue.length +
    unvisited.length +
    agingOut.length +
    missingAccount.length +
    urgentWaiting.length

  // Filtered queries
  const q = search.toLowerCase().trim()

  const filteredExpiring = useMemo(() => {
    if (!q) return expiring
    return expiring.filter(
      (sp) =>
        sp.beneficiary?.fullName?.toLowerCase().includes(q) ||
        sp.sponsor?.fullName?.toLowerCase().includes(q) ||
        sp.beneficiary?.orphanCode?.toLowerCase().includes(q)
    )
  }, [expiring, q])

  const filteredOverdue = useMemo(() => {
    if (!q) return overdue
    return overdue.filter(
      (sp) =>
        sp.beneficiary?.fullName?.toLowerCase().includes(q) ||
        sp.sponsor?.fullName?.toLowerCase().includes(q) ||
        sp.beneficiary?.orphanCode?.toLowerCase().includes(q)
    )
  }, [overdue, q])

  const filteredUnvisited = useMemo(() => {
    if (!q) return unvisited
    return unvisited.filter(
      (f) =>
        f.headFullName?.toLowerCase().includes(q) ||
        (f.headPhoneNumber && f.headPhoneNumber.includes(q)) ||
        f.subDistrict?.district?.governorate?.nameAr?.toLowerCase().includes(q) ||
        f.subDistrict?.district?.nameAr?.toLowerCase().includes(q)
    )
  }, [unvisited, q])

  const filteredAgingOut = useMemo(() => {
    if (!q) return agingOut
    return agingOut.filter(
      (o) =>
        o.fullName?.toLowerCase().includes(q) ||
        o.orphanCode?.toLowerCase().includes(q) ||
        o.family?.headFullName?.toLowerCase().includes(q)
    )
  }, [agingOut, q])

  const filteredMissingAccount = useMemo(() => {
    if (!q) return missingAccount
    return missingAccount.filter(
      (o) =>
        o.fullName?.toLowerCase().includes(q) ||
        o.orphanCode?.toLowerCase().includes(q) ||
        o.sponsorships?.[0]?.sponsor?.fullName?.toLowerCase().includes(q)
    )
  }, [missingAccount, q])

  const filteredUrgentWaiting = useMemo(() => {
    if (!q) return urgentWaiting
    return urgentWaiting.filter(
      (o) =>
        o.fullName?.toLowerCase().includes(q) ||
        o.orphanCode?.toLowerCase().includes(q) ||
        o.family?.headFullName?.toLowerCase().includes(q)
    )
  }, [urgentWaiting, q])

  if (!mounted) return null

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* ── HEADER BANNER ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-amber-600 via-orange-500 to-rose-600 p-6 text-white shadow-xl">
        <div className="absolute -left-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-xl" />
        <div className="absolute -bottom-8 left-20 h-32 w-32 rounded-full bg-white/10 blur-xl" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold md:text-2xl flex items-center gap-2">
              <Bell className="h-6 w-6" />
              منظومة التنبيهات الذكية والرصد الاستباقي
            </h2>
            <p className="mt-1 text-xs md:text-sm text-orange-100 font-medium">
              متابعة تجديد الكفالات، الزيارات الميدانية، بلوغ سن الرشد (18 سنة)، ونواقص الحسابات المصرفية.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadAllData}
              disabled={loading}
              className="bg-white/15 hover:bg-white/25 border-white/20 text-white text-xs font-bold gap-1.5 h-9"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              تحديث التنبيهات
            </Button>
            <div className="rounded-xl bg-white/20 px-4 py-2 text-center backdrop-blur-md border border-white/20">
              <p className="text-xl font-extrabold">{totalAlerts}</p>
              <p className="text-[10px] text-orange-100 font-semibold">إجمالي التنبيهات</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── ACTION NOTIFICATION ── */}
      {actionMessage.text && (
        <div
          className={`p-3 rounded-xl text-xs font-bold border flex items-center gap-2 ${
            actionMessage.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50"
              : "bg-rose-50 dark:bg-red-950/40 text-rose-700 dark:text-red-400 border-rose-200 dark:border-red-900/50"
          }`}
        >
          {actionMessage.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {actionMessage.text}
        </div>
      )}

      {/* ── KPI STATS CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {
            icon: Clock,
            label: "كفالات تنتهي قريباً",
            value: expiring.length,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
            border: "border-amber-500/20",
            tab: "sponsorships",
          },
          {
            icon: AlertTriangle,
            label: "كفالات منتهية",
            value: overdue.length,
            color: "text-rose-500",
            bg: "bg-rose-500/10",
            border: "border-rose-500/20",
            tab: "sponsorships",
          },
          {
            icon: Users,
            label: "أسر بحاجة لزيارة (90 يوم)",
            value: unvisited.length,
            color: "text-orange-500",
            bg: "bg-orange-500/10",
            border: "border-orange-500/20",
            tab: "visits",
          },
          {
            icon: GraduationCap,
            label: "بلوغ سن الرشد (18 سنة)",
            value: agingOut.length,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            border: "border-blue-500/20",
            tab: "aging",
          },
          {
            icon: CreditCard,
            label: "مكفولين بدون حساب بنكي",
            value: missingAccount.length,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
            border: "border-purple-500/20",
            tab: "accounts",
          },
          {
            icon: ShieldAlert,
            label: "أيتام الأبوين بالانتظار",
            value: urgentWaiting.length,
            color: "text-red-600",
            bg: "bg-red-500/10",
            border: "border-red-500/20",
            tab: "urgent",
          },
        ].map((item) => {
          const Icon = item.icon
          return (
            <Card
              key={item.label}
              onClick={() => setActiveTab(item.tab)}
              className={`cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] border ${item.border} bg-white dark:bg-slate-900/40 rounded-xl shadow-xs`}
            >
              <CardContent className="p-3.5 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${item.bg}`}>
                    <Icon className={`h-4 w-4 ${item.color}`} />
                  </div>
                  <span className={`text-xl font-extrabold ${item.color}`}>{item.value}</span>
                </div>
                <p className="text-[11px] font-bold text-gray-700 dark:text-slate-300 mt-2 line-clamp-2">{item.label}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ── SEARCH & FILTER BAR ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900/40 p-3 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="بحث بالاسم، الكفيل، أو رقم الهاتف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pr-9 pl-3 text-xs rounded-xl"
          />
        </div>
        <div className="text-xs text-gray-500 dark:text-slate-400 font-semibold">
          عرض النتائج النشطة والجاهزة للمتابعة الفورية
        </div>
      </div>

      {/* ── TABS SECTION ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl" className="space-y-4">
        <TabsList className="bg-gray-100 dark:bg-slate-950 p-1 rounded-xl flex flex-wrap justify-start gap-1 border border-gray-200 dark:border-slate-800">
          <TabsTrigger value="all" className="rounded-lg text-xs font-bold gap-1.5 px-3 py-2">
            <Bell className="h-3.5 w-3.5" />
            جميع التنبيهات ({totalAlerts})
          </TabsTrigger>
          <TabsTrigger value="sponsorships" className="rounded-lg text-xs font-bold gap-1.5 px-3 py-2">
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            الكفالات والتجديد ({expiring.length + overdue.length})
          </TabsTrigger>
          <TabsTrigger value="visits" className="rounded-lg text-xs font-bold gap-1.5 px-3 py-2">
            <Users className="h-3.5 w-3.5 text-orange-500" />
            المتابعة الميدانية ({unvisited.length})
          </TabsTrigger>
          <TabsTrigger value="aging" className="rounded-lg text-xs font-bold gap-1.5 px-3 py-2">
            <GraduationCap className="h-3.5 w-3.5 text-blue-500" />
            سن الرشد (18 سنة) ({agingOut.length})
          </TabsTrigger>
          <TabsTrigger value="accounts" className="rounded-lg text-xs font-bold gap-1.5 px-3 py-2">
            <CreditCard className="h-3.5 w-3.5 text-purple-500" />
            حسابات الكريمي ({missingAccount.length})
          </TabsTrigger>
          <TabsTrigger value="urgent" className="rounded-lg text-xs font-bold gap-1.5 px-3 py-2">
            <ShieldAlert className="h-3.5 w-3.5 text-red-500" />
            أيتام الأبوين ({urgentWaiting.length})
          </TabsTrigger>
        </TabsList>

        {/* ══════════════════════════════════════════════════════════════
            TAB: ALL ALERTS
        ══════════════════════════════════════════════════════════════ */}
        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Expiring / Overdue Quick Card */}
            <Card className="bg-white dark:bg-slate-900/40 border border-amber-500/20 rounded-2xl shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-extrabold flex items-center justify-between text-amber-600 dark:text-amber-400">
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    كفالات تنتهي قريباً أو منتهية
                  </span>
                  <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px]">
                    {filteredExpiring.length + filteredOverdue.length} كفالة
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {filteredExpiring.length === 0 && filteredOverdue.length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-400">لا توجد كفالات تنتهي خلال الفترة القادمة 🎉</div>
                ) : (
                  [...filteredOverdue, ...filteredExpiring].slice(0, 8).map((sp) => {
                    const daysLeft = sp.endDate
                      ? Math.ceil((new Date(sp.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                      : 0
                    const isOverdue = daysLeft < 0

                    return (
                      <div
                        key={sp.id}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 hover:bg-gray-100/60 dark:hover:bg-slate-850 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                            {sp.beneficiary?.fullName || sp.beneficiary?.family?.headFullName || "—"}
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-slate-400">
                            الكفيل: {sp.sponsor?.fullName || "—"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={`text-[10px] font-bold ${
                              isOverdue
                                ? "bg-rose-500/15 text-rose-600 border-rose-500/30"
                                : daysLeft <= 7
                                ? "bg-amber-500/15 text-amber-600 border-amber-500/30"
                                : "bg-blue-500/15 text-blue-600 border-blue-500/30"
                            }`}
                          >
                            {isOverdue ? `منتهية منذ ${Math.abs(daysLeft)} يوم` : `متبقي ${daysLeft} يوم`}
                          </Badge>
                          {sp.sponsor?.phone && (
                            <button
                              onClick={() =>
                                sendWhatsApp(
                                  sp.sponsor.phone,
                                  `السلام عليكم أخي الكفيل الكريم ${sp.sponsor.fullName}،\nنود إحاطتكم بأن كفالة اليتيم "${sp.beneficiary?.fullName}" ستنتهي قريباً. نسعد بتواصلكم لتجديد الكفالة واستمرار الأجر المبارك.`
                                )
                              }
                              className="text-emerald-500 hover:text-emerald-600 p-1 rounded"
                              title="تواصل واتساب مع الكفيل"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>

            {/* Unvisited Families Quick Card */}
            <Card className="bg-white dark:bg-slate-900/40 border border-orange-500/20 rounded-2xl shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-extrabold flex items-center justify-between text-orange-600 dark:text-orange-400">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    أسر أولوية في المتابعة الميدانية
                  </span>
                  <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/30 text-[10px]">
                    {filteredUnvisited.length} أسرة
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {filteredUnvisited.length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-400">جميع الأسر مسجل لها زيارات حديثة 🎉</div>
                ) : (
                  filteredUnvisited.slice(0, 8).map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 hover:bg-gray-100/60 dark:hover:bg-slate-850 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{f.headFullName}</p>
                        <p className="text-[11px] text-gray-500 dark:text-slate-400 truncate">
                          {f.subDistrict?.district?.governorate?.nameAr || "—"} / {f.subDistrict?.district?.nameAr || "—"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedFamily(f)
                            setVisitTitle(`زيارة تفقدية لأسرة ${f.headFullName}`)
                            setVisitType("VISIT")
                            setVisitModalOpen(true)
                          }}
                          className="h-7 px-2 text-[10px] font-bold text-emerald-600 border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                        >
                          تسجيل زيارة
                        </Button>
                        {f.headPhoneNumber && (
                          <button
                            onClick={() => sendWhatsApp(f.headPhoneNumber, `السلام عليكم ورحمة الله، نود الاطمئنان على أحوال أسرتكم وتحديد موعد للزيارة الميدانية الدورية.`)}
                            className="text-emerald-500 hover:text-emerald-600 p-1 rounded"
                            title="تواصل واتساب"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════
            TAB: SPONSORSHIPS
        ══════════════════════════════════════════════════════════════ */}
        <TabsContent value="sponsorships" className="space-y-4">
          <Card className="bg-white dark:bg-slate-900/40 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-extrabold flex items-center justify-between text-gray-900 dark:text-white">
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  قائمة الكفالات التي تتطلب تدخلاً وتجديداً
                </span>
                <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-xs">
                  {filteredExpiring.length + filteredOverdue.length} كفالة
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                الكفالات التي ستنتهي قريباً أو انتهت بالفعل لتنسيق التواصل مع الكفلاء.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredExpiring.length === 0 && filteredOverdue.length === 0 ? (
                <div className="text-center py-12 text-xs text-gray-400">لا توجد كفالات منتهية أو على وشك الانتهاء.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-gray-100 dark:bg-slate-950 text-gray-700 dark:text-slate-300 font-bold border-b border-gray-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3">المستفيد / اليتيم</th>
                        <th className="p-3">الكفيل</th>
                        <th className="p-3">تاريخ الانتهاء</th>
                        <th className="p-3 text-center">المدة المتبقية</th>
                        <th className="p-3 text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-gray-700 dark:text-slate-300">
                      {[...filteredOverdue, ...filteredExpiring].map((sp) => {
                        const daysLeft = sp.endDate
                          ? Math.ceil((new Date(sp.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                          : 0
                        const isOverdue = daysLeft < 0

                        return (
                          <tr key={sp.id} className="hover:bg-gray-50 dark:hover:bg-slate-900/30 transition-colors">
                            <td className="p-3 font-bold text-gray-900 dark:text-white">
                              {sp.beneficiary?.fullName || "—"}
                              {sp.beneficiary?.orphanCode && (
                                <span className="block text-[10px] text-gray-400 font-mono">{sp.beneficiary.orphanCode}</span>
                              )}
                            </td>
                            <td className="p-3">
                              <span className="font-semibold text-gray-800 dark:text-slate-200">{sp.sponsor?.fullName || "—"}</span>
                              {sp.sponsor?.phone && (
                                <span className="block text-[10px] text-gray-400 font-mono">{sp.sponsor.phone}</span>
                              )}
                            </td>
                            <td className="p-3 font-mono text-[11px]">
                              {sp.endDate ? new Date(sp.endDate).toLocaleDateString("en-GB") : "—"}
                            </td>
                            <td className="p-3 text-center">
                              <Badge
                                className={`text-[10px] font-bold ${
                                  isOverdue
                                    ? "bg-rose-500/15 text-rose-600 border-rose-500/30"
                                    : daysLeft <= 7
                                    ? "bg-amber-500/15 text-amber-600 border-amber-500/30"
                                    : "bg-blue-500/15 text-blue-600 border-blue-500/30"
                                }`}
                              >
                                {isOverdue ? `منتهية (${Math.abs(daysLeft)} يوم)` : `${daysLeft} يوم متبقي`}
                              </Badge>
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {sp.sponsor?.phone && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      sendWhatsApp(
                                        sp.sponsor.phone,
                                        `السلام عليكم ورحمة الله وبركاته،\nالأخ الكريم ${sp.sponsor.fullName}، جزاكم الله خيراً على كفالتكم المباركة لليتيم "${sp.beneficiary?.fullName}". نود تذكيركم بأن الكفالة ستنتهي قريباً، ونسعد بتواصلكم لتجديدها.`
                                      )
                                    }
                                    className="h-7 px-2 text-[10px] font-bold text-emerald-600 border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                                  >
                                    <MessageSquare className="h-3.5 w-3.5 ml-1" />
                                    واتساب الكفيل
                                  </Button>
                                )}
                                {sp.beneficiary?.id && (
                                  <Link
                                    href={`/dashboard/orphans/${sp.beneficiary.id}`}
                                    className="p-1 text-gray-400 hover:text-indigo-600"
                                    title="عرض ملف اليتيم"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Link>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════
            TAB: FIELD VISITS
        ══════════════════════════════════════════════════════════════ */}
        <TabsContent value="visits" className="space-y-4">
          <Card className="bg-white dark:bg-slate-900/40 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-extrabold flex items-center justify-between text-gray-900 dark:text-white">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-orange-500" />
                  الأسر التي لم تُزر منذ أكثر من 90 يوماً
                </span>
                <Badge className="bg-orange-500/15 text-orange-600 border-orange-500/30 text-xs">
                  {filteredUnvisited.length} أسرة
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                هذه الأسر بحاجة لتنسيق زيارات ميدانية للتحقق من الحالة المعيشية والاحتياجات.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredUnvisited.length === 0 ? (
                <div className="text-center py-12 text-xs text-gray-400">لا توجد أسر متأخرة عن الزيارة.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-gray-100 dark:bg-slate-950 text-gray-700 dark:text-slate-300 font-bold border-b border-gray-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3">اسم رب الأسرة</th>
                        <th className="p-3">الموقع الجغرافي</th>
                        <th className="p-3">الهاتف</th>
                        <th className="p-3 text-center">آخر زيارة</th>
                        <th className="p-3 text-center">مستوى الفقر</th>
                        <th className="p-3 text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-gray-700 dark:text-slate-300">
                      {filteredUnvisited.map((f) => {
                        const lastActivity = f.caseActivities?.[0]
                        const lastVisit = lastActivity
                          ? new Date(lastActivity.createdAt).toLocaleDateString("en-GB")
                          : "لا توجد زيارات"

                        return (
                          <tr key={f.id} className="hover:bg-gray-50 dark:hover:bg-slate-900/30 transition-colors">
                            <td className="p-3 font-bold text-gray-900 dark:text-white">{f.headFullName}</td>
                            <td className="p-3">
                              <span className="text-gray-700 dark:text-slate-300">
                                {f.subDistrict?.district?.governorate?.nameAr || "—"} / {f.subDistrict?.district?.nameAr || "—"}
                              </span>
                              {f.subDistrict?.nameAr && (
                                <span className="block text-[10px] text-gray-400">{f.subDistrict.nameAr}</span>
                              )}
                            </td>
                            <td className="p-3 font-mono text-[11px]">{f.headPhoneNumber || "—"}</td>
                            <td className="p-3 text-center text-[11px] text-gray-500">{lastVisit}</td>
                            <td className="p-3 text-center">
                              <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20 font-bold text-[10px]">
                                {f.vulnerabilityScore || 0}%
                              </Badge>
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedFamily(f)
                                    setVisitTitle(`زيارة ميدانية لأسرة ${f.headFullName}`)
                                    setVisitType("VISIT")
                                    setVisitModalOpen(true)
                                  }}
                                  className="h-7 px-2.5 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
                                >
                                  <ClipboardCheck className="h-3.5 w-3.5 ml-1" />
                                  تسجيل زيارة
                                </Button>
                                {f.headPhoneNumber && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      sendWhatsApp(
                                        f.headPhoneNumber,
                                        `السلام عليكم أخي ${f.headFullName}، نود الاطمئنان على أحوال أسرتكم الكريمة وترتيب موعد الزيارة الدورية الميدانية.`
                                      )
                                    }
                                    className="h-7 px-2 text-[10px] text-emerald-600 border-emerald-500/30"
                                  >
                                    <MessageSquare className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════
            TAB: AGING OUT (18 YEARS)
        ══════════════════════════════════════════════════════════════ */}
        <TabsContent value="aging" className="space-y-4">
          <Card className="bg-white dark:bg-slate-900/40 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-extrabold flex items-center justify-between text-gray-900 dark:text-white">
                <span className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-blue-500" />
                  أيتام يقتربون من سن الرشد والتخرج (17.5 سنة فما فوق)
                </span>
                <Badge className="bg-blue-500/15 text-blue-600 border-blue-500/30 text-xs">
                  {filteredAgingOut.length} يتيم
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                متابعة هؤلاء الأيتام لنقلهم لبرامج التدريب المهني والتمكين، أو تخريجهم من الكفالة الأساسية.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredAgingOut.length === 0 ? (
                <div className="text-center py-12 text-xs text-gray-400">لا يوجد أيتام مقتربين من سن 18 حالياً.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-gray-100 dark:bg-slate-950 text-gray-700 dark:text-slate-300 font-bold border-b border-gray-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3">اسم اليتيم</th>
                        <th className="p-3">الكود</th>
                        <th className="p-3">تاريخ الميلاد</th>
                        <th className="p-3 text-center">العمر المحسوب</th>
                        <th className="p-3">حالة الكفالة</th>
                        <th className="p-3 text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-gray-700 dark:text-slate-300">
                      {filteredAgingOut.map((o) => {
                        const birth = o.birthdate ? new Date(o.birthdate) : null
                        const ageYears = birth
                          ? ((Date.now() - birth.getTime()) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1)
                          : "—"
                        const hasSponsor = o.sponsorships && o.sponsorships.length > 0

                        return (
                          <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-slate-900/30 transition-colors">
                            <td className="p-3 font-bold text-gray-900 dark:text-white">{o.fullName}</td>
                            <td className="p-3 font-mono text-[11px] text-gray-500">{o.orphanCode || "—"}</td>
                            <td className="p-3 font-mono text-[11px]">
                              {birth ? birth.toLocaleDateString("en-GB") : "—"}
                            </td>
                            <td className="p-3 text-center">
                              <Badge className="bg-blue-500/15 text-blue-600 border-blue-500/30 font-bold text-[10px]">
                                {ageYears} سنة
                              </Badge>
                            </td>
                            <td className="p-3">
                              {hasSponsor ? (
                                <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px] font-bold">
                                  مكفول: {o.sponsorships[0]?.sponsor?.fullName || "—"}
                                </Badge>
                              ) : (
                                <Badge className="bg-gray-100 text-gray-600 text-[10px]">قائمة الانتظار</Badge>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <Link
                                  href={`/dashboard/orphans/${o.id}`}
                                  className="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1"
                                >
                                  عرض الملف
                                  <ChevronRight className="h-3.5 w-3.5" />
                                </Link>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════
            TAB: MISSING KURAIMI ACCOUNT
        ══════════════════════════════════════════════════════════════ */}
        <TabsContent value="accounts" className="space-y-4">
          <Card className="bg-white dark:bg-slate-900/40 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-extrabold flex items-center justify-between text-gray-900 dark:text-white">
                <span className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-purple-500" />
                  أيتام مكفولين بدون رقم حساب بنكي / كريمي
                </span>
                <Badge className="bg-purple-500/15 text-purple-600 border-purple-500/30 text-xs">
                  {filteredMissingAccount.length} يتيم
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                هؤلاء الأيتام لديهم كفالة نشطة لكن يفتقرون لرقم حساب كريمي معتمد لتحويل مخصص الكفالة.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredMissingAccount.length === 0 ? (
                <div className="text-center py-12 text-xs text-gray-400">جميع الأيتام المكفولين لديهم حسابات مسجلة 🎉</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-gray-100 dark:bg-slate-950 text-gray-700 dark:text-slate-300 font-bold border-b border-gray-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3">اسم اليتيم</th>
                        <th className="p-3">الكود</th>
                        <th className="p-3">الكفيل</th>
                        <th className="p-3">هاتف ولي الأمر</th>
                        <th className="p-3 text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-gray-700 dark:text-slate-300">
                      {filteredMissingAccount.map((o) => (
                        <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-slate-900/30 transition-colors">
                          <td className="p-3 font-bold text-gray-900 dark:text-white">{o.fullName}</td>
                          <td className="p-3 font-mono text-[11px] text-gray-500">{o.orphanCode || "—"}</td>
                          <td className="p-3 text-gray-800 dark:text-slate-200">
                            {o.sponsorships?.[0]?.sponsor?.fullName || "—"}
                          </td>
                          <td className="p-3 font-mono text-[11px]">{o.family?.headPhoneNumber || "—"}</td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {o.family?.headPhoneNumber && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    sendWhatsApp(
                                      o.family.headPhoneNumber,
                                      `السلام عليكم ورحمة الله، نرجو منكم تزويدنا برقم حساب بنك الكريمي الخاص باليتيم "${o.fullName}" لصرف المخصص المالي للكفالة.`
                                    )
                                  }
                                  className="h-7 px-2 text-[10px] text-purple-600 border-purple-500/30 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                                >
                                  <MessageSquare className="h-3 w-3 ml-1" />
                                  طلب الحساب
                                </Button>
                              )}
                              <Link
                                href={`/dashboard/orphans/${o.id}`}
                                className="text-xs text-indigo-600 hover:text-indigo-700 font-bold"
                              >
                                تعديل الملف
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════
            TAB: URGENT WAITING ORPHANS
        ══════════════════════════════════════════════════════════════ */}
        <TabsContent value="urgent" className="space-y-4">
          <Card className="bg-white dark:bg-slate-900/40 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-extrabold flex items-center justify-between text-gray-900 dark:text-white">
                <span className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-red-500" />
                  أيتام الأبوين في قائمة الانتظار بدون كفالة
                </span>
                <Badge className="bg-red-500/15 text-red-600 border-red-500/30 text-xs">
                  {filteredUrgentWaiting.length} يتيم
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                أشد الحالات احتياجاً في النظام (فقدوا كلا الوالدين) ولا يزالون بدون كفيل لتسويقهم أولاً.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredUrgentWaiting.length === 0 ? (
                <div className="text-center py-12 text-xs text-gray-400">لا يوجد أيتام أبوين بانتظار الكفالة حالياً.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-gray-100 dark:bg-slate-950 text-gray-700 dark:text-slate-300 font-bold border-b border-gray-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3">اسم اليتيم</th>
                        <th className="p-3">الكود</th>
                        <th className="p-3">ولي الأمر</th>
                        <th className="p-3">الهاتف</th>
                        <th className="p-3 text-center">درجة الاحتياج</th>
                        <th className="p-3 text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-gray-700 dark:text-slate-300">
                      {filteredUrgentWaiting.map((o) => (
                        <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-slate-900/30 transition-colors">
                          <td className="p-3 font-bold text-gray-900 dark:text-white">{o.fullName}</td>
                          <td className="p-3 font-mono text-[11px] text-gray-500">{o.orphanCode || "—"}</td>
                          <td className="p-3 text-gray-800 dark:text-slate-200">{o.family?.headFullName || "—"}</td>
                          <td className="p-3 font-mono text-[11px]">{o.family?.headPhoneNumber || "—"}</td>
                          <td className="p-3 text-center">
                            <Badge className="bg-red-500/15 text-red-600 border-red-500/30 font-bold text-[10px]">
                              أيتام الأبوين
                            </Badge>
                          </td>
                          <td className="p-3 text-center">
                            <Link
                              href={`/dashboard/orphans/${o.id}`}
                              className="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center justify-center gap-1"
                            >
                              تسويق / ربط بكفيل
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── RECORD VISIT DIALOG ── */}
      {visitModalOpen && selectedFamily && (
        <Dialog open={visitModalOpen} onOpenChange={setVisitModalOpen}>
          <DialogContent className="max-w-md text-right" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-sm font-extrabold flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-emerald-500" />
                تسجيل زيارة / نشاط ميداني
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleRecordVisit} className="space-y-3 pt-2">
              <div className="bg-gray-50 dark:bg-slate-900 p-2.5 rounded-xl border border-gray-100 dark:border-slate-800 text-xs">
                <span className="text-gray-500 block">رب الأسرة:</span>
                <span className="font-bold text-gray-900 dark:text-white">{selectedFamily.headFullName}</span>
                {selectedFamily.headPhoneNumber && (
                  <span className="text-[11px] text-gray-400 block font-mono mt-0.5">{selectedFamily.headPhoneNumber}</span>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300">نوع النشاط</label>
                <select
                  value={visitType}
                  onChange={(e) => setVisitType(e.target.value)}
                  className="flex h-9 w-full rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs font-semibold focus-visible:outline-none text-right"
                  required
                >
                  <option value="VISIT">زيارة ميدانية منزلية</option>
                  <option value="CALL">اتصال هاتفي ومتابعة</option>
                  <option value="HEALTH_CHECK">فحص ومتابعة صحية</option>
                  <option value="EDUCATION_CHECK">متابعة دراسية وتعليمية</option>
                  <option value="FINANCIAL_ASSISTANCE">تقديم مساعدة طارئة</option>
                  <option value="OTHER">نشاط آخر</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300">عنوان النشاط / الزيارة</label>
                <Input
                  value={visitTitle}
                  onChange={(e) => setVisitTitle(e.target.value)}
                  placeholder="مثال: زيارة دورية لتفقد الاحتياجات"
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300">ملاحظات وتقرير الزيارة</label>
                <textarea
                  value={visitDesc}
                  onChange={(e) => setVisitDesc(e.target.value)}
                  rows={3}
                  placeholder="اكتب تقريراً موجزاً عن وضع الأسرة واليتيم..."
                  className="w-full rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-xs focus-visible:outline-none"
                />
              </div>

              <DialogFooter className="flex gap-2 sm:justify-start pt-2">
                <Button
                  type="submit"
                  disabled={submittingVisit || !visitTitle.trim()}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                >
                  حفظ الزيارة وتحديث السجل
                </Button>
                <Button type="button" variant="outline" onClick={() => setVisitModalOpen(false)} className="text-xs">
                  إلغاء
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

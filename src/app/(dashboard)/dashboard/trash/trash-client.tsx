"use client"

import { useState, useMemo, useEffect } from "react"
import {
  getDeletedRecords,
  restoreRecord,
  purgeRecord,
  restoreAllRecords,
} from "@/app/actions/trash-actions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Trash2,
  RefreshCw,
  AlertTriangle,
  Users,
  HeartHandshake,
  FolderHeart,
  Calendar,
  Activity,
  Search,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ShieldAlert,
} from "lucide-react"

interface TrashClientProps {
  initialData: {
    families: any[]
    beneficiaries: any[]
    sponsors: any[]
    sponsorships: any[]
    projects: any[]
  }
}

export function TrashClient({ initialData }: TrashClientProps) {
  const [mounted, setMounted] = useState(false)
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("families")
  const [search, setSearch] = useState("")

  // Confirm dialogs
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    type: "RESTORE" | "PURGE" | "RESTORE_ALL"
    entityType: string
    entityId?: string
    name: string
  }>({
    open: false,
    type: "RESTORE",
    entityType: "",
    name: "",
  })

  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState({ text: "", type: "" })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (message.text) {
      const t = setTimeout(() => setMessage({ text: "", type: "" }), 4000)
      return () => clearTimeout(t)
    }
  }, [message])

  const loadData = async () => {
    setLoading(true)
    const result = await getDeletedRecords()
    if (result.success) {
      setData({
        families: result.families,
        beneficiaries: result.beneficiaries,
        sponsors: result.sponsors,
        sponsorships: result.sponsorships,
        projects: result.projects,
      })
    }
    setLoading(false)
  }

  const handleExecuteAction = async () => {
    setActionLoading(true)
    try {
      if (confirmDialog.type === "RESTORE" && confirmDialog.entityId) {
        const res = await restoreRecord(confirmDialog.entityType, confirmDialog.entityId)
        if (res.success) {
          setMessage({ text: `تمت استعادة "${confirmDialog.name}" بنجاح! ✅`, type: "success" })
          await loadData()
        } else {
          setMessage({ text: res.error || "فشل استعادة السجل", type: "error" })
        }
      } else if (confirmDialog.type === "PURGE" && confirmDialog.entityId) {
        const res = await purgeRecord(confirmDialog.entityType, confirmDialog.entityId)
        if (res.success) {
          setMessage({ text: `تم حذف "${confirmDialog.name}" نهائياً من قاعدة البيانات.`, type: "success" })
          await loadData()
        } else {
          setMessage({ text: res.error || "فشل الحذف النهائي", type: "error" })
        }
      } else if (confirmDialog.type === "RESTORE_ALL") {
        const res = await restoreAllRecords(confirmDialog.entityType)
        if (res.success) {
          setMessage({ text: "تمت استعادة جميع السجلات في هذا القسم بنجاح! ✅", type: "success" })
          await loadData()
        } else {
          setMessage({ text: res.error || "فشل استعادة السجلات", type: "error" })
        }
      }
    } catch (err: any) {
      setMessage({ text: err.message || "حدث خطأ غير متوقع", type: "error" })
    }
    setActionLoading(false)
    setConfirmDialog((prev) => ({ ...prev, open: false }))
  }

  const formatDate = (d: any) => {
    return d ? new Date(d).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" }) : "—"
  }

  const totalTrash =
    data.families.length +
    data.beneficiaries.length +
    data.sponsors.length +
    data.sponsorships.length +
    data.projects.length

  // Filtered queries per tab
  const q = search.toLowerCase().trim()

  const filteredFamilies = useMemo(() => {
    if (!q) return data.families
    return data.families.filter(
      (f: any) =>
        f.headFullName?.toLowerCase().includes(q) ||
        f.headNationalId?.toLowerCase().includes(q) ||
        f.headPhoneNumber?.includes(q)
    )
  }, [data.families, q])

  const filteredBeneficiaries = useMemo(() => {
    if (!q) return data.beneficiaries
    return data.beneficiaries.filter(
      (b: any) =>
        b.fullName?.toLowerCase().includes(q) ||
        b.orphanCode?.toLowerCase().includes(q)
    )
  }, [data.beneficiaries, q])

  const filteredSponsors = useMemo(() => {
    if (!q) return data.sponsors
    return data.sponsors.filter(
      (s: any) =>
        s.fullName?.toLowerCase().includes(q) ||
        s.phone?.includes(q) ||
        s.country?.toLowerCase().includes(q)
    )
  }, [data.sponsors, q])

  const filteredSponsorships = useMemo(() => {
    if (!q) return data.sponsorships
    return data.sponsorships.filter(
      (sp: any) =>
        String(sp.amount).includes(q) ||
        sp.currency?.toLowerCase().includes(q)
    )
  }, [data.sponsorships, q])

  const filteredProjects = useMemo(() => {
    if (!q) return data.projects
    return data.projects.filter(
      (p: any) =>
        p.name?.toLowerCase().includes(q) ||
        p.code?.toLowerCase().includes(q)
    )
  }, [data.projects, q])

  if (!mounted) return null

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* ── Page Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-rose-700 via-red-600 to-amber-600 p-6 text-white shadow-xl">
        <div className="absolute -left-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-xl" />
        <div className="absolute -bottom-8 left-20 h-32 w-32 rounded-full bg-white/10 blur-xl" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold flex items-center gap-2">
              <Trash2 className="h-6 w-6" />
              سلة المهملات وإدارة المحذوفات (Soft Delete)
            </h2>
            <p className="mt-1 text-xs md:text-sm text-rose-100 font-medium">
              مراجعة السجلات المستبعدة مؤقتاً، مع إمكانية استعادتها فورياً أو الحذف النهائي لتطهير النظام.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={loading}
              className="bg-white/15 hover:bg-white/25 border-white/20 text-white text-xs font-bold gap-1.5 h-9"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              تحديث السلة
            </Button>
            <div className="rounded-xl bg-white/20 px-4 py-2 text-center backdrop-blur-md border border-white/20">
              <p className="text-xl font-extrabold">{totalTrash}</p>
              <p className="text-[10px] text-rose-100 font-semibold">إجمالي المحذوفات</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Feedback Message ── */}
      {message.text && (
        <div
          className={`p-3 rounded-xl text-xs font-bold border flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50"
              : "bg-rose-50 dark:bg-red-950/40 text-rose-700 dark:text-red-400 border-rose-200 dark:border-red-900/50"
          }`}
        >
          {message.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {message.text}
        </div>
      )}

      {/* ── Architectural Notice Banner ── */}
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 flex items-start gap-3 shadow-xs">
        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800 dark:text-amber-300 space-y-1">
          <span className="font-bold block text-sm">تنويه معماري هام للمشرفين والمسؤولين:</span>
          <p className="leading-relaxed">
            جميع السجلات المحذوفة هنا تخضع لنمط "الحذف المؤقت (Soft Delete)" للحماية من الضياع العشوائي.
            عند استعادتك لأسرة أو كفيل، يعود الحساب للعمل بكافة خصائصه. وعند قيامك بـ "الحذف النهائي"، فإنك تقوم بمسحه مع جميع المرفقات والارتباطات المالية المتعلقة به إلى الأبد.
          </p>
        </div>
      </div>

      {/* ── KPI STATS CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: "الأسر المحذوفة", value: data.families.length, icon: Users, tab: "families", color: "text-blue-500" },
          { label: "الأيتام والمستفيدون", value: data.beneficiaries.length, icon: Activity, tab: "beneficiaries", color: "text-pink-500" },
          { label: "الكفلاء المحذوفون", value: data.sponsors.length, icon: HeartHandshake, tab: "sponsors", color: "text-amber-500" },
          { label: "الكفالات المحذوفة", value: data.sponsorships.length, icon: FolderHeart, tab: "sponsorships", color: "text-emerald-500" },
          { label: "المشاريع المحذوفة", value: data.projects.length, icon: Calendar, tab: "projects", color: "text-indigo-500" },
        ].map((item) => {
          const Icon = item.icon
          return (
            <Card
              key={item.label}
              onClick={() => setActiveTab(item.tab)}
              className={`cursor-pointer transition-all hover:scale-[1.02] border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 rounded-xl shadow-xs`}
            >
              <CardContent className="p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-500 dark:text-slate-400 font-semibold block">{item.label}</span>
                  <span className={`text-xl font-extrabold ${item.color}`}>{item.value}</span>
                </div>
                <Icon className={`h-5 w-5 ${item.color}`} />
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ── SEARCH & BATCH ACTIONS ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900/40 p-3 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <Input
            placeholder="بحث بالاسم أو الرقم أو الكود في السلة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8.5 pr-8.5 pl-3 text-xs rounded-xl"
          />
        </div>

        {/* Current tab count indicator */}
        <div className="text-xs text-gray-500 dark:text-slate-400 font-semibold">
          {totalTrash === 0 ? "السلة نظيفة ولا توجد عناصر محذوفة" : `يوجد ${totalTrash} عنصر في سلة المهملات`}
        </div>
      </div>

      {/* ── TABS & TABLES ── */}
      <Card className="bg-white dark:bg-slate-900/40 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl" className="space-y-6">
            <TabsList className="flex flex-wrap gap-1.5 justify-start border-b border-gray-200 dark:border-slate-800 pb-3 bg-transparent h-auto">
              <TabsTrigger
                value="families"
                className="rounded-lg px-3.5 py-1.5 font-bold text-xs border border-gray-200 dark:border-slate-800 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-slate-800 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white gap-1.5"
              >
                <Users className="h-3.5 w-3.5" />
                الأسر المحذوفة ({data.families.length})
              </TabsTrigger>
              <TabsTrigger
                value="beneficiaries"
                className="rounded-lg px-3.5 py-1.5 font-bold text-xs border border-gray-200 dark:border-slate-800 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-slate-800 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white gap-1.5"
              >
                <Activity className="h-3.5 w-3.5" />
                الأيتام / المستفيدون ({data.beneficiaries.length})
              </TabsTrigger>
              <TabsTrigger
                value="sponsors"
                className="rounded-lg px-3.5 py-1.5 font-bold text-xs border border-gray-200 dark:border-slate-800 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-slate-800 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white gap-1.5"
              >
                <HeartHandshake className="h-3.5 w-3.5" />
                الكفلاء ({data.sponsors.length})
              </TabsTrigger>
              <TabsTrigger
                value="sponsorships"
                className="rounded-lg px-3.5 py-1.5 font-bold text-xs border border-gray-200 dark:border-slate-800 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-slate-800 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white gap-1.5"
              >
                <FolderHeart className="h-3.5 w-3.5" />
                الكفالات ({data.sponsorships.length})
              </TabsTrigger>
              <TabsTrigger
                value="projects"
                className="rounded-lg px-3.5 py-1.5 font-bold text-xs border border-gray-200 dark:border-slate-800 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-slate-800 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white gap-1.5"
              >
                <Calendar className="h-3.5 w-3.5" />
                المشاريع ({data.projects.length})
              </TabsTrigger>
            </TabsList>

            {/* ── Families Tab ── */}
            <TabsContent value="families">
              {filteredFamilies.length === 0 ? (
                <div className="text-center py-12 text-xs text-gray-400 font-semibold border border-dashed border-gray-200 dark:border-slate-800 rounded-xl">
                  {search ? "لا توجد أسر محذوفة مطابقة للبحث." : "سلة المهملات فارغة، لا توجد أسر محذوفة حالياً."}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setConfirmDialog({
                          open: true,
                          type: "RESTORE_ALL",
                          entityType: "FAMILY",
                          name: "جميع الأسر المحذوفة",
                        })
                      }
                      className="text-xs font-bold text-emerald-600 border-emerald-500/30 gap-1.5"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      استعادة كافة الأسر
                    </Button>
                  </div>
                  <div className="border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <Table className="text-right text-xs">
                      <TableHeader className="bg-gray-100 dark:bg-slate-950 font-bold">
                        <TableRow>
                          <th className="p-3">اسم رب الأسرة</th>
                          <th className="p-3">الرقم الوطني</th>
                          <th className="p-3">تاريخ الحذف</th>
                          <th className="p-3 text-center">الإجراءات</th>
                        </TableRow>
                      </TableHeader>
                      <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-gray-700 dark:text-slate-300">
                        {filteredFamilies.map((f: any) => (
                          <tr key={f.id} className="hover:bg-gray-50 dark:hover:bg-slate-900/30 transition-colors">
                            <td className="p-3 font-bold text-gray-900 dark:text-white">{f.headFullName}</td>
                            <td className="p-3 font-mono text-[11px]">{f.headNationalId}</td>
                            <td className="p-3 font-mono text-[11px] text-gray-500">{formatDate(f.deletedAt)}</td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    setConfirmDialog({
                                      open: true,
                                      type: "RESTORE",
                                      entityType: "FAMILY",
                                      entityId: f.id,
                                      name: f.headFullName,
                                    })
                                  }
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] h-7 px-2.5 gap-1"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                  استعادة
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() =>
                                    setConfirmDialog({
                                      open: true,
                                      type: "PURGE",
                                      entityType: "FAMILY",
                                      entityId: f.id,
                                      name: f.headFullName,
                                    })
                                  }
                                  className="font-bold text-[10px] h-7 px-2.5 gap-1"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  حذف نهائي
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ── Beneficiaries Tab ── */}
            <TabsContent value="beneficiaries">
              {filteredBeneficiaries.length === 0 ? (
                <div className="text-center py-12 text-xs text-gray-400 font-semibold border border-dashed border-gray-200 dark:border-slate-800 rounded-xl">
                  {search ? "لا يوجد أيتام محذوفون مطابقون للبحث." : "سلة المهملات فارغة، لا يوجد أيتام أو مستفيدون محذوفون حالياً."}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setConfirmDialog({
                          open: true,
                          type: "RESTORE_ALL",
                          entityType: "BENEFICIARY",
                          name: "جميع الأيتام والمستفيدين",
                        })
                      }
                      className="text-xs font-bold text-emerald-600 border-emerald-500/30 gap-1.5"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      استعادة كافة الأيتام
                    </Button>
                  </div>
                  <div className="border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <Table className="text-right text-xs">
                      <TableHeader className="bg-gray-100 dark:bg-slate-950 font-bold">
                        <TableRow>
                          <th className="p-3">الاسم الكامل</th>
                          <th className="p-3">الكود</th>
                          <th className="p-3">الفئة</th>
                          <th className="p-3">تاريخ الحذف</th>
                          <th className="p-3 text-center">الإجراءات</th>
                        </TableRow>
                      </TableHeader>
                      <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-gray-700 dark:text-slate-300">
                        {filteredBeneficiaries.map((b: any) => (
                          <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-slate-900/30 transition-colors">
                            <td className="p-3 font-bold text-gray-900 dark:text-white">{b.fullName}</td>
                            <td className="p-3 font-mono text-[11px] text-gray-500">{b.orphanCode || "—"}</td>
                            <td className="p-3 font-semibold">
                              <Badge className="bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 text-[10px]">
                                {b.category === "ORPHAN" ? "يتيم" : b.category === "STUDENT" ? "طالب علم" : "مستفيد"}
                              </Badge>
                            </td>
                            <td className="p-3 font-mono text-[11px] text-gray-500">{formatDate(b.deletedAt)}</td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    setConfirmDialog({
                                      open: true,
                                      type: "RESTORE",
                                      entityType: "BENEFICIARY",
                                      entityId: b.id,
                                      name: b.fullName,
                                    })
                                  }
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] h-7 px-2.5 gap-1"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                  استعادة
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() =>
                                    setConfirmDialog({
                                      open: true,
                                      type: "PURGE",
                                      entityType: "BENEFICIARY",
                                      entityId: b.id,
                                      name: b.fullName,
                                    })
                                  }
                                  className="font-bold text-[10px] h-7 px-2.5 gap-1"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  حذف نهائي
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ── Sponsors Tab ── */}
            <TabsContent value="sponsors">
              {filteredSponsors.length === 0 ? (
                <div className="text-center py-12 text-xs text-gray-400 font-semibold border border-dashed border-gray-200 dark:border-slate-800 rounded-xl">
                  {search ? "لا يوجد كفلاء محذوفون مطابقون للبحث." : "سلة المهملات فارغة، لا يوجد كفلاء محذوفون حالياً."}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <Table className="text-right text-xs">
                      <TableHeader className="bg-gray-100 dark:bg-slate-950 font-bold">
                        <TableRow>
                          <th className="p-3">اسم الكفيل</th>
                          <th className="p-3">البلد</th>
                          <th className="p-3">الهاتف</th>
                          <th className="p-3">تاريخ الحذف</th>
                          <th className="p-3 text-center">الإجراءات</th>
                        </TableRow>
                      </TableHeader>
                      <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-gray-700 dark:text-slate-300">
                        {filteredSponsors.map((s: any) => (
                          <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-slate-900/30 transition-colors">
                            <td className="p-3 font-bold text-gray-900 dark:text-white">{s.fullName}</td>
                            <td className="p-3">{s.country || "—"}</td>
                            <td className="p-3 font-mono text-[11px]">{s.phone || "—"}</td>
                            <td className="p-3 font-mono text-[11px] text-gray-500">{formatDate(s.deletedAt)}</td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    setConfirmDialog({
                                      open: true,
                                      type: "RESTORE",
                                      entityType: "SPONSOR",
                                      entityId: s.id,
                                      name: s.fullName,
                                    })
                                  }
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] h-7 px-2.5 gap-1"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                  استعادة
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() =>
                                    setConfirmDialog({
                                      open: true,
                                      type: "PURGE",
                                      entityType: "SPONSOR",
                                      entityId: s.id,
                                      name: s.fullName,
                                    })
                                  }
                                  className="font-bold text-[10px] h-7 px-2.5 gap-1"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  حذف نهائي
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ── Sponsorships Tab ── */}
            <TabsContent value="sponsorships">
              {filteredSponsorships.length === 0 ? (
                <div className="text-center py-12 text-xs text-gray-400 font-semibold border border-dashed border-gray-200 dark:border-slate-800 rounded-xl">
                  {search ? "لا توجد كفالات محذوفة مطابقة للبحث." : "سلة المهملات فارغة، لا توجد كفالات محذوفة حالياً."}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <Table className="text-right text-xs">
                      <TableHeader className="bg-gray-100 dark:bg-slate-950 font-bold">
                        <TableRow>
                          <th className="p-3">قيمة الكفالة</th>
                          <th className="p-3">الدورة المالية</th>
                          <th className="p-3">تاريخ الحذف</th>
                          <th className="p-3 text-center">الإجراءات</th>
                        </TableRow>
                      </TableHeader>
                      <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-gray-700 dark:text-slate-300">
                        {filteredSponsorships.map((sp: any) => (
                          <tr key={sp.id} className="hover:bg-gray-50 dark:hover:bg-slate-900/30 transition-colors">
                            <td className="p-3 font-mono font-bold text-gray-900 dark:text-white">
                              {Number(sp.amount).toLocaleString("en-US")} {sp.currency}
                            </td>
                            <td className="p-3">
                              {sp.paymentCycle === "MONTHLY" ? "شهري" : sp.paymentCycle === "ANNUAL" ? "سنوي" : "أخرى"}
                            </td>
                            <td className="p-3 font-mono text-[11px] text-gray-500">{formatDate(sp.deletedAt)}</td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    setConfirmDialog({
                                      open: true,
                                      type: "RESTORE",
                                      entityType: "SPONSORSHIP",
                                      entityId: sp.id,
                                      name: `كفالة بمبلغ ${sp.amount} ${sp.currency}`,
                                    })
                                  }
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] h-7 px-2.5 gap-1"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                  استعادة
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() =>
                                    setConfirmDialog({
                                      open: true,
                                      type: "PURGE",
                                      entityType: "SPONSORSHIP",
                                      entityId: sp.id,
                                      name: `كفالة بمبلغ ${sp.amount} ${sp.currency}`,
                                    })
                                  }
                                  className="font-bold text-[10px] h-7 px-2.5 gap-1"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  حذف نهائي
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ── Projects Tab ── */}
            <TabsContent value="projects">
              {filteredProjects.length === 0 ? (
                <div className="text-center py-12 text-xs text-gray-400 font-semibold border border-dashed border-gray-200 dark:border-slate-800 rounded-xl">
                  {search ? "لا توجد مشاريع محذوفة مطابقة للبحث." : "سلة المهملات فارغة، لا توجد مشاريع محذوفة حالياً."}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <Table className="text-right text-xs">
                      <TableHeader className="bg-gray-100 dark:bg-slate-950 font-bold">
                        <TableRow>
                          <th className="p-3">اسم المشروع</th>
                          <th className="p-3">الميزانية</th>
                          <th className="p-3">تاريخ الحذف</th>
                          <th className="p-3 text-center">الإجراءات</th>
                        </TableRow>
                      </TableHeader>
                      <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-gray-700 dark:text-slate-300">
                        {filteredProjects.map((p: any) => (
                          <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-slate-900/30 transition-colors">
                            <td className="p-3 font-bold text-gray-900 dark:text-white">{p.name}</td>
                            <td className="p-3 font-mono text-[11px]">
                              {p.budget ? `${Number(p.budget).toLocaleString("en-US")} ${p.currency}` : "—"}
                            </td>
                            <td className="p-3 font-mono text-[11px] text-gray-500">{formatDate(p.deletedAt)}</td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    setConfirmDialog({
                                      open: true,
                                      type: "RESTORE",
                                      entityType: "PROJECT",
                                      entityId: p.id,
                                      name: p.name,
                                    })
                                  }
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] h-7 px-2.5 gap-1"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                  استعادة
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() =>
                                    setConfirmDialog({
                                      open: true,
                                      type: "PURGE",
                                      entityType: "PROJECT",
                                      entityId: p.id,
                                      name: p.name,
                                    })
                                  }
                                  className="font-bold text-[10px] h-7 px-2.5 gap-1"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  حذف نهائي
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* ── CONFIRM ACTION DIALOG ── */}
      {confirmDialog.open && (
        <Dialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog((p) => ({ ...p, open: false }))}>
          <DialogContent className="max-w-md text-right" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-sm font-extrabold flex items-center gap-2">
                {confirmDialog.type === "PURGE" ? (
                  <>
                    <ShieldAlert className="h-5 w-5 text-rose-500" />
                    تأكيد الحذف النهائي والتطهير
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-5 w-5 text-emerald-500" />
                    تأكيد استعادة السجل
                  </>
                )}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 pt-2 text-xs">
              {confirmDialog.type === "PURGE" ? (
                <div className="bg-rose-50 dark:bg-rose-950/30 p-3 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 space-y-2">
                  <p className="font-bold text-sm">⚠️ تنبيه خطير — لا يمكن التراجع!</p>
                  <p>
                    أنت على وشك حذف السجل: <strong>"{confirmDialog.name}"</strong> نهائياً وبلا رجعة من قاعدة البيانات.
                    سيتم حذف كافة المرفقات والبيانات والارتباطات المالية المتعلقة به بشكل دائم.
                  </p>
                </div>
              ) : (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 space-y-1">
                  <p className="font-bold">هل أنت متأكد من استعادة هذا الملف؟</p>
                  <p>
                    سيتم إعادة تنشيط <strong>"{confirmDialog.name}"</strong> وعودته إلى القوائم النشطة في النظام بكامل خصائصه.
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="flex gap-2 sm:justify-start pt-3">
              <Button
                type="button"
                disabled={actionLoading}
                onClick={handleExecuteAction}
                className={
                  confirmDialog.type === "PURGE"
                    ? "bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                }
              >
                {actionLoading
                  ? "جاري التنفيذ..."
                  : confirmDialog.type === "PURGE"
                  ? "نعم، حذف نهائي الآن"
                  : "نعم، استعادة السجل"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmDialog((p) => ({ ...p, open: false }))}
                className="text-xs"
              >
                إلغاء
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

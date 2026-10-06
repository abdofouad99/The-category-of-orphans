"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Activity,
  Shield,
  User,
  Calendar,
  Clock,
  Filter,
  Search,
  Printer,
  Plus,
  Edit3,
  Trash2,
  RotateCcw,
  Eye,
  ExternalLink,
  ChevronRight,
  ClipboardList,
  CheckCircle2,
  FileText,
  Layers,
  ArrowRight,
  RefreshCw,
} from "lucide-react"
import Link from "next/link"

interface AuditEvent {
  id: string
  action: string
  entityType: string
  entityId: string
  entityName: string
  entityCode?: string
  entityLink?: string
  userName: string
  userEmail: string
  diffs?: Array<{ field: string; fieldAr: string; oldVal: string; newVal: string }>
  changesCount?: number
  title?: string
  description?: string
  createdAt: string
  type: "AUDIT" | "FIELD_ACTIVITY"
}

interface ActivityLogClientProps {
  initialLogs: AuditEvent[]
  totalCount: number
  stats: any
}

function getActionMeta(action: string, type: string) {
  if (type === "FIELD_ACTIVITY") {
    switch (action) {
      case "VISIT":
        return { label: "زيارة ميدانية", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30", icon: ClipboardList }
      case "CALL":
        return { label: "اتصال ومتابعة", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30", icon: Activity }
      default:
        return { label: "نشاط ميداني", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30", icon: Activity }
    }
  }

  switch (action) {
    case "CREATE":
      return { label: "إنشاء وتسجيل", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30", icon: Plus }
    case "UPDATE":
      return { label: "تعديل وتحديث", color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30", icon: Edit3 }
    case "DELETE":
      return { label: "حذف سجل", color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30", icon: Trash2 }
    case "RESTORE":
      return { label: "استعادة سجل", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30", icon: RotateCcw }
    default:
      return { label: action, color: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30", icon: Eye }
  }
}

function getEntityArabic(entityType: string) {
  const map: Record<string, string> = {
    FAMILY: "أسرة مستفيدة",
    BENEFICIARY: "يتيم / مستفيد",
    ORPHAN: "يتيم",
    SPONSOR: "كفيل",
    SPONSORSHIP: "كفالة",
    PROJECT: "مشروع إغاثي",
    DISTRIBUTION: "توزيع ومساعدات",
    SETTING: "الإعدادات العامة",
    USER: "مستخدم نظام",
  }
  return map[entityType] || entityType
}

export function ActivityLogClient({
  initialLogs,
  totalCount,
  stats,
}: ActivityLogClientProps) {
  const [mounted, setMounted] = useState(false)
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState("ALL")
  const [entityFilter, setEntityFilter] = useState("ALL")
  const [dateFilter, setDateFilter] = useState("ALL")
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Filtered logs
  const filteredLogs = useMemo(() => {
    const q = search.toLowerCase().trim()
    const now = new Date()

    return initialLogs.filter((ev) => {
      // Search
      const matchesSearch =
        !q ||
        ev.entityName.toLowerCase().includes(q) ||
        (ev.entityCode && ev.entityCode.toLowerCase().includes(q)) ||
        ev.userName.toLowerCase().includes(q) ||
        ev.userEmail.toLowerCase().includes(q) ||
        ev.entityId.toLowerCase().includes(q)

      // Action Filter
      let matchesAction = true
      if (actionFilter === "CREATE") matchesAction = ev.action === "CREATE"
      else if (actionFilter === "UPDATE") matchesAction = ev.action === "UPDATE"
      else if (actionFilter === "DELETE") matchesAction = ev.action === "DELETE"
      else if (actionFilter === "FIELD") matchesAction = ev.type === "FIELD_ACTIVITY"

      // Entity Filter
      let matchesEntity = true
      if (entityFilter !== "ALL") {
        if (entityFilter === "BENEFICIARY") matchesEntity = ev.entityType === "BENEFICIARY" || ev.entityType === "ORPHAN"
        else matchesEntity = ev.entityType === entityFilter
      }

      // Date Filter
      let matchesDate = true
      if (dateFilter !== "ALL") {
        const evDate = new Date(ev.createdAt).getTime()
        const oneDay = 24 * 60 * 60 * 1000
        if (dateFilter === "TODAY") {
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
          matchesDate = evDate >= todayStart
        } else if (dateFilter === "7DAYS") {
          matchesDate = evDate >= now.getTime() - 7 * oneDay
        } else if (dateFilter === "30DAYS") {
          matchesDate = evDate >= now.getTime() - 30 * oneDay
        }
      }

      return matchesSearch && matchesAction && matchesEntity && matchesDate
    })
  }, [initialLogs, search, actionFilter, entityFilter, dateFilter])

  if (!mounted) return null

  return (
    <div className="space-y-6 pb-12 text-right" dir="rtl">
      {/* ── HEADER ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-slate-900 via-indigo-950 to-slate-900 p-6 text-white border border-slate-800 shadow-xl">
        <div className="absolute -left-10 -top-10 h-48 w-48 rounded-full bg-emerald-500/10 blur-2xl" />
        <div className="absolute -bottom-8 left-20 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2.5">
              <Shield className="h-7 w-7 text-emerald-400" />
              سجل التدقيق والرقابة الشامل (Audit Log)
            </h1>
            <p className="text-xs md:text-sm text-slate-300 mt-1">
              رصد وتوثيق كافة العمليات الإدارية والحساسة بالوقت واسم المستخدم والكيان المتأثر لضمان النزاهة والحوكمة.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="bg-white/10 hover:bg-white/20 border-white/20 text-white text-xs font-bold gap-1.5 h-9"
            >
              <Printer className="h-3.5 w-3.5" />
              طباعة تقرير الرقابة
            </Button>
            <div className="rounded-xl bg-white/15 px-4 py-2 text-center backdrop-blur-md border border-white/20">
              <p className="text-xl font-extrabold text-emerald-400">{stats?.total || totalCount}</p>
              <p className="text-[10px] text-slate-300 font-semibold">إجمالي الحركات</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI STATS CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-xs rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-1 p-3.5">
            <CardTitle className="text-[11px] font-bold text-muted-foreground">إجمالي الحركات الموثقة</CardTitle>
            <Activity className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-xl font-black">{stats?.total || totalCount}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">عملية مسجلة ومحفوظة</p>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-xs rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-1 p-3.5">
            <CardTitle className="text-[11px] font-bold text-muted-foreground">عمليات التعديل</CardTitle>
            <Edit3 className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-xl font-black text-indigo-500">{stats?.updates || 0}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">تحديث بيانات وحقول</p>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-xs rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-1 p-3.5">
            <CardTitle className="text-[11px] font-bold text-muted-foreground">عمليات الإضافة</CardTitle>
            <Plus className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-xl font-black text-emerald-500">{stats?.creates || 0}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">ملفات وسجلات جديدة</p>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-xs rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-1 p-3.5">
            <CardTitle className="text-[11px] font-bold text-muted-foreground">الأنشطة الميدانية</CardTitle>
            <ClipboardList className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-xl font-black text-blue-500">{stats?.fieldActivities || 0}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">زيارات وتفقد دوري</p>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-xs rounded-xl col-span-2 sm:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-1 p-3.5">
            <CardTitle className="text-[11px] font-bold text-muted-foreground">مستوى النزاهة والحوكمة</CardTitle>
            <Shield className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-xl font-black text-emerald-500">100%</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">توثيق غير قابل للتعديل</p>
          </CardContent>
        </Card>
      </div>

      {/* ── FILTER & SEARCH CONTROLS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 bg-white dark:bg-slate-900/40 p-3 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <Input
            placeholder="بحث بالمستخدم، المستفيد، أو الكود..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8.5 pr-8.5 pl-3 text-xs rounded-xl"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="h-8.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 px-3 text-xs font-semibold text-gray-800 dark:text-slate-200"
        >
          <option value="ALL">جميع أنواع الإجراءات</option>
          <option value="UPDATE">تعديل وتحديث بيانات</option>
          <option value="CREATE">إنشاء وتسجيل جديد</option>
          <option value="DELETE">حذف سجلات</option>
          <option value="FIELD">أنشطة وزيارات ميدانية</option>
        </select>

        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="h-8.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 px-3 text-xs font-semibold text-gray-800 dark:text-slate-200"
        >
          <option value="ALL">كافة الأقسام والكيانات</option>
          <option value="BENEFICIARY">أيتام ومستفيدون</option>
          <option value="FAMILY">أسر مستفيدة</option>
          <option value="SPONSOR">كفلاء وكفالات</option>
          <option value="PROJECT">مشاريع إغاثية</option>
          <option value="USER">مستخدمون</option>
        </select>

        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="h-8.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 px-3 text-xs font-semibold text-gray-800 dark:text-slate-200"
        >
          <option value="ALL">كافة الفترات الزمنية</option>
          <option value="TODAY">اليوم فقط</option>
          <option value="7DAYS">آخر 7 أيام</option>
          <option value="30DAYS">آخر 30 يوماً</option>
        </select>
      </div>

      {/* ── LOGS TABLE ── */}
      <Card className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-xs rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-border/40 pb-3.5">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-extrabold">سجل العمليات الإدارية والرقابية</CardTitle>
              <CardDescription className="text-xs mt-0.5">توثيق الإجراءات بالاسم والتوقيت والكيان المتأثر</CardDescription>
            </div>
            <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">
              {filteredLogs.length} حركة مطابقة
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-12 w-12 rounded-2xl bg-slate-500/10 flex items-center justify-center mb-3 text-slate-400 ring-4 ring-slate-500/5">
                <Activity className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold text-foreground">لا توجد حركات رقابية مطابقة للبحث</p>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                تأكد من شروط التصفية أو قم بإفراغ حقل البحث لعرض السجل بالكامل.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-muted/40 text-muted-foreground border-b border-border/30 font-bold">
                  <tr>
                    <th className="py-3 px-4">نوع الإجراء</th>
                    <th className="py-3 px-4">المستخدم المنفذ</th>
                    <th className="py-3 px-4">القسم / الكيان</th>
                    <th className="py-3 px-4">البيان / الاسم المتأثر</th>
                    <th className="py-3 px-4">التاريخ والتوقيت</th>
                    <th className="py-3 px-4 text-center">التفاصيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20 text-gray-700 dark:text-slate-300">
                  {filteredLogs.map((log) => {
                    const meta = getActionMeta(log.action, log.type)
                    const Icon = meta.icon
                    const hasDiffs = log.diffs && log.diffs.length > 0

                    return (
                      <tr
                        key={log.id}
                        onClick={() => setSelectedEvent(log)}
                        className="hover:bg-muted/30 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${meta.color}`}>
                            <Icon className="h-3 w-3" />
                            {meta.label}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-foreground block">{log.userName}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{log.userEmail}</span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className="bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700 text-[10px] font-bold">
                            {getEntityArabic(log.entityType)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-foreground truncate">{log.entityName}</span>
                            {log.entityCode && (
                              <Badge className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 text-[9px] font-mono">
                                {log.entityCode}
                              </Badge>
                            )}
                          </div>
                          {hasDiffs && (
                            <span className="text-[10px] text-muted-foreground block mt-0.5">
                              تم تعديل {log.diffs!.length} حقل
                            </span>
                          )}
                          {log.title && (
                            <span className="text-[10px] text-muted-foreground block mt-0.5 truncate">
                              {log.title}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground font-mono text-[11px] whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString("ar-SA", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedEvent(log)
                            }}
                            className="h-7 px-2 text-gray-400 group-hover:text-indigo-600"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
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

      {/* ── DETAIL MODAL ── */}
      {selectedEvent && (
        <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
          <DialogContent className="max-w-lg text-right" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-sm font-extrabold flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-500" />
                تفاصيل الحركة الرقابية: {selectedEvent.entityName}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="bg-gray-50 dark:bg-slate-900 p-3 rounded-xl border border-gray-100 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-semibold">المستخدم المنفذ:</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {selectedEvent.userName} ({selectedEvent.userEmail})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-semibold">نوع العملية:</span>
                  <Badge className="font-bold text-[10px]">
                    {getActionMeta(selectedEvent.action, selectedEvent.type).label}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-semibold">القسم المعني:</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {getEntityArabic(selectedEvent.entityType)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-semibold">التاريخ والتوقيت:</span>
                  <span className="font-mono text-gray-700 dark:text-slate-300 text-[11px]">
                    {new Date(selectedEvent.createdAt).toLocaleString("ar-SA")}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-semibold">المعرف المرجعي:</span>
                  <span className="font-mono text-gray-400 text-[10px] select-all">
                    {selectedEvent.entityId}
                  </span>
                </div>
              </div>

              {selectedEvent.description && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-slate-300">تقرير النشاط والملاحظات:</label>
                  <p className="bg-gray-50 dark:bg-slate-900 p-2.5 rounded-xl border border-gray-100 dark:border-slate-800 text-xs text-gray-800 dark:text-slate-200 whitespace-pre-wrap">
                    {selectedEvent.description}
                  </p>
                </div>
              )}

              {selectedEvent.diffs && selectedEvent.diffs.length > 0 ? (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 dark:text-slate-300">
                    الحقول المعدلة بالتفصيل ({selectedEvent.diffs.length}):
                  </label>
                  <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-800">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-gray-100 dark:bg-slate-950 font-bold text-gray-700 dark:text-slate-300">
                        <tr>
                          <th className="p-2.5">اسم الحقل</th>
                          <th className="p-2.5">القيمة السابقة</th>
                          <th className="p-2.5">القيمة الجديدة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-gray-700 dark:text-slate-300">
                        {selectedEvent.diffs.map((d, i) => (
                          <tr key={i} className="hover:bg-gray-50 dark:hover:bg-slate-900/50">
                            <td className="p-2.5 font-bold text-gray-900 dark:text-white whitespace-nowrap">
                              {d.fieldAr}
                            </td>
                            <td className="p-2.5 text-rose-600 dark:text-rose-400 font-mono text-[11px] bg-rose-50/30 dark:bg-rose-950/20">
                              {d.oldVal}
                            </td>
                            <td className="p-2.5 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] bg-emerald-50/30 dark:bg-emerald-950/20">
                              {d.newVal}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : selectedEvent.type === "AUDIT" && (
                <p className="text-xs text-gray-400 italic text-center py-2">لا توجد تفاصيل مقارنة إضافية لهذه العملية.</p>
              )}

              {selectedEvent.entityLink && (
                <div className="pt-1">
                  <Link
                    href={selectedEvent.entityLink}
                    className="flex items-center justify-center gap-1.5 w-full py-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 rounded-xl text-xs font-bold border border-indigo-200 transition-colors"
                  >
                    فتح ملف {getEntityArabic(selectedEvent.entityType)}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>

            <DialogFooter className="sm:justify-start pt-2">
              <Button type="button" variant="outline" onClick={() => setSelectedEvent(null)} className="text-xs">
                إغلاق
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

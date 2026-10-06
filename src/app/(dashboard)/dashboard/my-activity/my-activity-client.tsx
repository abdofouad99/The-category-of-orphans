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
  Plus,
  Edit3,
  Trash2,
  RotateCcw,
  Eye,
  Calendar,
  User,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ClipboardList,
  CheckCircle2,
  Clock,
  Printer,
  Sparkles,
  ArrowRight,
  FileText,
  Shield,
  Layers,
} from "lucide-react"
import Link from "next/link"

interface ActivityEvent {
  id: string
  action: string
  entityType: string
  entityId: string
  entityName: string
  entityCode?: string
  entityLink?: string
  diffs?: Array<{ field: string; fieldAr: string; oldVal: string; newVal: string }>
  changesCount?: number
  title?: string
  description?: string
  createdAt: string
  type: "AUDIT" | "FIELD_ACTIVITY"
}

interface MyActivityClientProps {
  initialLogs: ActivityEvent[]
  initialStats: any
  currentUser: any
}

function getActionMeta(action: string, type: string) {
  if (type === "FIELD_ACTIVITY") {
    switch (action) {
      case "VISIT":
        return { label: "زيارة منزلية", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30", icon: ClipboardList }
      case "CALL":
        return { label: "اتصال ومتابعة", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30", icon: Activity }
      default:
        return { label: "نشاط ميداني", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30", icon: Activity }
    }
  }

  switch (action) {
    case "CREATE":
      return { label: "إضافة جديدة", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30", icon: Plus }
    case "UPDATE":
      return { label: "تعديل بيانات", color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30", icon: Edit3 }
    case "DELETE":
      return { label: "حذف سجل", color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30", icon: Trash2 }
    case "RESTORE":
      return { label: "استعادة", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30", icon: RotateCcw }
    default:
      return { label: action, color: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30", icon: Eye }
  }
}

function getEntityArabic(entityType: string) {
  const map: Record<string, string> = {
    FAMILY: "أسرة",
    BENEFICIARY: "يتيم / مستفيد",
    ORPHAN: "يتيم",
    SPONSOR: "كفيل",
    SPONSORSHIP: "كفالة",
    PROJECT: "مشروع إغاثي",
    DISTRIBUTION: "توزيع ومساعدات",
    SETTING: "الإعدادات",
    USER: "مستخدم",
  }
  return map[entityType] || entityType
}

export function MyActivityClient({
  initialLogs,
  initialStats,
  currentUser,
}: MyActivityClientProps) {
  const [mounted, setMounted] = useState(false)
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState("ALL")
  const [entityFilter, setEntityFilter] = useState("ALL")
  const [dateFilter, setDateFilter] = useState("ALL")
  const [selectedEvent, setSelectedEvent] = useState<ActivityEvent | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Filtering
  const filteredEvents = useMemo(() => {
    const q = search.toLowerCase().trim()
    const now = new Date()

    return initialLogs.filter((ev) => {
      // Search
      const matchesSearch =
        !q ||
        ev.entityName.toLowerCase().includes(q) ||
        (ev.entityCode && ev.entityCode.toLowerCase().includes(q)) ||
        ev.entityId.toLowerCase().includes(q) ||
        (ev.title && ev.title.toLowerCase().includes(q)) ||
        (ev.description && ev.description.toLowerCase().includes(q))

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

  // Group by date
  const groupedEvents = useMemo(() => {
    const groups: Record<string, ActivityEvent[]> = {}
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    filteredEvents.forEach((ev) => {
      const date = new Date(ev.createdAt)
      const dateStr = date.toLocaleDateString("en-CA")
      const todayStr = today.toLocaleDateString("en-CA")
      const yesterdayStr = yesterday.toLocaleDateString("en-CA")

      let label: string
      if (dateStr === todayStr) label = "اليوم"
      else if (dateStr === yesterdayStr) label = "أمس"
      else {
        label = date.toLocaleDateString("ar-SA", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      }

      if (!groups[label]) groups[label] = []
      groups[label].push(ev)
    })

    return groups
  }, [filteredEvents])

  if (!mounted) return null

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* ── HEADER BANNER ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-purple-700 via-indigo-600 to-violet-600 p-6 text-white shadow-xl">
        <div className="absolute -left-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-xl" />
        <div className="absolute -bottom-8 left-20 h-32 w-32 rounded-full bg-white/10 blur-xl" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold md:text-2xl flex items-center gap-2">
              <Activity className="h-6 w-6" />
              سجل نشاطي الشخصي والرقابة الذاتية
            </h2>
            <p className="mt-1 text-xs md:text-sm text-purple-100 font-medium">
              تتبع جميع العمليات التي قمت بتنفيذها في النظام (إضافة، تعديل، حذف، وزيارات ميدانية).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="bg-white/15 hover:bg-white/25 border-white/20 text-white text-xs font-bold gap-1.5 h-9"
            >
              <Printer className="h-3.5 w-3.5" />
              طباعة السجل
            </Button>
            <div className="rounded-xl bg-white/20 px-4 py-2 text-center backdrop-blur-md border border-white/20">
              <p className="text-xl font-extrabold">{initialStats?.total || initialLogs.length}</p>
              <p className="text-[10px] text-purple-100 font-semibold">إجمالي العمليات</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── USER INFO CARD ── */}
      {currentUser && (
        <Card className="bg-white dark:bg-slate-900/40 border border-purple-500/20 rounded-2xl shadow-xs">
          <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-700 flex items-center justify-center text-white text-xl font-extrabold shadow-md">
                {(currentUser.name || "م").charAt(0)}
              </div>
              <div>
                <div className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  {currentUser.name || "المستخدم"}
                  <Badge className="bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200 text-[10px] font-bold">
                    <Shield className="h-3 w-3 ml-1" />
                    {currentUser.role}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400 font-mono mt-0.5">{currentUser.email}</p>
              </div>
            </div>

            {/* Quick counters */}
            <div className="flex items-center gap-3 text-center w-full sm:w-auto justify-around sm:justify-end">
              <div className="px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800">
                <span className="text-xs font-extrabold text-purple-600 block">{initialStats?.today || 0}</span>
                <span className="text-[9px] text-gray-400 font-semibold">اليوم</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800">
                <span className="text-xs font-extrabold text-indigo-600 block">{initialStats?.updates || 0}</span>
                <span className="text-[9px] text-gray-400 font-semibold">تعديلات</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800">
                <span className="text-xs font-extrabold text-emerald-600 block">{initialStats?.creates || 0}</span>
                <span className="text-[9px] text-gray-400 font-semibold">إضافات</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800">
                <span className="text-xs font-extrabold text-blue-600 block">{initialStats?.fieldVisits || 0}</span>
                <span className="text-[9px] text-gray-400 font-semibold">أنشطة ميدانية</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── SEARCH & FILTER CONTROLS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 bg-white dark:bg-slate-900/40 p-3 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs">
        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <Input
            placeholder="بحث بالاسم أو الكود..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8.5 pr-8.5 pl-3 text-xs rounded-xl"
          />
        </div>

        {/* Action filter */}
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="h-8.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 px-3 text-xs font-semibold text-gray-800 dark:text-slate-200"
        >
          <option value="ALL">جميع العمليات</option>
          <option value="UPDATE">تعديل بيانات فقط</option>
          <option value="CREATE">إضافة جديدة فقط</option>
          <option value="DELETE">حذف سجلات فقط</option>
          <option value="FIELD">أنشطة وزيارات ميدانية</option>
        </select>

        {/* Entity filter */}
        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="h-8.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 px-3 text-xs font-semibold text-gray-800 dark:text-slate-200"
        >
          <option value="ALL">جميع الأقسام</option>
          <option value="BENEFICIARY">أيتام ومستفيدون</option>
          <option value="FAMILY">أسر مستفيدة</option>
          <option value="SPONSOR">كفلاء وكفالات</option>
          <option value="PROJECT">مشاريع إغاثية</option>
          <option value="USER">مستخدمون</option>
        </select>

        {/* Date filter */}
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="h-8.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 px-3 text-xs font-semibold text-gray-800 dark:text-slate-200"
        >
          <option value="ALL">كافة الفترات</option>
          <option value="TODAY">اليوم فقط</option>
          <option value="7DAYS">آخر 7 أيام</option>
          <option value="30DAYS">آخر 30 يوماً</option>
        </select>
      </div>

      {/* ── TIMELINE EVENTS ── */}
      {filteredEvents.length === 0 ? (
        <Card className="bg-white dark:bg-slate-900/40 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <CardContent className="py-16 text-center">
            <Activity className="h-12 w-12 text-gray-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-xs text-gray-400 font-semibold">لا توجد عمليات مطابقة للبحث أو التصفية الحالية.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedEvents).map(([dateLabel, dayEvents]) => (
            <div key={dateLabel} className="space-y-2.5">
              <div className="flex items-center gap-2 px-1">
                <Calendar className="h-4 w-4 text-purple-500" />
                <h3 className="text-xs font-extrabold text-purple-600 dark:text-purple-400">{dateLabel}</h3>
                <span className="text-[10px] text-gray-400 font-semibold">({dayEvents.length} عملية)</span>
              </div>

              <Card className="bg-white dark:bg-slate-900/40 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
                <CardContent className="p-0 divide-y divide-gray-100 dark:divide-slate-800/60">
                  {dayEvents.map((ev) => {
                    const meta = getActionMeta(ev.action, ev.type)
                    const Icon = meta.icon
                    const time = new Date(ev.createdAt).toLocaleTimeString("ar-SA", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })
                    const hasDiffs = ev.diffs && ev.diffs.length > 0

                    return (
                      <div
                        key={ev.id}
                        onClick={() => setSelectedEvent(ev)}
                        className="flex items-center justify-between p-3.5 hover:bg-gray-50/80 dark:hover:bg-slate-850/60 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Action Icon */}
                          <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border ${meta.color}`}>
                            <Icon className="h-4 w-4" />
                          </div>

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`inline-flex items-center text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${meta.color}`}>
                                {meta.label}
                              </span>
                              <Badge className="bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700 text-[9px] font-bold">
                                {getEntityArabic(ev.entityType)}
                              </Badge>
                              {hasDiffs && (
                                <span className="text-[10px] text-gray-400 font-medium">
                                  ({ev.diffs!.length} تغيير)
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                {ev.entityName}
                              </p>
                              {ev.entityCode && (
                                <Badge className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 text-[9px] font-mono">
                                  {ev.entityCode}
                                </Badge>
                              )}
                            </div>

                            {ev.title && (
                              <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5 truncate">
                                {ev.title}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Time & Arrow */}
                        <div className="flex items-center gap-2 flex-shrink-0 mr-3">
                          <span className="text-[11px] text-gray-400 font-mono tabular-nums">{time}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedEvent(ev)
                            }}
                            className="p-1 text-gray-300 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            title="تفاصيل العملية"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* ── DETAIL MODAL ── */}
      {selectedEvent && (
        <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
          <DialogContent className="max-w-lg text-right" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-sm font-extrabold flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-500" />
                تفاصيل العملية: {selectedEvent.entityName}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              {/* Summary card */}
              <div className="bg-gray-50 dark:bg-slate-900 p-3 rounded-xl border border-gray-100 dark:border-slate-800 space-y-2 text-xs">
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
                  <span className="text-gray-500 font-semibold">التاريخ والوقت:</span>
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

              {/* Description if field activity */}
              {selectedEvent.description && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-slate-300">ملاحظات وتقرير النشاط:</label>
                  <p className="bg-gray-50 dark:bg-slate-900 p-2.5 rounded-xl border border-gray-100 dark:border-slate-800 text-xs text-gray-800 dark:text-slate-200 whitespace-pre-wrap">
                    {selectedEvent.description}
                  </p>
                </div>
              )}

              {/* Diffs comparison table */}
              {selectedEvent.diffs && selectedEvent.diffs.length > 0 ? (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 dark:text-slate-300">
                    الحقول المعدلة ({selectedEvent.diffs.length}):
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
                <p className="text-xs text-gray-400 italic text-center py-2">لا توجد تفاصيل مقارنة إضافية لهذا السجل.</p>
              )}

              {/* Dossier link if available */}
              {selectedEvent.entityLink && (
                <div className="pt-1">
                  <Link
                    href={selectedEvent.entityLink}
                    className="flex items-center justify-center gap-1.5 w-full py-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 rounded-xl text-xs font-bold border border-indigo-200 transition-colors"
                  >
                    الانتقال إلى ملف {getEntityArabic(selectedEvent.entityType)}
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

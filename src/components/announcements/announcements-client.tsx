"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Megaphone,
  Plus,
  Bell,
  Calendar,
  User,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreateAnnouncementDialog } from "@/components/announcements/create-announcement-dialog"
import { toggleAnnouncementAction, deleteAnnouncementAction } from "@/app/actions/announcement-actions"

interface AnnouncementItem {
  id: string
  title: string
  content: string
  type: string
  isActive: boolean
  expiresAt?: string | null
  createdAt: string
  createdBy?: { id: string; name: string } | null
}

interface AnnouncementsClientProps {
  announcements: AnnouncementItem[]
  totalAnnouncements: number
  activeAnnouncements: number
}

const typeMap: Record<string, { label: string; badge: string }> = {
  URGENT: { label: "عاجل وهام جداً", badge: "bg-rose-500/10 text-rose-500 border-rose-500/20" },
  POLICY: { label: "لائحة وسياسة", badge: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  GENERAL: { label: "تعميم عام", badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
}

export function AnnouncementsClient({
  announcements,
  totalAnnouncements,
  activeAnnouncements,
}: AnnouncementsClientProps) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <div className="space-y-6 pb-12 text-right" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <Megaphone className="h-7 w-7 text-emerald-500" />
            نشر وإدارة التعميمات الإدارية
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            بث القرارات الإدارية والتوجيهات المؤسسية وتوثيق اطلاع الكادر عليها لحظياً.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => setDialogOpen(true)}
            className="bg-[#00B2A9] hover:bg-[#00968F] text-white gap-2 shadow-lg shadow-teal-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            نشر تعميم إداري جديد
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              إجمالي التعميمات الصادرة
            </CardTitle>
            <Megaphone className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground">{totalAnnouncements}</div>
            <p className="text-[11px] text-muted-foreground mt-1">قرارات وتعاميم إدارية موثقة</p>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              التعميمات الفعالة حالياً
            </CardTitle>
            <Bell className="h-4 w-4 text-teal-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-500">{activeAnnouncements}</div>
            <p className="text-[11px] text-muted-foreground mt-1">تظهر في الشريط العلوي لكافة الموظفين</p>
          </CardContent>
        </Card>
      </div>

      {/* Announcements List */}
      <Card className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/40 pb-4">
          <CardTitle className="text-base font-bold text-foreground">سجل التعميمات والقرارات</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            استعراض التعميمات الصادرة وحالة النشر والتحكم في تفعيلها
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {announcements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-3 text-emerald-500 ring-4 ring-emerald-500/5">
                <Megaphone className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold text-foreground">لا توجد تعميمات منشورة حتى الآن</p>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                يمكن للمدير العام والإدارة نشر تعميمات فورية وتوجيهات لفرق العمل تظهر في أعلى لوحة التحكم.
              </p>
              <Button
                onClick={() => setDialogOpen(true)}
                variant="outline"
                size="sm"
                className="mt-4 gap-1.5 text-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
              >
                <Plus className="h-3.5 w-3.5" />
                نشر أول تعميم الآن
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/20">
              {announcements.map((ann) => {
                const typeInfo = typeMap[ann.type] || { label: ann.type, badge: "bg-slate-500/10 text-slate-500 border-slate-500/20" }
                const isExpired = ann.expiresAt && new Date(ann.expiresAt) < new Date()
                return (
                  <div key={ann.id} className={`p-4 hover:bg-muted/30 transition-colors ${isExpired ? "opacity-60" : ""}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${typeInfo.badge}`}>
                            {typeInfo.label}
                          </span>
                          {isExpired && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-slate-500/10 text-slate-500 border-slate-500/20">
                              منتهي الصلاحية
                            </span>
                          )}
                          <h3 className="text-sm font-bold text-foreground">{ann.title}</h3>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {ann.content}
                        </p>
                        <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-2">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            الناشر: <strong className="text-foreground">{ann.createdBy?.name || "الإدارة العامة"}</strong>
                          </span>
                          <span className="flex items-center gap-1 font-mono">
                            <Calendar className="h-3 w-3" />
                            {new Date(ann.createdAt).toLocaleDateString("ar-SA")}
                          </span>
                          {ann.expiresAt && (
                            <span className={`text-[10px] font-mono ${isExpired ? "text-rose-400" : "text-amber-500"}`}>
                              {isExpired ? "انتهى في: " : "ينتهي: "}
                              {new Date(ann.expiresAt).toLocaleDateString("ar-SA")}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            await toggleAnnouncementAction(ann.id, !ann.isActive)
                            router.refresh()
                          }}
                          className={`h-7 px-2.5 text-[10px] font-bold gap-1 transition-all ${
                            ann.isActive
                              ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                              : "border-slate-500/30 text-slate-500 hover:bg-slate-500/10"
                          }`}
                        >
                          {ann.isActive ? (
                            <>
                              <Eye className="h-3 w-3" />
                              نشط
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3" />
                              معطل
                            </>
                          )}
                        </Button>

                        <button
                          onClick={async () => {
                            if (confirm(`هل تريد حذف التعميم: "${ann.title}"؟`)) {
                              await deleteAnnouncementAction(ann.id)
                              router.refresh()
                            }
                          }}
                          title="حذف التعميم"
                          className="p-1 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Dialog */}
      <CreateAnnouncementDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}

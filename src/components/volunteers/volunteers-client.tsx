"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  HandHeart,
  Plus,
  Star,
  Hourglass,
  Users,
  Award,
  Phone,
  Filter,
  Trash2,
  Clock,
  Sparkles,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreateVolunteerDialog } from "@/components/volunteers/create-volunteer-dialog"
import { AddHoursDialog } from "@/components/volunteers/add-hours-dialog"
import { updateVolunteerStatusAction, deleteVolunteerAction } from "@/app/actions/volunteer-actions"
import { VolunteerStatus } from "@prisma/client"

interface VolunteerItem {
  id: string
  fullName: string
  nationalId?: string | null
  phone: string
  email?: string | null
  skills: string[]
  rating: number
  totalHours: number
  status: VolunteerStatus
  notes?: string | null
  createdAt: string
}

interface VolunteersClientProps {
  volunteers: VolunteerItem[]
  totalVolunteers: number
  activeVolunteers: number
  totalHours: number
}

function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5 justify-end">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i <= n ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"
          }`}
        />
      ))}
    </div>
  )
}

export function VolunteersClient({
  volunteers,
  totalVolunteers,
  activeVolunteers,
  totalHours,
}: VolunteersClientProps) {
  const router = useRouter()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [hoursDialogState, setHoursDialogState] = useState<{
    open: boolean
    volunteer: { id: string; fullName: string; totalHours: number } | null
  }>({
    open: false,
    volunteer: null,
  })
  const [statusFilter, setStatusFilter] = useState<string>("ALL")

  const filteredVolunteers = statusFilter === "ALL"
    ? volunteers
    : volunteers.filter((v) => v.status === statusFilter)

  return (
    <div className="space-y-6 pb-12 text-right" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <HandHeart className="h-7 w-7 text-rose-500" />
            إدارة المتطوعين وبنك الساعات
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            قاعدة بيانات فرق المتطوعين الميدانيين وتوثيق بنك الساعات التطوعية وتقييم الكفاءة.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="bg-[#00B2A9] hover:bg-[#00968F] text-white gap-2 shadow-lg shadow-teal-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            تسجيل متطوع جديد
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              إجمالي المتطوعين
            </CardTitle>
            <Users className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground">{totalVolunteers}</div>
            <p className="text-[11px] text-muted-foreground mt-1">متطوع مقيد في قاعدة بيانات المؤسسة</p>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              المتطوعون النشطون
            </CardTitle>
            <Award className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-500">{activeVolunteers}</div>
            <p className="text-[11px] text-muted-foreground mt-1">جاهزون للمشاركة في حملات الإغاثة والتوزيع</p>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              رصيد بنك الساعات
            </CardTitle>
            <Hourglass className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-amber-500">
              {totalHours.toLocaleString("ar-SA")}{" "}
              <span className="text-sm font-normal text-muted-foreground">ساعة</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">ساعة تطوعية معتمدة تم توفيرها للمؤسسة</p>
          </CardContent>
        </Card>
      </div>

      {/* Volunteers Table */}
      <Card className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-foreground">قائمة المتطوعين وفرق الإسناد الميداني</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                استعراض مهارات المتطوعين ورصيد ساعاتهم والتقييم المؤسسي
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="ALL">جميع الحالات ({volunteers.length})</option>
                <option value="ACTIVE">نشط ومتاح</option>
                <option value="INACTIVE">غير نشط / معلق</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredVolunteers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-12 w-12 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-3 text-rose-500 ring-4 ring-rose-500/5">
                <HandHeart className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold text-foreground">لا يوجد متطوعون مسجلون حتى الآن</p>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                يمكن للمؤسسة فتح باب التطوع وحصر ساعات الخدمة المجتمعية وتوثيقها رسمياً.
              </p>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                variant="outline"
                size="sm"
                className="mt-4 gap-1.5 text-xs border-rose-500/30 text-rose-500 hover:bg-rose-500/10"
              >
                <Plus className="h-3.5 w-3.5" />
                تسجيل أول متطوع الآن
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-muted/40 text-muted-foreground border-b border-border/30">
                  <tr>
                    <th className="py-3 px-4 font-bold">الاسم الكامل</th>
                    <th className="py-3 px-4 font-bold">رقم الجوال</th>
                    <th className="py-3 px-4 font-bold">المهارات والتخصص</th>
                    <th className="py-3 px-4 font-bold">رصيد الساعات</th>
                    <th className="py-3 px-4 font-bold">التقييم</th>
                    <th className="py-3 px-4 font-bold">الحالة</th>
                    <th className="py-3 px-4 font-bold text-center">إيداع ساعات</th>
                    <th className="py-3 px-4 font-bold text-center">حذف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {filteredVolunteers.map((vol) => (
                    <tr key={vol.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-foreground">{vol.fullName}</div>
                        {vol.nationalId && (
                          <span className="font-mono text-[10px] text-muted-foreground">هوية: {vol.nationalId}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-muted-foreground">{vol.phone}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {vol.skills.length > 0 ? (
                            vol.skills.map((skill, idx) => (
                              <span key={idx} className="bg-muted px-1.5 py-0.5 rounded text-[10px] text-foreground">
                                {skill}
                              </span>
                            ))
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-amber-500 font-mono">
                        {vol.totalHours} ساعة
                      </td>
                      <td className="py-3 px-4">
                        <Stars n={vol.rating} />
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={vol.status}
                          onChange={async (e) => {
                            await updateVolunteerStatusAction(vol.id, e.target.value as VolunteerStatus)
                            router.refresh()
                          }}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border cursor-pointer bg-background focus:outline-none focus:ring-1 focus:ring-primary ${
                            vol.status === "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              : "bg-slate-500/10 text-slate-500 border-slate-500/20"
                          }`}
                        >
                          <option value="ACTIVE">نشط ومتاح</option>
                          <option value="INACTIVE">غير نشط</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setHoursDialogState({ open: true, volunteer: vol })}
                          className="h-7 text-[11px] gap-1 text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 font-bold"
                          title="إضافة ساعات تطوعية جديدة"
                        >
                          <Hourglass className="h-3 w-3" />
                          + ساعات
                        </Button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={async () => {
                            if (confirm(`هل أنت متأكد من رغبتك بحذف المتطوع (${vol.fullName})؟`)) {
                              await deleteVolunteerAction(vol.id)
                              router.refresh()
                            }
                          }}
                          title="حذف المتطوع"
                          className="p-1 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateVolunteerDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <AddHoursDialog
        open={hoursDialogState.open}
        onOpenChange={(open) => setHoursDialogState((prev) => ({ ...prev, open }))}
        volunteer={hoursDialogState.volunteer}
      />
    </div>
  )
}

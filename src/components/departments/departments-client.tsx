"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Building2,
  Plus,
  Users,
  CheckSquare,
  Clock,
  Trash2,
  ArrowUpRight,
  UserCheck,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreateDepartmentDialog } from "@/components/departments/create-department-dialog"
import { deleteDepartmentAction } from "@/app/actions/department-actions"

interface DepartmentItem {
  id: string
  name: string
  description?: string | null
  createdAt: string
  users: { id: string; name: string; role: string }[]
  tasks: { id: string; status: string }[]
  requests: { id: string }[]
}

interface DepartmentsClientProps {
  departments: DepartmentItem[]
}

export function DepartmentsClient({ departments }: DepartmentsClientProps) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <div className="space-y-6 pb-12 text-right" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <Building2 className="h-7 w-7 text-cyan-500" />
            الهيكل الإداري والأقسام المؤسسية
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            تنظيم وهيكلة إدارات وأقسام المؤسسة وربط الكادر والمهام والطلبات بكل قسم.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => setDialogOpen(true)}
            className="bg-[#00B2A9] hover:bg-[#00968F] text-white gap-2 shadow-lg shadow-teal-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            إضافة قسم جديد
          </Button>
        </div>
      </div>

      {/* Departments Grid */}
      {departments.length === 0 ? (
        <Card className="border border-border/50 bg-card/60 backdrop-blur-sm p-12 text-center">
          <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center mx-auto mb-3 text-cyan-500 ring-4 ring-cyan-500/5">
            <Building2 className="h-6 w-6" />
          </div>
          <p className="text-sm font-bold text-foreground">لا توجد أقسام مسجلة حتى الآن</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
            يمكن للمدير العام إضافة الأقسام المؤسسية الرسمية (الرعاية الاجتماعية، الموارد البشرية، الميدان، المالية...).
          </p>
          <Button
            onClick={() => setDialogOpen(true)}
            variant="outline"
            size="sm"
            className="mt-4 gap-1.5 text-xs border-cyan-500/30 text-cyan-500 hover:bg-cyan-500/10"
          >
            <Plus className="h-3.5 w-3.5" />
            إضافة أول قسم الآن
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept) => {
            const completedTasks = dept.tasks.filter((t) => t.status === "COMPLETED" || t.status === "APPROVED").length
            const inProgressTasks = dept.tasks.filter((t) => t.status === "IN_PROGRESS").length

            return (
              <Card
                key={dept.id}
                className="border border-border/50 bg-card/60 backdrop-blur-sm shadow-sm hover:border-cyan-500/30 transition-all flex flex-col justify-between"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-cyan-500 shrink-0" />
                        <span className="truncate">{dept.name}</span>
                      </CardTitle>
                      {dept.description && (
                        <CardDescription className="text-xs line-clamp-2 mt-1 leading-relaxed text-muted-foreground">
                          {dept.description}
                        </CardDescription>
                      )}
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 shrink-0">
                      {dept.users.length} موظف
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/30 text-center text-xs">
                    <div className="bg-muted/40 p-2 rounded-lg">
                      <p className="text-muted-foreground text-[10px]">المهام</p>
                      <p className="font-bold text-foreground font-mono mt-0.5">{dept.tasks.length}</p>
                    </div>
                    <div className="bg-amber-500/5 p-2 rounded-lg border border-amber-500/10">
                      <p className="text-amber-500 text-[10px]">قيد العمل</p>
                      <p className="font-bold text-amber-500 font-mono mt-0.5">{inProgressTasks}</p>
                    </div>
                    <div className="bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10">
                      <p className="text-emerald-500 text-[10px]">منجزة</p>
                      <p className="font-bold text-emerald-500 font-mono mt-0.5">{completedTasks}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/20 text-[11px]">
                    <span className="text-muted-foreground font-mono text-[10px]">
                      {dept.requests?.length || 0} طلب وارد
                    </span>

                    <button
                      onClick={async () => {
                        if (confirm(`هل أنت متأكد من رغبتك بحذف قسم: "${dept.name}"؟`)) {
                          const res = await deleteDepartmentAction(dept.id)
                          if (res.success) {
                            router.refresh()
                          } else {
                            alert(res.error)
                          }
                        }
                      }}
                      title="حذف القسم"
                      className="p-1 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal Dialog */}
      <CreateDepartmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}

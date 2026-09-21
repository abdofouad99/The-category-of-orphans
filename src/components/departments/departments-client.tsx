"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Building2,
  Plus,
  Users,
  CheckSquare,
  Trash2,
  UserCheck,
  UserX,
  X,
  ChevronDown,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreateDepartmentDialog } from "@/components/departments/create-department-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { deleteDepartmentAction, assignUserToDepartmentAction } from "@/app/actions/department-actions"

interface UserItem {
  id: string
  name: string
  role: string
}

interface DepartmentItem {
  id: string
  name: string
  description?: string | null
  createdAt: string
  users: UserItem[]
  tasks: { id: string; status: string }[]
  requests: { id: string }[]
}

interface DepartmentsClientProps {
  departments: DepartmentItem[]
  allUsers: UserItem[]
}

const roleLabels: Record<string, string> = {
  GENERAL_MANAGER: "المدير العام",
  EXECUTIVE_DIRECTOR: "المدير التنفيذي",
  SUPERVISOR: "مشرف",
  DEPARTMENT_HEAD: "رئيس قسم",
  FIELD_RESEARCHER: "باحث ميداني",
  SOCIAL_WORKER: "أخصائي اجتماعي",
  DATA_ENTRY: "مدخل بيانات",
  ACCOUNTANT: "محاسب",
  ADMIN_STAFF: "موظف إداري",
}

export function DepartmentsClient({ departments, allUsers }: DepartmentsClientProps) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [assignDialogDept, setAssignDialogDept] = useState<DepartmentItem | null>(null)
  const [assigning, setAssigning] = useState(false)

  // For the assign dialog: which users are in this dept and which are unassigned
  const deptUsers = assignDialogDept
    ? allUsers.filter((u) => assignDialogDept.users.some((du) => du.id === u.id))
    : []
  const unassignedUsers = allUsers.filter((u) => {
    const inAnyDept = departments.some((d) => d.users.some((du) => du.id === u.id))
    return !inAnyDept
  })

  const handleAssign = async (userId: string, departmentId: string) => {
    setAssigning(true)
    const res = await assignUserToDepartmentAction(userId, departmentId)
    setAssigning(false)
    if (res.success) {
      router.refresh()
      // Close and reopen to get fresh data — we just close
      setAssignDialogDept(null)
    } else {
      alert(res.error)
    }
  }

  const handleRemoveFromDept = async (userId: string) => {
    setAssigning(true)
    const res = await assignUserToDepartmentAction(userId, null)
    setAssigning(false)
    if (res.success) {
      router.refresh()
      setAssignDialogDept(null)
    } else {
      alert(res.error)
    }
  }

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

      {/* Summary Stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border/50 bg-card/60 p-4 shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 shrink-0">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">إجمالي الأقسام</p>
            <p className="text-xl font-black text-foreground">{departments.length}</p>
          </div>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/60 p-4 shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">موظفون مكلفون</p>
            <p className="text-xl font-black text-foreground">
              {allUsers.filter((u) => departments.some((d) => d.users.some((du) => du.id === u.id))).length}
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/60 p-4 shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
            <UserX className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">غير مكلفين بقسم</p>
            <p className="text-xl font-black text-foreground">{unassignedUsers.length}</p>
          </div>
        </div>
      </div>

      {/* Unassigned Users Warning */}
      {(() => {
        const unassigned = allUsers.filter(
          (u) => !departments.some((d) => d.users.some((du) => du.id === u.id))
        )
        if (unassigned.length === 0) return null
        return (
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <UserX className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
                {unassigned.length} موظف غير مكلفين بأي قسم
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {unassigned.map((u) => u.name).join("، ")} — يمكنك تكليفهم من زر "إدارة الموظفين" في أي قسم.
              </p>
            </div>
          </div>
        )
      })()}

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
                  {/* Task Stats */}
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

                  {/* Employees in dept */}
                  {dept.users.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/20">
                      <p className="text-[10px] text-muted-foreground mb-1.5 font-bold uppercase tracking-wider">الكادر الوظيفي</p>
                      <div className="flex flex-wrap gap-1">
                        {dept.users.slice(0, 4).map((u) => (
                          <span key={u.id} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-muted/60 text-foreground border border-border/30">
                            {u.name}
                          </span>
                        ))}
                        {dept.users.length > 4 && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-muted/60 text-muted-foreground border border-border/30">
                            +{dept.users.length - 4}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/20">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAssignDialogDept(dept)}
                      className="h-7 text-[11px] gap-1.5 border-cyan-500/30 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10"
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      إدارة الموظفين
                    </Button>

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

      {/* Create Department Dialog */}
      <CreateDepartmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      {/* Assign Users to Department Dialog */}
      <Dialog open={!!assignDialogDept} onOpenChange={(o) => { if (!o) setAssignDialogDept(null) }}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle className="flex items-center gap-2 text-base font-black">
              <UserCheck className="h-5 w-5 text-cyan-500" />
              إدارة موظفي: {assignDialogDept?.name}
            </DialogTitle>
            <DialogDescription className="text-right text-xs">
              قم بتعيين الموظفين لهذا القسم أو إزالتهم منه.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Current employees */}
            {deptUsers.length > 0 && (
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  موظفو هذا القسم ({deptUsers.length})
                </p>
                <div className="space-y-1.5">
                  {deptUsers.map((u) => (
                    <div key={u.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                      <div>
                        <p className="text-xs font-bold text-foreground">{u.name}</p>
                        <p className="text-[10px] text-muted-foreground">{roleLabels[u.role] || u.role}</p>
                      </div>
                      <button
                        disabled={assigning}
                        onClick={() => handleRemoveFromDept(u.id)}
                        className="p-1 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                        title="إزالة من القسم"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Unassigned users */}
            {unassignedUsers.length > 0 && (
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  موظفون غير مكلفين ({unassignedUsers.length})
                </p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {unassignedUsers.map((u) => (
                    <div key={u.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/40 border border-border/30">
                      <div>
                        <p className="text-xs font-bold text-foreground">{u.name}</p>
                        <p className="text-[10px] text-muted-foreground">{roleLabels[u.role] || u.role}</p>
                      </div>
                      <button
                        disabled={assigning || !assignDialogDept}
                        onClick={() => assignDialogDept && handleAssign(u.id, assignDialogDept.id)}
                        className="px-2.5 py-1 rounded-md text-[10px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 transition-colors disabled:opacity-50"
                      >
                        + تعيين
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {deptUsers.length === 0 && unassignedUsers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">جميع الموظفين مكلفون بأقسام أخرى.</p>
              </div>
            )}

            {assigning && (
              <p className="text-xs text-center text-muted-foreground animate-pulse">جارٍ التحديث...</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

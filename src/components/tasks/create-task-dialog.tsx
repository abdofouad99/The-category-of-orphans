"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createTaskAction } from "@/app/actions/task-actions"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { TaskPriority, TaskLevel } from "@prisma/client"
import { Plus, CheckSquare, Loader2 } from "lucide-react"

interface CreateTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  departments: { id: string; name: string }[]
  users: { id: string; name: string; role: string }[]
}

export function CreateTaskDialog({
  open,
  onOpenChange,
  departments,
  users,
}: CreateTaskDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "MEDIUM" as TaskPriority,
    level: "EMPLOYEE" as TaskLevel,
    departmentId: "",
    assigneeId: "",
    dueDate: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      setError("يرجى إدخال عنوان المهمة")
      return
    }

    setLoading(true)
    setError(null)

    const res = await createTaskAction({
      title: formData.title,
      description: formData.description || undefined,
      priority: formData.priority,
      level: formData.level,
      departmentId: formData.departmentId || undefined,
      assigneeId: formData.assigneeId || undefined,
      dueDate: formData.dueDate || undefined,
    })

    setLoading(false)

    if (res.success) {
      onOpenChange(false)
      setFormData({
        title: "",
        description: "",
        priority: "MEDIUM",
        level: "EMPLOYEE",
        departmentId: "",
        assigneeId: "",
        dueDate: "",
      })
      router.refresh()
    } else {
      setError(res.error || "حدث خطأ أثناء حفظ المهمة")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md text-right" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground text-lg">
            <CheckSquare className="h-5 w-5 text-amber-500" />
            إسناد وتكليف مهمة جديدة
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            توجيه التكليفات الميدانية أو الإدارية للكادر والأقسام المعنية
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              عنوان المهمة <span className="text-rose-500">*</span>
            </label>
            <Input
              required
              placeholder="مثال: إجراء المسح الميداني لأسر حي المعلا..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="text-xs text-right"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">تفاصيل وتوجيهات المهمة</label>
            <Textarea
              placeholder="تفاصيل التكليف، المخرجات المطلوبة، الملاحظات الإدارية..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="text-xs text-right resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">القسم المختص</label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">(عام - بدون تحديد قسم)</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">الموظف المكلف</label>
              <select
                value={formData.assigneeId}
                onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">(لم يحدد بعد)</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">درجة الأولوية</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="LOW">منخفضة</option>
                <option value="MEDIUM">متوسطة</option>
                <option value="HIGH">عاجلة / قصوى</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">تاريخ الاستحقاق (الموعد النهائي)</label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="text-xs font-mono"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-xs h-9"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#00B2A9] hover:bg-[#00968F] text-white text-xs h-9 gap-1.5 shadow-md shadow-teal-500/20"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {loading ? "جاري الحفظ..." : "إسناد المهمة الآن"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { logTimeEntryAction } from "@/app/actions/time-tracking-actions"
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
import { Clock, Loader2, Play } from "lucide-react"

interface LogTimeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tasks: { id: string; title: string; taskNumber: number }[]
  users: { id: string; name: string; role: string }[]
}

export function LogTimeDialog({
  open,
  onOpenChange,
  tasks,
  users,
}: LogTimeDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    taskId: tasks[0]?.id || "",
    userId: users[0]?.id || "",
    durationMinutes: "60",
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.taskId) {
      setError("يرجى اختيار المهمة المرتبطة")
      return
    }

    setLoading(true)
    setError(null)

    const res = await logTimeEntryAction({
      taskId: formData.taskId,
      userId: formData.userId || undefined,
      durationMinutes: Number(formData.durationMinutes),
      notes: formData.notes,
    })

    setLoading(false)

    if (res.success) {
      onOpenChange(false)
      setFormData({
        taskId: tasks[0]?.id || "",
        userId: users[0]?.id || "",
        durationMinutes: "60",
        notes: "",
      })
      router.refresh()
    } else {
      setError(res.error || "حدث خطأ أثناء حفظ جلسة العمل")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md text-right" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground text-lg">
            <Clock className="h-5 w-5 text-teal-500" />
            بدء وتوثيق جلسة عمل جديدة
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            تسجيل ساعات العمل الميداني أو المكتبي المخصصة لمهمة معينة
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
              المهمة المرتبطة <span className="text-rose-500">*</span>
            </label>
            {tasks.length === 0 ? (
              <p className="text-xs text-amber-500 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                ⚠️ لا توجد مهام مسجلة حالياً في النظام. يرجى إسناد مهمة أولاً من صفحة المهام.
              </p>
            ) : (
              <select
                required
                value={formData.taskId}
                onChange={(e) => setFormData({ ...formData, taskId: e.target.value })}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    #{t.taskNumber} - {t.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">الموظف / الباحث</label>
              <select
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                المدة المنجزة (بالدقائق) <span className="text-rose-500">*</span>
              </label>
              <Input
                type="number"
                min="5"
                step="5"
                required
                value={formData.durationMinutes}
                onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                className="text-xs font-mono"
                placeholder="60"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">ملاحظات وإنجازات الجلسة</label>
            <Textarea
              placeholder="وصف مختصر لما تم إنجازه خلال فترة العمل..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="text-xs text-right resize-none"
            />
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
              disabled={loading || tasks.length === 0}
              className="bg-[#00B2A9] hover:bg-[#00968F] text-white text-xs h-9 gap-1.5 shadow-md shadow-teal-500/20"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {loading ? "جاري الحفظ..." : "توثيق وحفظ الجلسة"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

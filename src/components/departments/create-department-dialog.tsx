"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createDepartmentAction } from "@/app/actions/department-actions"
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
import { Building2, Plus, Loader2 } from "lucide-react"

interface CreateDepartmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateDepartmentDialog({
  open,
  onOpenChange,
}: CreateDepartmentDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setError("يرجى إدخال اسم القسم أو الإدارة")
      return
    }

    setLoading(true)
    setError(null)

    const res = await createDepartmentAction({
      name: formData.name,
      description: formData.description || undefined,
    })

    setLoading(false)

    if (res.success) {
      onOpenChange(false)
      setFormData({ name: "", description: "" })
      router.refresh()
    } else {
      setError(res.error || "حدث خطأ أثناء إضافة القسم")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md text-right" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground text-lg">
            <Building2 className="h-5 w-5 text-cyan-500" />
            إضافة قسم أو إدارة جديدة في الهيكل المؤسسي
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            توسيع الهيكل التنظيمي للمؤسسة لربط الموظفين والمهام بالقسم الجديد
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
              اسم القسم / الإدارة <span className="text-rose-500">*</span>
            </label>
            <Input
              required
              placeholder="مثال: إدارة الرقابة والتفتيش، قسم الإعلام والتسويق..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="text-xs text-right"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">المهام والاختصاصات الأساسية للقسم</label>
            <Textarea
              placeholder="وصف مختصر للأدوار والمسؤوليات التابعة لهذا القسم..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
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
              disabled={loading}
              className="bg-[#00B2A9] hover:bg-[#00968F] text-white text-xs h-9 gap-1.5 shadow-md shadow-teal-500/20"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {loading ? "جاري الإضافة..." : "اعتماد القسم الآن"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

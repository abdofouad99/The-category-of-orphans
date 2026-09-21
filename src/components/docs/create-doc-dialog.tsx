"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createDocumentPolicyAction } from "@/app/actions/doc-actions"
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
import { BookOpen, Plus, Loader2, Link2, FileUp } from "lucide-react"

interface CreateDocDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  departments: { id: string; name: string }[]
}

export function CreateDocDialog({
  open,
  onOpenChange,
  departments,
}: CreateDocDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    fileUrl: "",
    departmentId: "",
    isPublic: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      setError("يرجى إدخال عنوان المستند أو اللائحة")
      return
    }

    setLoading(true)
    setError(null)

    const res = await createDocumentPolicyAction({
      title: formData.title,
      content: formData.content || undefined,
      fileUrl: formData.fileUrl || undefined,
      departmentId: formData.departmentId || undefined,
      isPublic: formData.isPublic,
    })

    setLoading(false)

    if (res.success) {
      onOpenChange(false)
      setFormData({
        title: "",
        content: "",
        fileUrl: "",
        departmentId: "",
        isPublic: true,
      })
      router.refresh()
    } else {
      setError(res.error || "حدث خطأ أثناء حفظ المستند")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md text-right" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground text-lg">
            <BookOpen className="h-5 w-5 text-purple-500" />
            رفع مستند أو لائحة تنظيمية جديدة
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            أرشفة السياسات المؤسسية، نماذج الصرف المعتمدة، واللوائح الميدانية
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
              عنوان المستند أو اللائحة <span className="text-rose-500">*</span>
            </label>
            <Input
              required
              placeholder="مثال: لائحة معايير استحقاق كفالة الأيتام 2026..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="text-xs text-right"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">القسم المعني</label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">(عام لكافة أقسام المؤسسة)</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">نطاق الوصول</label>
              <select
                value={formData.isPublic ? "true" : "false"}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.value === "true" })}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="true">🌐 متاح لجميع الموظفين (عام)</option>
                <option value="false">🔒 خاص بالإدارة فقط</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              رابط الملف / المستند السحابي <span className="text-muted-foreground font-normal">(URL أو مسار التخزين)</span>
            </label>
            <div className="relative">
              <Input
                placeholder="https://... أو /uploads/policies/doc.pdf"
                value={formData.fileUrl}
                onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                className="text-xs font-mono pr-8"
              />
              <Link2 className="h-4 w-4 text-muted-foreground absolute right-2.5 top-2.5" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">نبذة توضيحية أو ملخص المحتوى</label>
            <Textarea
              placeholder="وصف مختصر للائحة، البنود الرئيسية، الغرض من الاستمارة..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
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
              {loading ? "جاري الحفظ..." : "أرشفة المستند الآن"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createAnnouncementAction } from "@/app/actions/announcement-actions"
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
import { Megaphone, Plus, Loader2 } from "lucide-react"

interface CreateAnnouncementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateAnnouncementDialog({
  open,
  onOpenChange,
}: CreateAnnouncementDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "GENERAL",
    expiresAt: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.content.trim()) {
      setError("يرجى إدخال عنوان ونص التعميم")
      return
    }

    setLoading(true)
    setError(null)

    const res = await createAnnouncementAction({
      title: formData.title,
      content: formData.content,
      type: formData.type,
      expiresAt: formData.expiresAt || undefined,
    })

    setLoading(false)

    if (res.success) {
      onOpenChange(false)
      setFormData({
        title: "",
        content: "",
        type: "GENERAL",
        expiresAt: "",
      })
      router.refresh()
    } else {
      setError(res.error || "حدث خطأ أثناء نشر التعميم")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md text-right" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground text-lg">
            <Megaphone className="h-5 w-5 text-emerald-500" />
            نشر تعميم أو توجيه إداري جديد
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            بث القرارات المؤسسية الرسمية لكافة مستخدمي المنظومة وفرق الميدان
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
              عنوان التعميم <span className="text-rose-500">*</span>
            </label>
            <Input
              required
              placeholder="مثال: بدء الدوام الشتوي وإجراءات توزيع المساعدات..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="text-xs text-right"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">نوع وتصنيف التعميم</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="GENERAL">📢 تعميم عام لكافة الكادر</option>
                <option value="URGENT">🚨 عاجل وهام جداً</option>
                <option value="POLICY">📋 لائحة تنظيمية وسياسة عمل</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">تاريخ انتهاء السريان</label>
              <Input
                type="date"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                className="text-xs font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              نص القرار أو التوجيه <span className="text-rose-500">*</span>
            </label>
            <Textarea
              required
              placeholder="اكتب التوجيه والتعليمات الإدارية والمطلوب من الموظفين هنا..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={4}
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
              {loading ? "جاري النشر..." : "نشر التعميم الآن"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

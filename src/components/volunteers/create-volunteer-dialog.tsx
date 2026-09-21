"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createVolunteerAction } from "@/app/actions/volunteer-actions"
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
import { HandHeart, Plus, Loader2, Star } from "lucide-react"

interface CreateVolunteerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateVolunteerDialog({
  open,
  onOpenChange,
}: CreateVolunteerDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    nationalId: "",
    email: "",
    skillsStr: "",
    rating: "5",
    totalHours: "0",
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.fullName.trim() || !formData.phone.trim()) {
      setError("يرجى إدخال اسم المتطوع ورقم الهاتف")
      return
    }

    setLoading(true)
    setError(null)

    const skills = formData.skillsStr
      ? formData.skillsStr
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : []

    const res = await createVolunteerAction({
      fullName: formData.fullName,
      phone: formData.phone,
      nationalId: formData.nationalId || undefined,
      email: formData.email || undefined,
      skills,
      rating: Number(formData.rating),
      totalHours: Number(formData.totalHours),
      notes: formData.notes,
    })

    setLoading(false)

    if (res.success) {
      onOpenChange(false)
      setFormData({
        fullName: "",
        phone: "",
        nationalId: "",
        email: "",
        skillsStr: "",
        rating: "5",
        totalHours: "0",
        notes: "",
      })
      router.refresh()
    } else {
      setError(res.error || "حدث خطأ أثناء حفظ بيانات المتطوع")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md text-right" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground text-lg">
            <HandHeart className="h-5 w-5 text-rose-500" />
            تسجيل متطوع جديد في بنك الساعات
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            إضافة متطوع جديد لقاعدة بيانات الدعم الميداني وتوثيق مهاراته وساعاته المعتمدة
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                الاسم الكامل <span className="text-rose-500">*</span>
              </label>
              <Input
                required
                placeholder="اسم المتطوع ثلاثي أو رباعي..."
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="text-xs text-right"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                رقم الجوال <span className="text-rose-500">*</span>
              </label>
              <Input
                required
                type="tel"
                placeholder="770000000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="text-xs font-mono text-right"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">الرقم الوطني / الهوية</label>
              <Input
                placeholder="اختياري..."
                value={formData.nationalId}
                onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                className="text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">البريد الإلكتروني</label>
              <Input
                type="email"
                placeholder="اختياري..."
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              المهارات والتخصصات <span className="text-muted-foreground font-normal">(افصل بفواصل)</span>
            </label>
            <Input
              placeholder="مثال: إسعافات أولية, تنظيم حشود, تصوير, سائق..."
              value={formData.skillsStr}
              onChange={(e) => setFormData({ ...formData, skillsStr: e.target.value })}
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">الرصيد الافتتاحي للساعات</label>
              <Input
                type="number"
                min="0"
                step="0.5"
                value={formData.totalHours}
                onChange={(e) => setFormData({ ...formData, totalHours: e.target.value })}
                className="text-xs font-mono"
                placeholder="0"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">التقييم المؤسسي</label>
              <select
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="5">⭐⭐⭐⭐⭐ ممتاز (5)</option>
                <option value="4">⭐⭐⭐⭐ جيد جداً (4)</option>
                <option value="3">⭐⭐⭐ جيد (3)</option>
                <option value="2">⭐⭐ مقبول (2)</option>
                <option value="1">⭐ متدرب (1)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">ملاحظات إدارية</label>
            <Textarea
              placeholder="أوقات توفر المتطوع، مناطق التغطية المفضلة..."
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
              disabled={loading}
              className="bg-[#00B2A9] hover:bg-[#00968F] text-white text-xs h-9 gap-1.5 shadow-md shadow-teal-500/20"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {loading ? "جاري التسجيل..." : "تسجيل المتطوع الآن"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

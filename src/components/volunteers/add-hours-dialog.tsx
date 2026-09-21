"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { addVolunteerHoursAction } from "@/app/actions/volunteer-actions"
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
import { Hourglass, Plus, Loader2 } from "lucide-react"

interface AddHoursDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  volunteer: { id: string; fullName: string; totalHours: number } | null
}

export function AddHoursDialog({
  open,
  onOpenChange,
  volunteer,
}: AddHoursDialogProps) {
  const router = useRouter()
  const [hours, setHours] = useState("2")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!volunteer) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const num = Number(hours)
    if (!num || num <= 0) {
      setError("يرجى إدخال عدد ساعات صحيح أكبر من صفر")
      return
    }

    setLoading(true)
    setError(null)

    const res = await addVolunteerHoursAction(volunteer.id, num)
    setLoading(false)

    if (res.success) {
      onOpenChange(false)
      setHours("2")
      router.refresh()
    } else {
      setError(res.error || "فشل إضافة الساعات")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm text-right" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground text-base">
            <Hourglass className="h-5 w-5 text-amber-500" />
            إيداع ساعات في بنك التطوع
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            إضافة ساعات مشاركة ميدانية للمتطوع: <strong className="text-foreground">{volunteer.fullName}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold">
              {error}
            </div>
          )}

          <div className="p-3 rounded-xl bg-muted/40 border border-border/50 text-xs flex justify-between items-center">
            <span className="text-muted-foreground">الرصيد المعتمد حالياً:</span>
            <span className="font-mono font-bold text-amber-500 text-sm">{volunteer.totalHours} ساعة</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              عدد الساعات الإضافية المنجزة <span className="text-rose-500">*</span>
            </label>
            <Input
              type="number"
              min="0.5"
              step="0.5"
              required
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="text-xs font-mono"
              placeholder="مثال: 4"
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
              {loading ? "جاري الإيداع..." : "إيداع الساعات"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

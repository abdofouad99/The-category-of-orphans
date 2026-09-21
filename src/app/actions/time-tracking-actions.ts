"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/app/actions/auth-actions"

export async function logTimeEntryAction(data: {
  taskId: string
  userId?: string
  durationMinutes: number
  startTime?: string
  notes?: string
}) {
  try {
    const currentUser = await getCurrentUser()
    const adminUser = await prisma.user.findFirst({ where: { role: { in: ["ADMIN", "MANAGER"] } } })
    const targetUserId = data.userId || currentUser?.id || adminUser?.id

    if (!targetUserId) {
      return { success: false, error: "تعذر التعرف على الموظف" }
    }

    if (!data.taskId) {
      return { success: false, error: "يرجى تحديد المهمة المرتبطة بجلسة العمل" }
    }

    if (!data.durationMinutes || data.durationMinutes <= 0) {
      return { success: false, error: "يرجى إدخال مدة زمنية صالحة بالدقائق" }
    }

    const start = data.startTime ? new Date(data.startTime) : new Date()
    const end = new Date(start.getTime() + data.durationMinutes * 60 * 1000)

    const entry = await prisma.timeEntry.create({
      data: {
        taskId: data.taskId,
        userId: targetUserId,
        startTime: start,
        endTime: end,
        durationMinutes: Number(data.durationMinutes),
        notes: data.notes?.trim() || null,
      },
    })

    revalidatePath("/dashboard/time-tracking")
    revalidatePath("/dashboard/tasks")
    revalidatePath("/dashboard")

    return { success: true, entry }
  } catch (err: any) {
    console.error("Log time error:", err)
    return { success: false, error: err.message || "فشل تسجيل جلسة العمل" }
  }
}

export async function deleteTimeEntryAction(id: string) {
  try {
    await prisma.timeEntry.delete({
      where: { id }
    })

    revalidatePath("/dashboard/time-tracking")
    return { success: true }
  } catch (err: any) {
    console.error("Delete time entry error:", err)
    return { success: false, error: err.message || "فشل حذف السجل" }
  }
}

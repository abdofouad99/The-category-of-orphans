"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/app/actions/auth-actions"

export async function createAnnouncementAction(data: {
  title: string
  content: string
  type: string
  expiresAt?: string
}) {
  try {
    const user = await getCurrentUser()
    const adminUser = await prisma.user.findFirst({ where: { role: { in: ["ADMIN", "MANAGER"] } } })
    const creatorId = user?.id || adminUser?.id

    if (!creatorId) {
      return { success: false, error: "تعذر التحقق من هوية الناشر" }
    }

    if (!data.title?.trim()) {
      return { success: false, error: "عنوان التعميم مطلوب" }
    }
    if (!data.content?.trim()) {
      return { success: false, error: "نص التعميم مطلوب" }
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: data.title.trim(),
        content: data.content.trim(),
        type: data.type || "GENERAL",
        isActive: true,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        createdById: creatorId,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    })

    revalidatePath("/dashboard/announcements")
    revalidatePath("/dashboard")

    return { success: true, announcement }
  } catch (err: any) {
    console.error("Create announcement error:", err)
    return { success: false, error: err.message || "فشل نشر التعميم الإداري" }
  }
}

export async function toggleAnnouncementAction(id: string, isActive: boolean) {
  try {
    const updated = await prisma.announcement.update({
      where: { id },
      data: { isActive },
    })

    revalidatePath("/dashboard/announcements")
    revalidatePath("/dashboard")
    return { success: true, announcement: updated }
  } catch (err: any) {
    console.error("Toggle announcement error:", err)
    return { success: false, error: err.message || "فشل تغيير حالة التعميم" }
  }
}

export async function deleteAnnouncementAction(id: string) {
  try {
    await prisma.announcement.delete({
      where: { id },
    })

    revalidatePath("/dashboard/announcements")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (err: any) {
    console.error("Delete announcement error:", err)
    return { success: false, error: err.message || "فشل حذف التعميم" }
  }
}

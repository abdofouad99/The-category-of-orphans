"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/app/actions/auth-actions"

export async function createDocumentPolicyAction(data: {
  title: string
  content?: string
  fileUrl?: string
  departmentId?: string
  isPublic?: boolean
}) {
  try {
    const user = await getCurrentUser()
    const adminUser = await prisma.user.findFirst({ where: { role: { in: ["ADMIN", "MANAGER"] } } })
    const creatorId = user?.id || adminUser?.id

    if (!creatorId) {
      return { success: false, error: "تعذر التحقق من هوية المستخدم" }
    }

    if (!data.title?.trim()) {
      return { success: false, error: "عنوان المستند أو اللائحة مطلوب" }
    }

    const doc = await prisma.documentPolicy.create({
      data: {
        title: data.title.trim(),
        content: data.content?.trim() || null,
        fileUrl: data.fileUrl?.trim() || null,
        departmentId: data.departmentId || null,
        isPublic: data.isPublic !== undefined ? data.isPublic : true,
        createdById: creatorId,
      },
      include: {
        department: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    })

    revalidatePath("/dashboard/docs")
    revalidatePath("/dashboard")

    return { success: true, doc }
  } catch (err: any) {
    console.error("Create doc error:", err)
    return { success: false, error: err.message || "فشل رفع وحفظ المستند" }
  }
}

export async function deleteDocumentPolicyAction(id: string) {
  try {
    await prisma.documentPolicy.delete({
      where: { id },
    })

    revalidatePath("/dashboard/docs")
    return { success: true }
  } catch (err: any) {
    console.error("Delete doc error:", err)
    return { success: false, error: err.message || "فشل حذف المستند" }
  }
}

"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createDepartmentAction(data: {
  name: string
  description?: string
}) {
  try {
    if (!data.name || !data.name.trim()) {
      return { success: false, error: "اسم القسم أو الإدارة مطلوب" }
    }

    const existing = await prisma.department.findUnique({
      where: { name: data.name.trim() }
    })
    if (existing) {
      return { success: false, error: "يوجد قسم مسجل بهذا الاسم مسبقاً" }
    }

    const department = await prisma.department.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
      }
    })

    revalidatePath("/dashboard/departments")
    revalidatePath("/dashboard/tasks")
    revalidatePath("/dashboard/docs")
    revalidatePath("/dashboard")

    return { success: true, department }
  } catch (err: any) {
    console.error("Create department error:", err)
    return { success: false, error: err.message || "فشل إضافة القسم" }
  }
}

export async function assignUserToDepartmentAction(userId: string, departmentId: string | null) {
  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { departmentId },
    })

    revalidatePath("/dashboard/departments")
    return { success: true, user: updated }
  } catch (err: any) {
    console.error("Assign user error:", err)
    return { success: false, error: err.message || "فشل تعيين الموظف للقسم" }
  }
}

export async function deleteDepartmentAction(id: string) {
  try {
    // Check if there are tasks or users linked
    const usersCount = await prisma.user.count({ where: { departmentId: id } })
    const tasksCount = await prisma.task.count({ where: { departmentId: id } })

    if (usersCount > 0 || tasksCount > 0) {
      return {
        success: false,
        error: `لا يمكن حذف هذا القسم لاحتوائه على (${usersCount}) موظف و (${tasksCount}) مهمة مرتبطة. يرجى نقلهم أولاً.`
      }
    }

    await prisma.department.delete({
      where: { id }
    })

    revalidatePath("/dashboard/departments")
    revalidatePath("/dashboard/tasks")
    revalidatePath("/dashboard/docs")
    revalidatePath("/dashboard")

    return { success: true }
  } catch (err: any) {
    console.error("Delete department error:", err)
    return { success: false, error: err.message || "فشل حذف القسم" }
  }
}

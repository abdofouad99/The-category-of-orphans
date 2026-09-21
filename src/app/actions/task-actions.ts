"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/app/actions/auth-actions"
import { TaskPriority, TaskStatus, TaskLevel } from "@prisma/client"

export async function createTaskAction(data: {
  title: string
  description?: string
  priority: TaskPriority
  level?: TaskLevel
  departmentId?: string
  assigneeId?: string
  dueDate?: string
}) {
  try {
    const user = await getCurrentUser()
    const adminUser = await prisma.user.findFirst({
      where: { role: { in: ["ADMIN", "MANAGER"] } }
    })
    const creatorId = user?.id || adminUser?.id

    if (!creatorId) {
      return { success: false, error: "تعذر التعرف على المستخدم الحالي" }
    }

    if (!data.title || !data.title.trim()) {
      return { success: false, error: "عنوان المهمة مطلوب" }
    }

    const task = await prisma.task.create({
      data: {
        title: data.title.trim(),
        description: data.description?.trim() || null,
        priority: data.priority || TaskPriority.MEDIUM,
        level: data.level || TaskLevel.EMPLOYEE,
        status: TaskStatus.NEW,
        departmentId: data.departmentId || null,
        assigneeId: data.assigneeId || null,
        assignedById: creatorId,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      },
      include: {
        department: true,
        assignee: true,
      }
    })

    revalidatePath("/dashboard/tasks")
    revalidatePath("/dashboard/tasks/board")
    revalidatePath("/dashboard")

    return { success: true, task }
  } catch (err: any) {
    console.error("Create task error:", err)
    return { success: false, error: err.message || "فشل إسناد المهمة" }
  }
}

export async function updateTaskStatusAction(taskId: string, status: TaskStatus) {
  try {
    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        status,
        completedAt: status === TaskStatus.COMPLETED || status === TaskStatus.APPROVED ? new Date() : null,
      }
    })

    revalidatePath("/dashboard/tasks")
    revalidatePath("/dashboard/tasks/board")
    return { success: true, task }
  } catch (err: any) {
    console.error("Update task status error:", err)
    return { success: false, error: err.message || "فشل تحديث حالة المهمة" }
  }
}

export async function deleteTaskAction(taskId: string) {
  try {
    await prisma.task.delete({
      where: { id: taskId }
    })

    revalidatePath("/dashboard/tasks")
    revalidatePath("/dashboard/tasks/board")
    return { success: true }
  } catch (err: any) {
    console.error("Delete task error:", err)
    return { success: false, error: err.message || "فشل حذف المهمة" }
  }
}

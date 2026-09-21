"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { VolunteerStatus } from "@prisma/client"

export async function createVolunteerAction(data: {
  fullName: string
  phone: string
  nationalId?: string
  email?: string
  skills?: string[]
  rating?: number
  totalHours?: number
  status?: VolunteerStatus
  notes?: string
}) {
  try {
    if (!data.fullName || !data.fullName.trim()) {
      return { success: false, error: "اسم المتطوع مطلوب" }
    }
    if (!data.phone || !data.phone.trim()) {
      return { success: false, error: "رقم هاتف المتطوع مطلوب" }
    }

    // Check nationalId duplication if provided
    if (data.nationalId && data.nationalId.trim()) {
      const existing = await prisma.volunteer.findFirst({
        where: { nationalId: data.nationalId.trim() }
      })
      if (existing) {
        return { success: false, error: "الرقم الوطني مسجل لمتطوع آخر مسبقاً" }
      }
    }

    const volunteer = await prisma.volunteer.create({
      data: {
        fullName: data.fullName.trim(),
        phone: data.phone.trim(),
        nationalId: data.nationalId?.trim() || null,
        email: data.email?.trim() || null,
        skills: data.skills || [],
        rating: data.rating ? Math.min(Math.max(Number(data.rating), 1), 5) : 5,
        totalHours: data.totalHours ? Number(data.totalHours) : 0,
        status: data.status || VolunteerStatus.ACTIVE,
        notes: data.notes?.trim() || null,
      }
    })

    revalidatePath("/dashboard/volunteers")
    revalidatePath("/dashboard")

    return { success: true, volunteer }
  } catch (err: any) {
    console.error("Create volunteer error:", err)
    return { success: false, error: err.message || "فشل تسجيل المتطوع" }
  }
}

export async function updateVolunteerStatusAction(id: string, status: VolunteerStatus) {
  try {
    const updated = await prisma.volunteer.update({
      where: { id },
      data: { status }
    })

    revalidatePath("/dashboard/volunteers")
    return { success: true, volunteer: updated }
  } catch (err: any) {
    console.error("Update volunteer status error:", err)
    return { success: false, error: err.message || "فشل تعديل حالة المتطوع" }
  }
}

export async function addVolunteerHoursAction(id: string, additionalHours: number) {
  try {
    if (!additionalHours || additionalHours <= 0) {
      return { success: false, error: "يرجى إدخال عدد ساعات صحيح" }
    }

    const updated = await prisma.volunteer.update({
      where: { id },
      data: {
        totalHours: {
          increment: Number(additionalHours)
        }
      }
    })

    revalidatePath("/dashboard/volunteers")
    return { success: true, volunteer: updated }
  } catch (err: any) {
    console.error("Add volunteer hours error:", err)
    return { success: false, error: err.message || "فشل إضافة الساعات لبنك التطوع" }
  }
}

export async function deleteVolunteerAction(id: string) {
  try {
    await prisma.volunteer.delete({
      where: { id }
    })

    revalidatePath("/dashboard/volunteers")
    return { success: true }
  } catch (err: any) {
    console.error("Delete volunteer error:", err)
    return { success: false, error: err.message || "فشل حذف المتطوع" }
  }
}

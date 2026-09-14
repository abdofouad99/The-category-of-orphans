export const dynamic = 'force-dynamic'

import { prisma } from "@/lib/prisma"
import { Stethoscope, AlertTriangle, Activity, DollarSign } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { PatientsClient } from "./patients-client"
import { PatientFormSheet } from "@/components/patients/patient-form-sheet"
import { getCurrentUser } from "@/app/actions/auth-actions"

// =============================================================================
// DATA FETCHING
// =============================================================================


async function getPatients() {
  return await prisma.patient.findMany({
    where: { deletedAt: null },
    include: {
      subDistrict: {
        include: {
          district: {
            include: { governorate: true },
          },
        },
      },
      family: {
        select: {
          id: true,
          headFullName: true,
          headNationalId: true,
        },
      },
      attachments: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  })
}

async function getGeography() {
  return await prisma.governorate.findMany({
    include: {
      districts: {
        include: {
          subDistricts: {
            select: { id: true, nameAr: true },
            orderBy: { nameAr: "asc" },
          },
        },
        orderBy: { nameAr: "asc" },
      },
    },
    orderBy: { nameAr: "asc" },
  })
}

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default async function PatientsPage() {
  const currentUser = await getCurrentUser()
  const [patients, geography] = await Promise.all([getPatients(), getGeography()])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-5 border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white md:text-2xl flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-rose-500" />
            إدارة المرضى والملفات الطبية
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400 font-medium">
            متابعة ملفات المرضى المستفيدين، سجلاتهم الطبية، ومستوى الدعم والرعاية المقدم لهم
          </p>
        </div>
        <PatientFormSheet geography={geography} />
      </div>

      {/* Interactive Table with Dynamic Stats Cards */}
      <PatientsClient
        initialPatients={patients}
        geography={geography}
        currentUserRole={currentUser?.role}
      />
    </div>
  )
}

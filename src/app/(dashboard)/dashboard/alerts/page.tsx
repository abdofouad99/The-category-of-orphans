export const dynamic = "force-dynamic"

import {
  getExpiringSponshorships,
  getOverdueSponsorships,
  getUnvisitedFamilies,
  getAgingOutOrphans,
  getMissingAccountOrphans,
  getUrgentWaitingOrphans,
  checkAndCreateAlerts,
} from "@/app/actions/alert-actions"
import { AlertsClient } from "./alerts-client"

export default async function AlertsPage() {
  // تشغيل فحص التنبيهات وإرسال WhatsApp تلقائياً عند فتح الصفحة
  await checkAndCreateAlerts()

  const [
    expiringResult,
    overdueResult,
    unvisitedResult,
    agingResult,
    missingAccResult,
    urgentResult,
  ] = await Promise.all([
    getExpiringSponshorships(),
    getOverdueSponsorships(),
    getUnvisitedFamilies(100),
    getAgingOutOrphans(),
    getMissingAccountOrphans(),
    getUrgentWaitingOrphans(),
  ])

  const initialExpiring = expiringResult.success ? (expiringResult.expiring || []) : []
  const initialOverdue = overdueResult.success ? (overdueResult.overdue || []) : []
  const initialUnvisited = unvisitedResult.success ? (unvisitedResult.families || []) : []
  const initialAgingOut = agingResult.success ? (agingResult.orphans || []) : []
  const initialMissingAccount = missingAccResult.success ? (missingAccResult.orphans || []) : []
  const initialUrgentWaiting = urgentResult.success ? (urgentResult.orphans || []) : []

  return (
    <AlertsClient
      initialExpiring={JSON.parse(JSON.stringify(initialExpiring))}
      initialOverdue={JSON.parse(JSON.stringify(initialOverdue))}
      initialUnvisited={JSON.parse(JSON.stringify(initialUnvisited))}
      initialAgingOut={JSON.parse(JSON.stringify(initialAgingOut))}
      initialMissingAccount={JSON.parse(JSON.stringify(initialMissingAccount))}
      initialUrgentWaiting={JSON.parse(JSON.stringify(initialUrgentWaiting))}
    />
  )
}

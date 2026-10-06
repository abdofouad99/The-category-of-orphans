export const dynamic = "force-dynamic"

import { getGlobalAuditLogs } from "@/app/actions/audit-actions"
import { ActivityLogClient } from "./activity-log-client"

export default async function ActivityLogPage() {
  const result = await getGlobalAuditLogs(250)
  const logs = result.success ? (result.logs || []) : []
  const totalCount = result.success ? result.totalCount : 0
  const stats = result.success ? result.stats : null

  return (
    <ActivityLogClient
      initialLogs={JSON.parse(JSON.stringify(logs))}
      totalCount={totalCount}
      stats={JSON.parse(JSON.stringify(stats))}
    />
  )
}

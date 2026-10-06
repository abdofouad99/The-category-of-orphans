export const dynamic = "force-dynamic"

import { getMyActivityLog } from "@/app/actions/my-activity-actions"
import { MyActivityClient } from "./my-activity-client"

export default async function MyActivityPage() {
  const result = await getMyActivityLog(250)
  const logs = result.success ? (result.logs || []) : []
  const stats = result.success ? result.stats : null
  const currentUser = result.success ? (result as any).currentUser : null

  return (
    <MyActivityClient
      initialLogs={JSON.parse(JSON.stringify(logs))}
      initialStats={JSON.parse(JSON.stringify(stats))}
      currentUser={currentUser ? JSON.parse(JSON.stringify(currentUser)) : null}
    />
  )
}

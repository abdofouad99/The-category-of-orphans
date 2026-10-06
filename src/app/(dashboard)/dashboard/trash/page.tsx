export const dynamic = "force-dynamic"

import { getDeletedRecords } from "@/app/actions/trash-actions"
import { TrashClient } from "./trash-client"

export default async function TrashPage() {
  const result = await getDeletedRecords()

  const initialData = {
    families: result.success ? (result.families || []) : [],
    beneficiaries: result.success ? (result.beneficiaries || []) : [],
    sponsors: result.success ? (result.sponsors || []) : [],
    sponsorships: result.success ? (result.sponsorships || []) : [],
    projects: result.success ? (result.projects || []) : [],
  }

  return (
    <TrashClient initialData={JSON.parse(JSON.stringify(initialData))} />
  )
}

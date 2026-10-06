export const dynamic = 'force-dynamic'

import { getGeoStructure, getSystemStats, getUsersList } from "@/app/actions/settings-actions"
import { getAllTagsAdmin } from "@/app/actions/tag-actions"
import { getCurrentUser } from "@/app/actions/auth-actions"
import { SettingsClient } from "./settings-client"

export default async function SettingsPage() {
  const [geoRes, statsRes, tagsRes, usersRes, currentUser] = await Promise.all([
    getGeoStructure(),
    getSystemStats(),
    getAllTagsAdmin(),
    getUsersList(),
    getCurrentUser(),
  ])

  const initialGeoStructure = geoRes.success ? (geoRes.governorates || []) : []
  const initialStats = statsRes.success ? (statsRes.stats || null) : null
  const initialTags = tagsRes.success ? (tagsRes.tags || []) : []
  const initialUsers = usersRes.success ? (usersRes.users || []) : []

  return (
    <SettingsClient
      initialGeoStructure={JSON.parse(JSON.stringify(initialGeoStructure))}
      initialStats={JSON.parse(JSON.stringify(initialStats))}
      initialTags={JSON.parse(JSON.stringify(initialTags))}
      initialUsers={JSON.parse(JSON.stringify(initialUsers))}
      currentUser={currentUser ? JSON.parse(JSON.stringify(currentUser)) : null}
    />
  )
}

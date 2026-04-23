'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import { useTeamStore } from '@/lib/stores/team-store'
import { useWorkLogStore } from '@/lib/stores/work-log-store'

export default function TeamSwitcher() {
  const {
    teams,
    activeTeamId,
    error,
    loadTeamContext,
    setError,
    switchActiveTeam,
  } = useTeamStore()
  const resetForTeamTransition = useWorkLogStore((state) => state.resetForTeamTransition)
  const [isSwitching, setIsSwitching] = useState(false)

  useEffect(() => {
    void loadTeamContext()
  }, [loadTeamContext])

  const handleChange = async (nextTeamId: string) => {
    if (!nextTeamId || nextTeamId === activeTeamId) {
      return
    }

    setIsSwitching(true)
    setError(null)
    const result = await switchActiveTeam(nextTeamId)
    setIsSwitching(false)

    if (!result.ok) {
      return
    }

    resetForTeamTransition()
    window.location.reload()
  }

  if (teams.length === 0) {
    return (
      <Link
        href="/team"
        className="px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-colors"
      >
        팀 설정
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <select
        id="team-switcher"
        value={activeTeamId || ''}
        onChange={(event) => void handleChange(event.target.value)}
        disabled={isSwitching}
        className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-800"
      >
        {teams.map((team) => (
          <option key={team.id} value={team.id}>
            {team.name}
          </option>
        ))}
      </select>
      <Link
        href="/team"
        className="px-3 py-2 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
      >
        관리
      </Link>
      {error && (
        <div className="text-xs text-red-600 max-w-56 text-right">{error}</div>
      )}
    </div>
  )
}

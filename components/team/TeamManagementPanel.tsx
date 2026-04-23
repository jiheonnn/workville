'use client'

import { useEffect, useMemo, useState } from 'react'

import { useAuthStore } from '@/lib/stores/auth-store'
import { useTeamStore } from '@/lib/stores/team-store'
import { useWorkLogStore } from '@/lib/stores/work-log-store'

import InviteMemberDialog from './InviteMemberDialog'
import PendingInvitesPanel from './PendingInvitesPanel'
import TeamCreateDialog from './TeamCreateDialog'

interface TeamMemberSummary {
  id: string
  username: string
  character_type: number | null
  user_status: Array<{ status: string }>
}

interface TeamInviteSummary {
  id: string
  email: string
  status: string
  created_at: string
}

async function parseJsonResponse(response: Response) {
  return response.json().catch(() => ({}))
}

export default function TeamManagementPanel() {
  const { user } = useAuthStore()
  const {
    teams,
    activeTeamId,
    pendingInvites,
    error,
    isLoading,
    loadTeamContext,
    createTeam,
    acceptInvite,
  } = useTeamStore()
  const resetForTeamTransition = useWorkLogStore((state) => state.resetForTeamTransition)
  const [members, setMembers] = useState<TeamMemberSummary[]>([])
  const [activeInvites, setActiveInvites] = useState<TeamInviteSummary[]>([])
  const [pageError, setPageError] = useState<string | null>(null)

  useEffect(() => {
    void loadTeamContext()
  }, [loadTeamContext])

  const activeTeam = useMemo(() => {
    return teams.find((team) => team.id === activeTeamId) || null
  }, [activeTeamId, teams])

  useEffect(() => {
    const fetchActiveTeamData = async () => {
      if (!activeTeamId) {
        setMembers([])
        setActiveInvites([])
        return
      }

      const [usersResponse, invitesResponse] = await Promise.all([
        fetch('/api/users', { cache: 'no-store' }),
        activeTeam?.role === 'owner'
          ? fetch(`/api/teams/${activeTeamId}/invites`, { cache: 'no-store' })
          : Promise.resolve(null),
      ])

      const usersBody = usersResponse ? await parseJsonResponse(usersResponse) : {}
      if (!usersResponse.ok) {
        setPageError(typeof usersBody.error === 'string' ? usersBody.error : '팀원 목록을 불러오지 못했습니다.')
        return
      }

      setMembers(Array.isArray((usersBody as any).users) ? (usersBody as any).users : [])

      if (invitesResponse) {
        const invitesBody = await parseJsonResponse(invitesResponse)
        if (!invitesResponse.ok) {
          setPageError(typeof invitesBody.error === 'string' ? invitesBody.error : '초대 목록을 불러오지 못했습니다.')
          return
        }

        setActiveInvites(Array.isArray((invitesBody as any).invites) ? (invitesBody as any).invites : [])
      } else {
        setActiveInvites([])
      }
    }

    void fetchActiveTeamData()
  }, [activeTeam?.role, activeTeamId])

  const handleCreateTeam = async (name: string) => {
    setPageError(null)
    const result = await createTeam(name)

    if (!result.ok) {
      setPageError(result.error || '팀 생성에 실패했습니다.')
      return false
    }

    resetForTeamTransition()
    window.location.href = '/village'
    return true
  }

  const handleAcceptInvite = async (inviteId: string) => {
    setPageError(null)
    const result = await acceptInvite(inviteId)

    if (!result.ok) {
      setPageError(result.error || '초대 수락에 실패했습니다.')
      return false
    }

    resetForTeamTransition()
    window.location.href = '/village'
    return true
  }

  const handleInvite = async (email: string) => {
    if (!activeTeamId) {
      return false
    }

    const response = await fetch(`/api/teams/${activeTeamId}/invites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })
    const body = await parseJsonResponse(response)

    if (!response.ok) {
      setPageError(typeof body.error === 'string' ? body.error : '초대 생성에 실패했습니다.')
      return false
    }

    const invitesResponse = await fetch(`/api/teams/${activeTeamId}/invites`, { cache: 'no-store' })
    const invitesBody = await parseJsonResponse(invitesResponse)
    setActiveInvites(Array.isArray((invitesBody as any).invites) ? (invitesBody as any).invites : [])
    return true
  }

  const refreshActiveInvites = async () => {
    if (!activeTeamId || activeTeam?.role !== 'owner') {
      setActiveInvites([])
      return
    }

    const invitesResponse = await fetch(`/api/teams/${activeTeamId}/invites`, { cache: 'no-store' })
    const invitesBody = await parseJsonResponse(invitesResponse)
    setActiveInvites(Array.isArray((invitesBody as any).invites) ? (invitesBody as any).invites : [])
  }

  const handleTransferOwner = async (memberId: string) => {
    if (!activeTeamId) {
      return
    }

    const confirmed = window.confirm('이 멤버에게 팀장을 위임하시겠습니까?')
    if (!confirmed) {
      return
    }

    const response = await fetch(`/api/teams/${activeTeamId}/owner`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: memberId }),
    })
    const body = await parseJsonResponse(response)

    if (!response.ok) {
      setPageError(typeof body.error === 'string' ? body.error : '팀장 위임에 실패했습니다.')
      return
    }

    await loadTeamContext()
    await refreshActiveInvites()
  }

  const handleLeaveTeam = async () => {
    if (!activeTeamId) {
      return
    }

    const confirmed = window.confirm('정말 이 팀에서 탈퇴하시겠습니까?')
    if (!confirmed) {
      return
    }

    const response = await fetch(`/api/teams/${activeTeamId}/membership`, {
      method: 'DELETE',
    })
    const body = await parseJsonResponse(response)

    if (!response.ok) {
      setPageError(typeof body.error === 'string' ? body.error : '팀 탈퇴에 실패했습니다.')
      return
    }

    resetForTeamTransition()
    window.location.reload()
  }

  const handleCancelInvite = async (inviteId: string) => {
    if (!activeTeamId) {
      return
    }

    const response = await fetch(`/api/teams/${activeTeamId}/invites/${inviteId}`, {
      method: 'DELETE',
    })
    const body = await parseJsonResponse(response)

    if (!response.ok) {
      setPageError(typeof body.error === 'string' ? body.error : '초대 취소에 실패했습니다.')
      return
    }

    await refreshActiveInvites()
  }

  return (
    <div className="space-y-6">
      <TeamCreateDialog onCreate={handleCreateTeam} isLoading={isLoading} />

      <PendingInvitesPanel invites={pendingInvites} onAccept={handleAcceptInvite} />

      <section className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">내 팀 목록</h2>
            <p className="text-sm text-gray-600 mt-2">
              여러 팀에 소속될 수 있으며, 상단 스위처에서 활성 팀을 바꿀 수 있습니다.
            </p>
          </div>
          {activeTeam && (
            <div className="text-sm font-semibold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl">
              활성 팀: {activeTeam.name}
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {teams.map((team) => (
            <div key={team.id} className="rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-800">{team.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{team.role === 'owner' ? '팀장' : '팀원'}</div>
                </div>
                {team.id === activeTeamId && (
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                    활성 팀
                  </span>
                )}
              </div>
            </div>
          ))}
          {teams.length === 0 && (
            <div className="rounded-xl bg-gray-50 px-4 py-6 text-sm text-gray-500">
              아직 속한 팀이 없습니다.
            </div>
          )}
        </div>
      </section>

      {activeTeam && (
        <>
          {activeTeam.role === 'owner' && (
            <>
              <InviteMemberDialog onInvite={handleInvite} />
              <section className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800">보낸 초대</h3>
                <div className="mt-4 space-y-3">
                  {activeInvites.length === 0 ? (
                    <div className="rounded-xl bg-gray-50 px-4 py-6 text-sm text-gray-500">
                      현재 대기 중인 초대가 없습니다.
                    </div>
                  ) : (
                    activeInvites.map((invite) => (
                      <div
                        key={invite.id}
                        className="rounded-xl border border-gray-200 px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <div className="font-medium text-gray-800">{invite.email}</div>
                          <div className="text-xs text-gray-500 mt-1">{invite.status}</div>
                        </div>
                        {invite.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => void handleCancelInvite(invite.id)}
                            className="px-4 py-2 rounded-xl bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100"
                          >
                            초대 취소
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </section>
            </>
          )}

          <section className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">현재 팀 멤버</h3>
              {activeTeam.role !== 'owner' && (
                <button
                  type="button"
                  onClick={() => void handleLeaveTeam()}
                  className="px-4 py-2 rounded-xl bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100"
                >
                  팀 탈퇴
                </button>
              )}
            </div>

            <div className="mt-4 space-y-3">
              {members.map((member) => {
                const isCurrentUser = member.id === user?.id
                return (
                  <div
                    key={member.id}
                    className="rounded-xl border border-gray-200 px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="font-medium text-gray-800">
                        {member.username} {isCurrentUser ? '(나)' : ''}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        상태: {member.user_status?.[0]?.status || 'home'}
                      </div>
                    </div>
                    {activeTeam.role === 'owner' && !isCurrentUser && (
                      <button
                        type="button"
                        onClick={() => void handleTransferOwner(member.id)}
                        className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200"
                      >
                        팀장 위임
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        </>
      )}

      {(pageError || error) && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {pageError || error}
        </div>
      )}
    </div>
  )
}

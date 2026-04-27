'use client'

import { useEffect, useMemo, useState } from 'react'

import { useAuthStore } from '@/lib/stores/auth-store'
import { useTeamStore } from '@/lib/stores/team-store'
import { useWorkLogStore } from '@/lib/stores/work-log-store'

import TeamDashboardView, {
  TeamInviteSummary,
  TeamMemberSummary,
} from './TeamDashboardView'

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

  const handleToggleRecordPermission = async (
    membershipId: string,
    canManageOwnRecords: boolean
  ) => {
    if (!activeTeamId) {
      return
    }

    const response = await fetch(
      `/api/teams/${activeTeamId}/members/${membershipId}/record-permission`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ canManageOwnRecords }),
      }
    )
    const body = await parseJsonResponse(response)

    if (!response.ok) {
      setPageError(typeof body.error === 'string' ? body.error : '기록 관리 권한 변경에 실패했습니다.')
      return
    }

    setMembers((currentMembers) =>
      currentMembers.map((member) =>
        member.membership_id === membershipId
          ? { ...member, can_manage_own_records: canManageOwnRecords }
          : member
      )
    )
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
    <TeamDashboardView
      userId={user?.id ?? null}
      teams={teams}
      activeTeamId={activeTeam?.id ?? activeTeamId}
      pendingInvites={pendingInvites}
      members={members}
      activeInvites={activeInvites}
      pageError={pageError || error}
      isLoading={isLoading}
      onCreateTeam={handleCreateTeam}
      onAcceptInvite={handleAcceptInvite}
      onInviteMember={handleInvite}
      onTransferOwner={handleTransferOwner}
      onToggleRecordPermission={handleToggleRecordPermission}
      onLeaveTeam={handleLeaveTeam}
      onCancelInvite={handleCancelInvite}
    />
  )
}

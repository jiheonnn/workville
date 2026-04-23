import { create } from 'zustand'

export interface TeamSummary {
  id: string
  name: string
  created_by: string
  created_at: string
  role: 'owner' | 'member'
}

export interface PendingInvite {
  id: string
  team_id: string
  email: string
  invited_by: string
  status: 'pending' | 'accepted' | 'cancelled'
  created_at: string
  accepted_at: string | null
  team: TeamSummary | null
}

interface TeamStore {
  teams: TeamSummary[]
  activeTeamId: string | null
  pendingInvites: PendingInvite[]
  isLoading: boolean
  error: string | null
  setError: (error: string | null) => void
  loadTeamContext: () => Promise<void>
  createTeam: (name: string) => Promise<{ ok: boolean; error?: string }>
  switchActiveTeam: (teamId: string) => Promise<{ ok: boolean; error?: string }>
  acceptInvite: (inviteId: string) => Promise<{ ok: boolean; error?: string }>
}

async function parseJsonResponse(response: Response) {
  const data = await response.json().catch(() => ({}))
  return data as Record<string, unknown>
}

export const useTeamStore = create<TeamStore>((set, get) => ({
  teams: [],
  activeTeamId: null,
  pendingInvites: [],
  isLoading: false,
  error: null,
  setError: (error) => set({ error }),
  loadTeamContext: async () => {
    set({ isLoading: true, error: null })

    try {
      const [teamsResponse, invitesResponse] = await Promise.all([
        fetch('/api/teams', { cache: 'no-store' }),
        fetch('/api/team-invites', { cache: 'no-store' }),
      ])

      const [teamsBody, invitesBody] = await Promise.all([
        parseJsonResponse(teamsResponse),
        parseJsonResponse(invitesResponse),
      ])

      if (!teamsResponse.ok) {
        throw new Error(typeof teamsBody.error === 'string' ? teamsBody.error : '팀 목록을 불러오지 못했습니다.')
      }

      if (!invitesResponse.ok) {
        throw new Error(typeof invitesBody.error === 'string' ? invitesBody.error : '초대 목록을 불러오지 못했습니다.')
      }

      set({
        teams: Array.isArray(teamsBody.teams) ? teamsBody.teams as TeamSummary[] : [],
        activeTeamId: typeof teamsBody.activeTeamId === 'string' ? teamsBody.activeTeamId : null,
        pendingInvites: Array.isArray(invitesBody.invites) ? invitesBody.invites as PendingInvite[] : [],
        isLoading: false,
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
      })
    }
  },
  createTeam: async (name) => {
    const response = await fetch('/api/teams', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    })
    const body = await parseJsonResponse(response)

    if (!response.ok) {
      const error = typeof body.error === 'string' ? body.error : '팀 생성에 실패했습니다.'
      set({ error })
      return { ok: false, error }
    }

    await get().loadTeamContext()
    return { ok: true }
  },
  switchActiveTeam: async (teamId) => {
    const response = await fetch('/api/teams/active', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ teamId }),
    })
    const body = await parseJsonResponse(response)

    if (!response.ok) {
      const error = typeof body.error === 'string' ? body.error : '팀 전환에 실패했습니다.'
      set({ error })
      return { ok: false, error }
    }

    set({ activeTeamId: teamId, error: null })
    return { ok: true }
  },
  acceptInvite: async (inviteId) => {
    const response = await fetch(`/api/team-invites/${inviteId}/accept`, {
      method: 'POST',
    })
    const body = await parseJsonResponse(response)

    if (!response.ok) {
      const error = typeof body.error === 'string' ? body.error : '초대 수락에 실패했습니다.'
      set({ error })
      return { ok: false, error }
    }

    await get().loadTeamContext()
    return { ok: true }
  },
}))

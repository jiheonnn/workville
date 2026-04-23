import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MockSupabaseClient } from '@/lib/test-utils/mock-supabase'

const createApiClientMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase/api-client', () => ({
  createApiClient: createApiClientMock,
}))

const { GET, POST } = await import('./route')

const createRequest = (body: Record<string, unknown>) =>
  new Request('http://localhost/api/teams', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

describe('GET /api/teams', () => {
  beforeEach(() => {
    createApiClientMock.mockReset()
  })

  it('현재 로그인한 사용자가 속한 팀만 반환합니다', async () => {
    const supabase = new MockSupabaseClient({
      tables: {
        profiles: [
          {
            id: 'user-1',
            email: 'user-1@example.com',
            username: '지헌',
            character_type: 1,
            level: 1,
            total_work_hours: 0,
            active_team_id: 'team-1',
            created_at: '2026-04-23T00:00:00.000Z',
          },
        ],
        teams: [
          {
            id: 'team-1',
            name: '첫 팀',
            created_by: 'user-1',
            created_at: '2026-04-23T00:00:00.000Z',
          },
          {
            id: 'team-2',
            name: '다른 팀',
            created_by: 'user-2',
            created_at: '2026-04-23T00:00:00.000Z',
          },
        ],
        team_members: [
          {
            id: 'membership-1',
            team_id: 'team-1',
            user_id: 'user-1',
            role: 'owner',
            status: 'active',
            joined_at: '2026-04-23T00:00:00.000Z',
            created_at: '2026-04-23T00:00:00.000Z',
          },
        ],
      },
    })
    createApiClientMock.mockResolvedValue(supabase)

    const response = await GET(new Request('http://localhost/api/teams') as any)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.activeTeamId).toBe('team-1')
    expect(body.teams).toHaveLength(1)
    expect(body.teams[0].id).toBe('team-1')
  })
})

describe('POST /api/teams', () => {
  beforeEach(() => {
    createApiClientMock.mockReset()
  })

  it('새 팀을 만들면 팀장 멤버십과 팀 템플릿을 함께 생성하고 active_team_id를 갱신합니다', async () => {
    const supabase = new MockSupabaseClient({
      tables: {
        profiles: [
          {
            id: 'user-1',
            email: 'user-1@example.com',
            username: '지헌',
            character_type: 1,
            level: 1,
            total_work_hours: 0,
            active_team_id: null,
            created_at: '2026-04-23T00:00:00.000Z',
          },
        ],
      },
    })
    createApiClientMock.mockResolvedValue(supabase)

    const response = await POST(
      createRequest({
        name: '워크빌 팀',
      }) as any
    )

    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body.team.name).toBe('워크빌 팀')
    expect(supabase.getRows('teams')).toHaveLength(1)
    expect(supabase.getRows('team_members')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          team_id: body.team.id,
          user_id: 'user-1',
          role: 'owner',
          status: 'active',
        }),
      ])
    )
    expect(supabase.getRows('work_log_template')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          team_id: body.team.id,
        }),
      ])
    )
    expect(supabase.getRows('user_status')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          team_id: body.team.id,
          user_id: 'user-1',
          status: 'home',
        }),
      ])
    )
    expect(supabase.getRows('profiles')[0].active_team_id).toBe(body.team.id)
  })
})

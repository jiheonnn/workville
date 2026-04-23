import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MockSupabaseClient } from '@/lib/test-utils/mock-supabase'

const createApiClientMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase/api-client', () => ({
  createApiClient: createApiClientMock,
}))

const { PUT } = await import('./route')

const createRequest = (body: Record<string, unknown>) =>
  new Request('http://localhost/api/teams/active', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

describe('PUT /api/teams/active', () => {
  beforeEach(() => {
    createApiClientMock.mockReset()
  })

  it('열린 근무 세션이 있으면 active team 변경을 막습니다', async () => {
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
          {
            id: 'membership-2',
            team_id: 'team-2',
            user_id: 'user-1',
            role: 'member',
            status: 'active',
            joined_at: '2026-04-23T00:00:00.000Z',
            created_at: '2026-04-23T00:00:00.000Z',
          },
        ],
        work_sessions: [
          {
            id: 'session-1',
            team_id: 'team-1',
            user_id: 'user-1',
            check_in_time: '2026-04-23T00:00:00.000Z',
            check_out_time: null,
            duration_minutes: null,
            break_minutes: 0,
            last_break_start: null,
            date: '2026-04-23',
            created_at: '2026-04-23T00:00:00.000Z',
          },
        ],
      },
    })
    createApiClientMock.mockResolvedValue(supabase)

    const response = await PUT(
      createRequest({
        teamId: 'team-2',
      }) as any
    )

    expect(response.status).toBe(409)
    expect(supabase.getRows('profiles')[0].active_team_id).toBe('team-1')
  })

  it('다른 팀에 열린 세션이 있어도 현재 활성 팀에 열린 세션이 없으면 전환을 허용합니다', async () => {
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
          {
            id: 'membership-2',
            team_id: 'team-2',
            user_id: 'user-1',
            role: 'member',
            status: 'active',
            joined_at: '2026-04-23T00:00:00.000Z',
            created_at: '2026-04-23T00:00:00.000Z',
          },
        ],
        work_sessions: [
          {
            id: 'session-1',
            team_id: 'team-2',
            user_id: 'user-1',
            check_in_time: '2026-04-23T00:00:00.000Z',
            check_out_time: null,
            duration_minutes: null,
            break_minutes: 0,
            last_break_start: null,
            date: '2026-04-23',
            created_at: '2026-04-23T00:00:00.000Z',
          },
        ],
      },
    })
    createApiClientMock.mockResolvedValue(supabase)

    const response = await PUT(
      createRequest({
        teamId: 'team-2',
      }) as any
    )

    expect(response.status).toBe(200)
    expect(supabase.getRows('profiles')[0].active_team_id).toBe('team-2')
  })
})

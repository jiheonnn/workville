import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MockSupabaseClient } from '@/lib/test-utils/mock-supabase'

const createApiClientMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase/api-client', () => ({
  createApiClient: createApiClientMock,
}))

const { PUT } = await import('./route')

const createRequest = (body: Record<string, unknown>) =>
  new Request('http://localhost/api/teams/team-1/owner', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

describe('PUT /api/teams/[teamId]/owner', () => {
  beforeEach(() => {
    createApiClientMock.mockReset()
  })

  it('같은 팀의 활성 멤버에게 팀장을 원자적으로 위임합니다', async () => {
    const supabase = new MockSupabaseClient({
      tables: {
        profiles: [
          {
            id: 'user-1',
            email: 'owner@example.com',
            username: '팀장',
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
            team_id: 'team-1',
            user_id: 'user-2',
            role: 'member',
            status: 'active',
            joined_at: '2026-04-23T00:00:00.000Z',
            created_at: '2026-04-23T00:00:00.000Z',
          },
        ],
      },
    })
    createApiClientMock.mockResolvedValue(supabase)

    const response = await PUT(createRequest({ userId: 'user-2' }) as any, {
      params: Promise.resolve({ teamId: 'team-1' }),
    })

    expect(response.status).toBe(200)
    const memberships = supabase.getRows('team_members')
    expect(memberships.find((membership) => membership.user_id === 'user-1')?.role).toBe('member')
    expect(memberships.find((membership) => membership.user_id === 'user-2')?.role).toBe('owner')
  })
})

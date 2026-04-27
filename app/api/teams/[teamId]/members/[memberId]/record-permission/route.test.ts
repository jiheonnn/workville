import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MockSupabaseClient } from '@/lib/test-utils/mock-supabase'

const createApiClientMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase/api-client', () => ({
  createApiClient: createApiClientMock,
}))

const { PUT } = await import('./route')

const createPutRequest = (body: Record<string, unknown>) =>
  new Request('http://localhost/api/teams/team-1/members/membership-2/record-permission', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

describe('PUT /api/teams/[teamId]/members/[memberId]/record-permission', () => {
  beforeEach(() => {
    createApiClientMock.mockReset()
  })

  it('팀장이 멤버의 기록 관리 권한을 변경합니다', async () => {
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
            can_manage_own_records: false,
            joined_at: '2026-04-23T00:00:00.000Z',
            created_at: '2026-04-23T00:00:00.000Z',
          },
          {
            id: 'membership-2',
            team_id: 'team-1',
            user_id: 'user-2',
            role: 'member',
            status: 'active',
            can_manage_own_records: false,
            joined_at: '2026-04-23T00:00:00.000Z',
            created_at: '2026-04-23T00:00:00.000Z',
          },
        ],
      },
    })
    createApiClientMock.mockResolvedValue(supabase)

    const response = await PUT(
      createPutRequest({ canManageOwnRecords: true }) as any,
      { params: Promise.resolve({ teamId: 'team-1', memberId: 'membership-2' }) }
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.membership.can_manage_own_records).toBe(true)
    expect(supabase.getRows('team_members')[1].can_manage_own_records).toBe(true)
  })
})

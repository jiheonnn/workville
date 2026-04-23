import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MockSupabaseClient } from '@/lib/test-utils/mock-supabase'

const createApiClientMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase/api-client', () => ({
  createApiClient: createApiClientMock,
}))

const { GET } = await import('./route')

describe('GET /api/users', () => {
  beforeEach(() => {
    createApiClientMock.mockReset()
  })

  it('현재 active team에 속한 사용자만 마을 목록으로 반환합니다', async () => {
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
          {
            id: 'user-2',
            email: 'user-2@example.com',
            username: '아라',
            character_type: 2,
            level: 1,
            total_work_hours: 0,
            active_team_id: 'team-1',
            created_at: '2026-04-23T00:00:00.000Z',
          },
          {
            id: 'user-3',
            email: 'user-3@example.com',
            username: '민수',
            character_type: 3,
            level: 1,
            total_work_hours: 0,
            active_team_id: 'team-2',
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
          {
            id: 'membership-3',
            team_id: 'team-2',
            user_id: 'user-3',
            role: 'owner',
            status: 'active',
            joined_at: '2026-04-23T00:00:00.000Z',
            created_at: '2026-04-23T00:00:00.000Z',
          },
        ],
        user_status: [
          {
            id: 'status-1',
            team_id: 'team-1',
            user_id: 'user-1',
            status: 'working',
            last_updated: '2026-04-23T00:00:00.000Z',
          },
          {
            id: 'status-2',
            team_id: 'team-1',
            user_id: 'user-2',
            status: 'home',
            last_updated: '2026-04-23T00:00:00.000Z',
          },
          {
            id: 'status-3',
            team_id: 'team-2',
            user_id: 'user-3',
            status: 'working',
            last_updated: '2026-04-23T00:00:00.000Z',
          },
        ],
      },
    })
    createApiClientMock.mockResolvedValue(supabase)

    const response = await GET(new Request('http://localhost/api/users') as any)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.users.map((user: { id: string }) => user.id)).toEqual(['user-2', 'user-1'])
  })
})

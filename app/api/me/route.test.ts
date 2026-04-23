import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MockSupabaseClient } from '@/lib/test-utils/mock-supabase'

const createApiClientMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase/api-client', () => ({
  createApiClient: createApiClientMock,
}))

const { GET } = await import('./route')

describe('GET /api/me', () => {
  beforeEach(() => {
    createApiClientMock.mockReset()
  })

  it('로그인한 사용자의 프로필을 반환합니다', async () => {
    const supabase = new MockSupabaseClient({
      tables: {
        profiles: [
          {
            id: 'user-1',
            email: 'user-1@example.com',
            username: '지헌',
            character_type: 1,
            level: 3,
            total_work_hours: 12,
            active_team_id: 'team-1',
            created_at: '2026-04-23T00:00:00.000Z',
          },
        ],
      },
    })

    createApiClientMock.mockResolvedValue(supabase)

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.profile).toEqual(
      expect.objectContaining({
        id: 'user-1',
        username: '지헌',
        character_type: 1,
        level: 3,
        active_team_id: 'team-1',
      })
    )
  })

  it('인증되지 않은 사용자는 401을 반환합니다', async () => {
    const supabase = new MockSupabaseClient({
      authUserId: null,
    })

    createApiClientMock.mockResolvedValue(supabase)

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })
})

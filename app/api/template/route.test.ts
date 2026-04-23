import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MockSupabaseClient } from '@/lib/test-utils/mock-supabase'

const createApiClientMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase/api-client', () => ({
  createApiClient: createApiClientMock,
}))

const { GET } = await import('./route')

describe('GET /api/template', () => {
  beforeEach(() => {
    createApiClientMock.mockReset()
  })

  it('현재 active team의 템플릿만 반환합니다', async () => {
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
        ],
        work_log_template: [
          {
            id: 'template-1',
            team_id: 'team-1',
            content: 'team-1 template',
            updated_at: '2026-04-23T00:00:00.000Z',
            updated_by: 'user-1',
          },
          {
            id: 'template-2',
            team_id: 'team-2',
            content: 'team-2 template',
            updated_at: '2026-04-23T00:00:00.000Z',
            updated_by: 'user-2',
          },
        ],
      },
    })
    createApiClientMock.mockResolvedValue(supabase)

    const response = await GET(new Request('http://localhost/api/template') as any)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.template.id).toBe('template-1')
  })
})

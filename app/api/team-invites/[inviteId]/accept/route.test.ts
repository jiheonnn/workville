import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MockSupabaseClient } from '@/lib/test-utils/mock-supabase'

const createApiClientMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase/api-client', () => ({
  createApiClient: createApiClientMock,
}))

const { POST } = await import('./route')

describe('POST /api/team-invites/[inviteId]/accept', () => {
  beforeEach(() => {
    createApiClientMock.mockReset()
  })

  it('로그인 사용자 이메일과 초대 이메일이 일치하면 멤버십을 만들고 active team을 설정합니다', async () => {
    const supabase = new MockSupabaseClient({
      tables: {
        profiles: [
          {
            id: 'user-1',
            email: 'Member@Example.com',
            username: '지헌',
            character_type: 1,
            level: 1,
            total_work_hours: 0,
            active_team_id: null,
            created_at: '2026-04-23T00:00:00.000Z',
          },
        ],
        teams: [
          {
            id: 'team-1',
            name: '워크빌 팀',
            created_by: 'user-2',
            created_at: '2026-04-23T00:00:00.000Z',
          },
        ],
        team_members: [
          {
            id: 'membership-owner',
            team_id: 'team-1',
            user_id: 'user-2',
            role: 'owner',
            status: 'active',
            joined_at: '2026-04-23T00:00:00.000Z',
            created_at: '2026-04-23T00:00:00.000Z',
          },
        ],
        team_invites: [
          {
            id: 'invite-1',
            team_id: 'team-1',
            email: 'member@example.com',
            invited_by: 'user-2',
            status: 'pending',
            created_at: '2026-04-23T00:00:00.000Z',
            accepted_at: null,
          },
        ],
      },
    })
    createApiClientMock.mockResolvedValue(supabase)

    const response = await POST(
      new Request('http://localhost/api/team-invites/invite-1/accept', {
        method: 'POST',
      }) as any,
      {
        params: Promise.resolve({ inviteId: 'invite-1' }),
      } as any
    )

    expect(response.status).toBe(200)
    expect(supabase.getRows('team_members')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          team_id: 'team-1',
          user_id: 'user-1',
          role: 'member',
          status: 'active',
        }),
      ])
    )
    expect(supabase.getRows('team_invites')[0].status).toBe('accepted')
    expect(supabase.getRows('profiles')[0].active_team_id).toBe('team-1')
    expect(supabase.getRows('user_status')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          team_id: 'team-1',
          user_id: 'user-1',
          status: 'home',
        }),
      ])
    )
  })

  it('기존 removed 멤버십이 있으면 새 row를 만들지 않고 재활성화합니다', async () => {
    const supabase = new MockSupabaseClient({
      tables: {
        profiles: [
          {
            id: 'user-1',
            email: 'Member@Example.com',
            username: '지헌',
            character_type: 1,
            level: 1,
            total_work_hours: 0,
            active_team_id: 'team-2',
            created_at: '2026-04-23T00:00:00.000Z',
          },
        ],
        teams: [
          {
            id: 'team-1',
            name: '워크빌 팀',
            created_by: 'user-2',
            created_at: '2026-04-23T00:00:00.000Z',
          },
        ],
        team_members: [
          {
            id: 'membership-owner',
            team_id: 'team-1',
            user_id: 'user-2',
            role: 'owner',
            status: 'active',
            joined_at: '2026-04-23T00:00:00.000Z',
            created_at: '2026-04-23T00:00:00.000Z',
          },
          {
            id: 'membership-removed',
            team_id: 'team-1',
            user_id: 'user-1',
            role: 'member',
            status: 'removed',
            joined_at: '2026-04-22T00:00:00.000Z',
            created_at: '2026-04-22T00:00:00.000Z',
          },
        ],
        team_invites: [
          {
            id: 'invite-1',
            team_id: 'team-1',
            email: 'member@example.com',
            invited_by: 'user-2',
            status: 'pending',
            created_at: '2026-04-23T00:00:00.000Z',
            accepted_at: null,
          },
        ],
        user_status: [
          {
            id: 'status-1',
            team_id: 'team-1',
            user_id: 'user-1',
            status: 'working',
            last_updated: '2026-04-22T00:00:00.000Z',
          },
        ],
      },
    })
    createApiClientMock.mockResolvedValue(supabase)

    const response = await POST(
      new Request('http://localhost/api/team-invites/invite-1/accept', {
        method: 'POST',
      }) as any,
      {
        params: Promise.resolve({ inviteId: 'invite-1' }),
      } as any
    )

    expect(response.status).toBe(200)
    expect(
      supabase
        .getRows('team_members')
        .filter((membership) => membership.team_id === 'team-1' && membership.user_id === 'user-1')
    ).toHaveLength(1)
    expect(
      supabase
        .getRows('team_members')
        .find((membership) => membership.id === 'membership-removed')
    ).toEqual(
      expect.objectContaining({
        status: 'active',
        role: 'member',
      })
    )
    expect(
      supabase
        .getRows('user_status')
        .filter((status) => status.team_id === 'team-1' && status.user_id === 'user-1')
    ).toHaveLength(1)
    expect(supabase.getRows('team_invites')[0].status).toBe('accepted')
    expect(supabase.getRows('profiles')[0].active_team_id).toBe('team-2')
  })
})

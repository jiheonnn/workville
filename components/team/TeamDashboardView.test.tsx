import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import TeamDashboardView from './TeamDashboardView'

const createViewProps = () => ({
  userId: 'user-1',
  teams: [
    {
      id: 'team-1',
      name: '테스트팀',
      created_by: 'user-1',
      created_at: '2026-04-23T00:00:00.000Z',
      role: 'owner' as const,
    },
    {
      id: 'team-2',
      name: '사이드팀',
      created_by: 'user-2',
      created_at: '2026-04-23T00:00:00.000Z',
      role: 'member' as const,
    },
  ],
  activeTeamId: 'team-1',
  pendingInvites: [
    {
      id: 'invite-1',
      team_id: 'team-3',
      email: 'user-1@example.com',
      invited_by: 'user-2',
      status: 'pending' as const,
      created_at: '2026-04-23T00:00:00.000Z',
      accepted_at: null,
      team: {
        id: 'team-3',
        name: '초대받은 팀',
        created_by: 'user-2',
        created_at: '2026-04-23T00:00:00.000Z',
        role: 'member' as const,
      },
    },
  ],
  members: [
    {
      id: 'user-1',
      username: '백지헌',
      character_type: 1,
      user_status: [{ status: 'working' }],
    },
    {
      id: 'user-2',
      username: '동료',
      character_type: 2,
      user_status: [{ status: 'home' }],
    },
  ],
  activeInvites: [
    {
      id: 'sent-invite-1',
      email: 'invitee@example.com',
      status: 'pending',
      created_at: '2026-04-23T00:00:00.000Z',
    },
  ],
  pageError: null,
  isLoading: false,
  onCreateTeam: vi.fn(async () => true),
  onAcceptInvite: vi.fn(async () => true),
  onInviteMember: vi.fn(async () => true),
  onTransferOwner: vi.fn(async () => {}),
  onLeaveTeam: vi.fn(async () => {}),
  onCancelInvite: vi.fn(async () => {}),
})

describe('TeamDashboardView', () => {
  it('활성 팀 중심 섹션 순서를 렌더합니다', () => {
    const html = renderToStaticMarkup(<TeamDashboardView {...createViewProps()} />)

    const activeTeamIndex = html.indexOf('활성 팀')
    const memberIndex = html.indexOf('현재 팀 멤버')
    const otherTeamsIndex = html.indexOf('내 다른 팀')
    const createTeamIndex = html.indexOf('새 팀 만들기')

    expect(activeTeamIndex).toBeGreaterThanOrEqual(0)
    expect(memberIndex).toBeGreaterThan(activeTeamIndex)
    expect(otherTeamsIndex).toBeGreaterThan(memberIndex)
    expect(createTeamIndex).toBeGreaterThan(otherTeamsIndex)
  })

  it('활성 팀 카드 안에서 현재 팀 멤버를 함께 렌더합니다', () => {
    const html = renderToStaticMarkup(<TeamDashboardView {...createViewProps()} />)

    const activeTeamCardStart = html.indexOf('활성 팀')
    const activeTeamCardEnd = html.indexOf('받은 초대')
    const activeTeamCardHtml = html.slice(activeTeamCardStart, activeTeamCardEnd)

    expect(activeTeamCardHtml).toContain('현재 팀 멤버')
    expect(activeTeamCardHtml).toContain('백지헌')
    expect(activeTeamCardHtml).toContain('동료')
    expect(activeTeamCardHtml).not.toContain('활성 멤버')
  })

  it('내 역할 배지는 현재 사용자 행의 나 배지 옆에 렌더합니다', () => {
    const html = renderToStaticMarkup(<TeamDashboardView {...createViewProps()} />)
    const currentUserIndex = html.indexOf('백지헌')
    const nextMemberIndex = html.indexOf('동료')
    const currentUserRowHtml = html.slice(currentUserIndex, nextMemberIndex)

    expect(currentUserRowHtml).toContain('나')
    expect(currentUserRowHtml).toContain('팀장')
  })

  it('활성 팀이 없으면 온보딩 중심 빈 상태를 렌더합니다', () => {
    const props = createViewProps()
    props.activeTeamId = null
    props.members = []
    props.activeInvites = []

    const html = renderToStaticMarkup(<TeamDashboardView {...props} />)

    expect(html).toContain('아직 활성 팀이 없습니다')
    expect(html).toContain('받은 초대')
    expect(html).toContain('새 팀 만들기')
  })

  it('활성 팀 카드에는 보조 설명과 중복 탈퇴 버튼을 렌더하지 않습니다', () => {
    const props = createViewProps()
    props.teams = [
      {
        id: 'team-1',
        name: '테스트팀',
        created_by: 'user-2',
        created_at: '2026-04-23T00:00:00.000Z',
        role: 'member',
      },
    ]
    props.activeTeamId = 'team-1'
    props.activeInvites = []

    const html = renderToStaticMarkup(<TeamDashboardView {...props} />)

    expect(html).not.toContain('지금 이 팀을 기준으로 마을, 상태, 업무일지, 통계가 동작합니다.')
    expect((html.match(/팀 탈퇴/g) || []).length).toBe(1)
  })

  it('현재 팀 멤버를 제외한 카드 부연 설명은 렌더하지 않습니다', () => {
    const html = renderToStaticMarkup(<TeamDashboardView {...createViewProps()} />)

    expect(html).not.toContain('지금 활성 팀에서 함께 일하는 멤버입니다.')
    expect(html).not.toContain('현재 로그인한 이메일로 온 초대만 표시됩니다.')
    expect(html).not.toContain('팀에 합류하기 전인 사용자들을 관리합니다.')
    expect(html).not.toContain('상세 관리는 현재 활성 팀 중심으로 하고, 전환은 상단 스위처에서 진행합니다.')
    expect(html).not.toContain('팀을 만들면 바로 팀장이 되며, 이후 상단에서 활성 팀 전환이 가능합니다.')
  })
})

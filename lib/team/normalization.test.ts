import { describe, expect, it } from 'vitest'

import {
  countActiveMembers,
  normalizeInviteEmail,
  shouldBlockTeamSwitch,
} from './normalization'

describe('normalizeInviteEmail', () => {
  it('이메일 초대 비교를 위해 공백과 대소문자를 정규화합니다', () => {
    expect(normalizeInviteEmail('  User@Example.COM ')).toBe('user@example.com')
  })
})

describe('countActiveMembers', () => {
  it('취소된 초대는 제외하고 활성 멤버 수만 계산합니다', () => {
    expect(
      countActiveMembers([
        { role: 'owner', status: 'active' },
        { role: 'member', status: 'active' },
        { role: 'member', status: 'removed' },
      ])
    ).toBe(2)
  })
})

describe('shouldBlockTeamSwitch', () => {
  it('활성 근무 세션이 있으면 팀 전환을 막습니다', () => {
    expect(
      shouldBlockTeamSwitch({
        check_out_time: null,
      })
    ).toBe(true)

    expect(
      shouldBlockTeamSwitch({
        check_out_time: '2026-04-23T10:00:00.000Z',
      })
    ).toBe(false)
  })
})

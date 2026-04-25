import { describe, expect, it } from 'vitest'

import { formatDurationMinutes, getDisplayedStatusSummary } from './status-summary'

describe('getDisplayedStatusSummary', () => {
  it('근무중일 때는 완료된 근무 시간과 진행 중인 세션을 한 번만 합산합니다', () => {
    const summary = getDisplayedStatusSummary({
      currentUserStatus: 'working',
      currentTime: new Date('2026-04-23T02:00:00.000Z'),
      todaySessions: [
        {
          check_in_time: '2026-04-23T00:00:00.000Z',
          check_out_time: null,
          duration_minutes: null,
          break_minutes: 15,
          last_break_start: null,
        },
      ],
      completedDurationMinutes: 30,
    })

    expect(summary).toEqual({
      label: '오늘 근무 시간',
      totalMinutes: 150,
    })
  })

  it('열린 세션이 여러 개 남아 있으면 가장 최근 열린 세션만 진행 중 세션으로 계산합니다', () => {
    const summary = getDisplayedStatusSummary({
      currentUserStatus: 'working',
      currentTime: new Date('2026-04-23T04:00:00.000Z'),
      todaySessions: [
        {
          check_in_time: '2026-04-23T00:00:00.000Z',
          check_out_time: null,
          duration_minutes: null,
          break_minutes: 0,
          last_break_start: null,
        },
        {
          check_in_time: '2026-04-23T03:30:00.000Z',
          check_out_time: null,
          duration_minutes: null,
          break_minutes: 0,
          last_break_start: null,
        },
      ],
      completedDurationMinutes: 45,
    })

    expect(summary).toEqual({
      label: '오늘 근무 시간',
      totalMinutes: 75,
    })
  })

  it('휴식중일 때는 누적 휴식 시간과 진행 중인 휴식을 합산해 반환합니다', () => {
    const summary = getDisplayedStatusSummary({
      currentUserStatus: 'break',
      currentTime: new Date('2026-04-23T02:00:00.000Z'),
      todaySessions: [
        {
          check_in_time: '2026-04-23T00:00:00.000Z',
          check_out_time: null,
          duration_minutes: null,
          break_minutes: 20,
          last_break_start: '2026-04-23T01:40:00.000Z',
        },
      ],
      completedDurationMinutes: 90,
    })

    expect(summary).toEqual({
      label: '오늘 휴식 시간',
      totalMinutes: 40,
    })
  })
})

describe('formatDurationMinutes', () => {
  it('분을 시간/분 문자열로 포맷합니다', () => {
    expect(formatDurationMinutes(125)).toBe('2시간 5분')
  })
})

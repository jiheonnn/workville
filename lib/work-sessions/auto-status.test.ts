import { describe, expect, it } from 'vitest'

import {
  AUTO_BREAK_THRESHOLD_MINUTES,
  AUTO_CHECKOUT_THRESHOLD_MINUTES,
  ACTIVITY_PING_MIN_INTERVAL_MINUTES,
  getAutoStatusAction,
  getLatestActivityTime,
} from './auto-status'

describe('auto status rules', () => {
  it('브라우저 활동, 업무일지 수정, 출근 시각 중 가장 최신 시각을 활동 기준으로 사용합니다', () => {
    expect(
      getLatestActivityTime({
        checkInTime: '2026-04-27T00:00:00.000Z',
        lastActivityAt: '2026-04-27T01:00:00.000Z',
        workLogUpdatedAt: '2026-04-27T02:00:00.000Z',
      })?.toISOString()
    ).toBe('2026-04-27T02:00:00.000Z')
  })

  it('2시간 미만 무활동이면 자동 처리하지 않습니다', () => {
    expect(AUTO_BREAK_THRESHOLD_MINUTES).toBe(2 * 60)
    expect(
      getAutoStatusAction({
        currentStatus: 'working',
        checkInTime: '2026-04-27T00:00:00.000Z',
        lastActivityAt: '2026-04-27T01:00:00.000Z',
        workLogUpdatedAt: null,
        now: new Date('2026-04-27T02:59:00.000Z'),
        existingBreakMinutes: 0,
        lastBreakStart: null,
      })
    ).toBeNull()
  })

  it('2시간 이상 4시간 미만 무활동이면 마지막 활동 2시간 뒤부터 휴식 처리합니다', () => {
    const action = getAutoStatusAction({
      currentStatus: 'working',
      checkInTime: '2026-04-27T00:00:00.000Z',
      lastActivityAt: '2026-04-27T01:00:00.000Z',
      workLogUpdatedAt: null,
      now: new Date('2026-04-27T03:30:00.000Z'),
      existingBreakMinutes: 0,
      lastBreakStart: null,
    })

    expect(action).toEqual({
      kind: 'start_break',
      lastActivityAt: '2026-04-27T01:00:00.000Z',
      effectiveAt: '2026-04-27T03:00:00.000Z',
    })
  })

  it('4시간 이상 무활동이면 마지막 활동 2시간 뒤부터 휴식으로 계산하고 4시간 뒤 퇴근 처리합니다', () => {
    expect(AUTO_CHECKOUT_THRESHOLD_MINUTES).toBe(4 * 60)

    const action = getAutoStatusAction({
      currentStatus: 'working',
      checkInTime: '2026-04-27T00:00:00.000Z',
      lastActivityAt: '2026-04-27T01:00:00.000Z',
      workLogUpdatedAt: null,
      now: new Date('2026-04-27T05:30:00.000Z'),
      existingBreakMinutes: 0,
      lastBreakStart: null,
    })

    expect(action).toEqual({
      kind: 'checkout',
      lastActivityAt: '2026-04-27T01:00:00.000Z',
      effectiveAt: '2026-04-27T05:00:00.000Z',
      breakStartAt: '2026-04-27T03:00:00.000Z',
      additionalBreakMinutes: 120,
      totalBreakMinutes: 120,
      durationMinutes: 180,
    })
  })

  it('이미 휴식 중이면 기존 휴식 시작 시각부터 퇴근 시각까지 휴식으로 계산합니다', () => {
    const action = getAutoStatusAction({
      currentStatus: 'break',
      checkInTime: '2026-04-27T00:00:00.000Z',
      lastActivityAt: '2026-04-27T01:00:00.000Z',
      workLogUpdatedAt: null,
      now: new Date('2026-04-27T05:30:00.000Z'),
      existingBreakMinutes: 30,
      lastBreakStart: '2026-04-27T02:00:00.000Z',
    })

    expect(action).toMatchObject({
      kind: 'checkout',
      effectiveAt: '2026-04-27T05:00:00.000Z',
      breakStartAt: '2026-04-27T02:00:00.000Z',
      additionalBreakMinutes: 180,
      totalBreakMinutes: 210,
      durationMinutes: 90,
    })
  })

  it('브라우저 활동 저장은 최소 5분 간격으로 제한합니다', () => {
    expect(ACTIVITY_PING_MIN_INTERVAL_MINUTES).toBe(5)
  })
})

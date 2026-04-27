import { describe, expect, it, vi } from 'vitest'

import {
  ABNORMAL_WORK_DURATION_MINUTES,
  calculateWorkDurationMinutes,
  isAbnormalWorkDuration,
  validateWorkSessionEditWindow,
} from './validation'

describe('work session validation', () => {
  it('기존 휴식시간을 유지한 채 출근/퇴근 시간으로 근무 시간을 다시 계산합니다', () => {
    const durationMinutes = calculateWorkDurationMinutes({
      checkInTime: '2026-04-26T00:00:00.000Z',
      checkOutTime: '2026-04-26T09:00:00.000Z',
      breakMinutes: 60,
    })

    expect(durationMinutes).toBe(480)
  })

  it('퇴근 시간이 출근 시간보다 빠르거나 휴식시간보다 짧은 세션은 거부합니다', () => {
    expect(() =>
      calculateWorkDurationMinutes({
        checkInTime: '2026-04-26T09:00:00.000Z',
        checkOutTime: '2026-04-26T08:00:00.000Z',
        breakMinutes: 0,
      })
    ).toThrow('INVALID_TIME_RANGE')

    expect(() =>
      calculateWorkDurationMinutes({
        checkInTime: '2026-04-26T09:00:00.000Z',
        checkOutTime: '2026-04-26T10:00:00.000Z',
        breakMinutes: 90,
      })
    ).toThrow('INVALID_DURATION')
  })

  it('최근 7일 이내의 세션만 수정할 수 있습니다', () => {
    vi.setSystemTime(new Date('2026-04-27T12:00:00.000Z'))

    expect(validateWorkSessionEditWindow('2026-04-21')).toEqual({ ok: true })
    expect(validateWorkSessionEditWindow('2026-04-20')).toEqual({
      ok: false,
      reason: 'EDIT_WINDOW_EXPIRED',
    })

    vi.useRealTimers()
  })

  it('14시간 이상 근무를 비정상 장시간으로 판단합니다', () => {
    expect(ABNORMAL_WORK_DURATION_MINUTES).toBe(840)
    expect(isAbnormalWorkDuration(839)).toBe(false)
    expect(isAbnormalWorkDuration(840)).toBe(true)
  })
})

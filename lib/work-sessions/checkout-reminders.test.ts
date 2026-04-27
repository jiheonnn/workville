import { describe, expect, it } from 'vitest'

import {
  CHECKOUT_REMINDER_THRESHOLD_MINUTES,
  formatCheckoutReminderElapsedTime,
  formatCheckoutReminderStartTime,
  isCheckoutReminderDue,
} from './checkout-reminders'

describe('checkout reminder rules', () => {
  it('12시간 미만 열린 세션은 리마인드 대상이 아닙니다', () => {
    expect(
      isCheckoutReminderDue({
        checkInTime: '2026-04-27T00:01:00.000Z',
        now: new Date('2026-04-27T12:00:00.000Z'),
      })
    ).toBe(false)
  })

  it('12시간 이상 열린 세션은 리마인드 대상입니다', () => {
    expect(CHECKOUT_REMINDER_THRESHOLD_MINUTES).toBe(12 * 60)
    expect(
      isCheckoutReminderDue({
        checkInTime: '2026-04-27T00:00:00.000Z',
        now: new Date('2026-04-27T12:00:00.000Z'),
      })
    ).toBe(true)
  })

  it('경과 시간은 시간과 분으로 표시합니다', () => {
    expect(
      formatCheckoutReminderElapsedTime({
        checkInTime: '2026-04-27T00:00:00.000Z',
        now: new Date('2026-04-27T13:30:00.000Z'),
      })
    ).toBe('13시간 30분')
  })

  it('출근 시각은 한국 시간 기준으로 표시합니다', () => {
    expect(formatCheckoutReminderStartTime('2026-04-27T00:00:00.000Z')).toBe('09:00')
  })
})

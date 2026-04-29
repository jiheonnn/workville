import { UserStatus } from '@/lib/types'

export const ACTIVITY_PING_MIN_INTERVAL_MINUTES = 5
export const AUTO_BREAK_THRESHOLD_MINUTES = 2 * 60
export const AUTO_CHECKOUT_THRESHOLD_MINUTES = 6 * 60

interface LatestActivityInput {
  checkInTime: string
  lastActivityAt?: string | null
  workLogUpdatedAt?: string | null
}

interface AutoStatusInput extends LatestActivityInput {
  currentStatus: UserStatus
  now: Date
  existingBreakMinutes: number
  lastBreakStart?: string | null
}

export type AutoStatusAction =
  | {
      kind: 'start_break'
      lastActivityAt: string
      effectiveAt: string
    }
  | {
      kind: 'checkout'
      lastActivityAt: string
      effectiveAt: string
      breakStartAt: string
      additionalBreakMinutes: number
      totalBreakMinutes: number
      durationMinutes: number
    }

const MINUTE_IN_MS = 60 * 1000

function toValidDate(value?: string | null) {
  if (!value) {
    return null
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * MINUTE_IN_MS)
}

function getElapsedMinutes(start: Date, end: Date) {
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / MINUTE_IN_MS))
}

export function getLatestActivityTime(input: LatestActivityInput) {
  const candidates = [
    toValidDate(input.checkInTime),
    toValidDate(input.lastActivityAt),
    toValidDate(input.workLogUpdatedAt),
  ].filter((date): date is Date => Boolean(date))

  if (candidates.length === 0) {
    return null
  }

  return candidates.reduce((latest, candidate) =>
    candidate.getTime() > latest.getTime() ? candidate : latest
  )
}

export function getAutoStatusAction(input: AutoStatusInput): AutoStatusAction | null {
  if (input.currentStatus === 'home') {
    return null
  }

  const latestActivityAt = getLatestActivityTime(input)
  const checkInTime = toValidDate(input.checkInTime)

  if (!latestActivityAt || !checkInTime) {
    return null
  }

  const inactiveMinutes = getElapsedMinutes(latestActivityAt, input.now)

  if (inactiveMinutes >= AUTO_CHECKOUT_THRESHOLD_MINUTES) {
    const checkoutAt = addMinutes(latestActivityAt, AUTO_CHECKOUT_THRESHOLD_MINUTES)
    const fallbackBreakStartAt = addMinutes(latestActivityAt, AUTO_BREAK_THRESHOLD_MINUTES)
    const currentBreakStartAt =
      input.currentStatus === 'break' ? toValidDate(input.lastBreakStart) : null
    const breakStartAt = currentBreakStartAt ?? fallbackBreakStartAt
    const additionalBreakMinutes = getElapsedMinutes(breakStartAt, checkoutAt)
    const totalBreakMinutes = Math.max(0, input.existingBreakMinutes) + additionalBreakMinutes
    const totalSessionMinutes = Math.max(1, getElapsedMinutes(checkInTime, checkoutAt))

    return {
      kind: 'checkout',
      lastActivityAt: latestActivityAt.toISOString(),
      effectiveAt: checkoutAt.toISOString(),
      breakStartAt: breakStartAt.toISOString(),
      additionalBreakMinutes,
      totalBreakMinutes,
      durationMinutes: Math.max(1, totalSessionMinutes - totalBreakMinutes),
    }
  }

  if (input.currentStatus === 'working' && inactiveMinutes >= AUTO_BREAK_THRESHOLD_MINUTES) {
    return {
      kind: 'start_break',
      lastActivityAt: latestActivityAt.toISOString(),
      effectiveAt: addMinutes(latestActivityAt, AUTO_BREAK_THRESHOLD_MINUTES).toISOString(),
    }
  }

  return null
}

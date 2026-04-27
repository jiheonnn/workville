export const ABNORMAL_WORK_DURATION_MINUTES = 14 * 60
export const WORK_SESSION_EDIT_WINDOW_DAYS = 7

export interface WorkDurationInput {
  checkInTime: string
  checkOutTime: string
  breakMinutes: number
}

export interface EditWindowResult {
  ok: boolean
  reason?: 'EDIT_WINDOW_EXPIRED' | 'FUTURE_SESSION_DATE' | 'INVALID_SESSION_DATE'
}

const KOREA_TIME_ZONE = 'Asia/Seoul'

export function calculateWorkDurationMinutes({
  checkInTime,
  checkOutTime,
  breakMinutes,
}: WorkDurationInput) {
  const checkIn = new Date(checkInTime)
  const checkOut = new Date(checkOutTime)

  if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
    throw new Error('INVALID_TIME_FORMAT')
  }

  const totalMinutes = Math.floor((checkOut.getTime() - checkIn.getTime()) / (1000 * 60))

  if (totalMinutes <= 0) {
    throw new Error('INVALID_TIME_RANGE')
  }

  const durationMinutes = totalMinutes - Math.max(0, breakMinutes || 0)

  if (durationMinutes < 1) {
    throw new Error('INVALID_DURATION')
  }

  return durationMinutes
}

export function isAbnormalWorkDuration(durationMinutes: number) {
  return durationMinutes >= ABNORMAL_WORK_DURATION_MINUTES
}

export function validateWorkSessionEditWindow(sessionDate: string, now = new Date()): EditWindowResult {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(sessionDate)) {
    return { ok: false, reason: 'INVALID_SESSION_DATE' }
  }

  const todayKey = toKoreaDateKey(now)
  const today = parseDateKeyAsUtcDay(todayKey)
  const target = parseDateKeyAsUtcDay(sessionDate)

  if (Number.isNaN(target.getTime())) {
    return { ok: false, reason: 'INVALID_SESSION_DATE' }
  }

  const diffDays = Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return { ok: false, reason: 'FUTURE_SESSION_DATE' }
  }

  // 이유:
  // "최근 7일"은 오늘 포함 7일로 해석합니다. 예: 4/27 기준 4/21~4/27 수정 가능.
  if (diffDays > WORK_SESSION_EDIT_WINDOW_DAYS - 1) {
    return { ok: false, reason: 'EDIT_WINDOW_EXPIRED' }
  }

  return { ok: true }
}

function parseDateKeyAsUtcDay(dateKey: string) {
  return new Date(`${dateKey}T00:00:00.000Z`)
}

function toKoreaDateKey(date: Date) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: KOREA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  return formatter.format(date)
}

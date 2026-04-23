import { UserStatus } from '@/lib/types'

export interface StatusSummarySession {
  check_in_time: string | null
  check_out_time: string | null
  duration_minutes: number | null
  break_minutes?: number | null
  last_break_start?: string | null
}

function getOngoingBreakMinutes(
  session: StatusSummarySession,
  currentUserStatus: UserStatus,
  currentTime: Date
) {
  if (currentUserStatus !== 'break' || !session.last_break_start) {
    return 0
  }

  const breakStart = new Date(session.last_break_start)
  return Math.max(0, Math.floor((currentTime.getTime() - breakStart.getTime()) / (1000 * 60)))
}

export function getDisplayedStatusSummary(options: {
  currentUserStatus: UserStatus
  currentTime: Date
  todaySessions: StatusSummarySession[]
  totalDurationMinutes: number
}) {
  const { currentUserStatus, currentTime, todaySessions, totalDurationMinutes } = options

  if (currentUserStatus === 'break') {
    const totalBreakMinutes = todaySessions.reduce((total, session) => {
      const completedBreakMinutes = session.break_minutes || 0
      return total + completedBreakMinutes + getOngoingBreakMinutes(session, currentUserStatus, currentTime)
    }, 0)

    return {
      label: '오늘 휴식 시간',
      totalMinutes: totalBreakMinutes,
    }
  }

  let totalMinutes = totalDurationMinutes
  const activeSession = todaySessions.find((session) => !session.check_out_time)

  if (activeSession?.check_in_time && currentUserStatus === 'working') {
    const checkInTime = new Date(activeSession.check_in_time)
    const currentWorkingMinutes = Math.floor((currentTime.getTime() - checkInTime.getTime()) / (1000 * 60))
    totalMinutes = totalDurationMinutes + currentWorkingMinutes
  }

  return {
    label: '오늘 근무 시간',
    totalMinutes,
  }
}

export function formatDurationMinutes(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours}시간 ${minutes}분`
}

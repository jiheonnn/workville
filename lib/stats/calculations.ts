import type { CharacterType } from '@/types/database'

export type StatsPeriod = 'week' | 'month' | 'quarter' | 'custom'

export interface StatsDateRangeOptions {
  customEndDate?: string | null
  customStartDate?: string | null
  now?: Date
}

export interface StatsDateRange {
  startDate: Date
  endDate: Date
  startDateKey: string
  endDateKey: string
}

export interface StatsProfile {
  id: string
  username: string | null
  character_type: CharacterType | null
  level: number | null
  total_work_hours?: number | null
}

export interface StatsSession {
  user_id: string
  date?: string | null
  check_in_time: string | null
  check_out_time: string | null
  duration_minutes: number | null
}

export interface StatsDay {
  date: string
  hours: number
  dayOfWeek: string
  checkIn: string | null
  checkOut: string | null
}

export interface MemberStatsDetail {
  member: {
    id: string
    username: string
    characterType: CharacterType | null
    level: number
  }
  dailyStats: StatsDay[]
  summary: {
    totalHours: number
    averageHours: number
    workDays: number
    period: string
    earliestCheckIn: string | null
    latestCheckOut: string | null
    mostProductiveDay: string | null
  }
  dayPattern: Array<{
    day: string
    averageHours: number
  }>
  weeklyPattern: Array<{
    week: string
    hours: number
  }>
  level?: {
    current: number
    totalWorkHours: number
    hoursToNext: number
    progress: number
  }
}

export interface LeaderboardStats {
  currentUserId: string
  members: Array<{
    id: string
    username: string
    characterType: CharacterType | null
    level: number
    totalHours: number
    averageHours: number
    workDays: number
    rank: number
    isCurrentUser: boolean
  }>
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const

function toDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function cloneAtStartOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function cloneAtEndOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(23, 59, 59, 999)
  return next
}

function roundToSingleDecimal(value: number) {
  return Math.round(value * 10) / 10
}

function formatTime(value: string | null) {
  if (!value) {
    return null
  }

  const date = new Date(value)
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const period = hours < 12 ? '오전' : '오후'
  const hour12 = hours % 12 || 12

  return `${period} ${String(hour12).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function compareTimeOfDay(source: string | null, target: string | null) {
  if (!source || !target) {
    return 0
  }

  const sourceDate = new Date(source)
  const targetDate = new Date(target)

  return (
    sourceDate.getHours() * 60 +
    sourceDate.getMinutes() -
    (targetDate.getHours() * 60 + targetDate.getMinutes())
  )
}

export function resolveStatsDateRange(
  period: StatsPeriod,
  options: StatsDateRangeOptions = {}
): StatsDateRange {
  const now = options.now ? new Date(options.now) : new Date()
  const endDate =
    period === 'custom' && options.customEndDate
      ? cloneAtEndOfDay(new Date(options.customEndDate))
      : cloneAtEndOfDay(now)

  const startDate =
    period === 'custom' && options.customStartDate
      ? cloneAtStartOfDay(new Date(options.customStartDate))
      : cloneAtStartOfDay(now)

  if (period !== 'custom') {
    // # 이유: 기존 화면의 버튼 라벨과 실제 조회 범위를 바꾸지 않기 위해
    // 기존 API가 사용하던 "최근 N일" 기준(7/30/90)을 그대로 유지합니다.
    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7)
        break
      case 'month':
        startDate.setDate(startDate.getDate() - 30)
        break
      case 'quarter':
        startDate.setDate(startDate.getDate() - 90)
        break
    }
  }

  return {
    startDate,
    endDate,
    startDateKey: toDateKey(startDate),
    endDateKey: toDateKey(endDate),
  }
}

export function buildMemberStats({
  profile,
  sessions,
  range,
  includeLevelProgress = false,
}: {
  profile: StatsProfile
  sessions: StatsSession[]
  range: StatsDateRange
  includeLevelProgress?: boolean
}): MemberStatsDetail {
  const dailyStatsMap = new Map<
    string,
    { hours: number; checkIn: string | null; checkOut: string | null }
  >()

  const currentDate = new Date(range.startDate)

  while (currentDate <= range.endDate) {
    dailyStatsMap.set(toDateKey(currentDate), {
      hours: 0,
      checkIn: null,
      checkOut: null,
    })
    currentDate.setDate(currentDate.getDate() + 1)
  }

  sessions.forEach((session) => {
    if (!session.duration_minutes) {
      return
    }

    const dateKey = session.date ?? (session.check_in_time ? toDateKey(new Date(session.check_in_time)) : null)

    if (!dateKey || !dailyStatsMap.has(dateKey)) {
      return
    }

    const existing = dailyStatsMap.get(dateKey)!
    existing.hours += session.duration_minutes / 60

    if (session.check_in_time && (!existing.checkIn || session.check_in_time < existing.checkIn)) {
      existing.checkIn = session.check_in_time
    }

    if (
      session.check_out_time &&
      (!existing.checkOut || session.check_out_time > existing.checkOut)
    ) {
      existing.checkOut = session.check_out_time
    }
  })

  const dailyStats = Array.from(dailyStatsMap.entries()).map(([date, day]) => {
    const parsedDate = new Date(`${date}T00:00:00`)

    return {
      date,
      hours: roundToSingleDecimal(day.hours),
      dayOfWeek: DAY_LABELS[parsedDate.getDay()],
      checkIn: day.checkIn,
      checkOut: day.checkOut,
    }
  })

  const totalHours = roundToSingleDecimal(
    dailyStats.reduce((sum, day) => sum + day.hours, 0)
  )
  const workDays = dailyStats.filter((day) => day.hours > 0).length
  const averageHours =
    workDays > 0 ? roundToSingleDecimal(totalHours / workDays) : 0

  let earliestCheckIn: string | null = null
  let latestCheckOut: string | null = null

  dailyStats.forEach((day) => {
    if (day.checkIn && (!earliestCheckIn || compareTimeOfDay(day.checkIn, earliestCheckIn) < 0)) {
      earliestCheckIn = day.checkIn
    }

    if (day.checkOut && (!latestCheckOut || compareTimeOfDay(day.checkOut, latestCheckOut) > 0)) {
      latestCheckOut = day.checkOut
    }
  })

  const dayHoursMap = dailyStats.reduce<Record<string, number>>((acc, day) => {
    acc[day.dayOfWeek] = (acc[day.dayOfWeek] || 0) + day.hours
    return acc
  }, {})

  const mostProductiveDay = Object.entries(dayHoursMap).reduce<{
    day: string | null
    hours: number
  }>(
    (currentMax, [day, hours]) =>
      hours > currentMax.hours ? { day, hours } : currentMax,
    { day: null, hours: 0 }
  ).day

  const dayPattern = DAY_LABELS.map((day) => {
    const matchedDays = dailyStats.filter((dailyStat) => dailyStat.dayOfWeek === day)
    const totalDayHours = matchedDays.reduce((sum, matchedDay) => sum + matchedDay.hours, 0)

    return {
      day,
      averageHours:
        matchedDays.length > 0
          ? roundToSingleDecimal(totalDayHours / matchedDays.length)
          : 0,
    }
  })

  const weeklyHoursMap = new Map<string, number>()

  dailyStats.forEach((day) => {
    const parsedDate = new Date(`${day.date}T00:00:00`)
    const weekStartDate = new Date(parsedDate)

    weekStartDate.setDate(parsedDate.getDate() - parsedDate.getDay())

    const weekKey = toDateKey(weekStartDate)
    weeklyHoursMap.set(weekKey, (weeklyHoursMap.get(weekKey) || 0) + day.hours)
  })

  const weeklyPattern = Array.from(weeklyHoursMap.entries()).map(([weekStart, hours]) => ({
    week: new Date(`${weekStart}T00:00:00`).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
    }),
    hours: roundToSingleDecimal(hours),
  }))

  const level =
    includeLevelProgress
      ? (() => {
          const currentLevel = profile.level || 1
          const totalWorkHours = roundToSingleDecimal(profile.total_work_hours || 0)
          const currentLevelFloor = (currentLevel - 1) * 8
          const nextLevelTarget = currentLevel * 8
          const hoursToNext = Math.max(0, nextLevelTarget - totalWorkHours)
          const progress = Math.max(
            0,
            Math.min(100, Math.round(((totalWorkHours - currentLevelFloor) / 8) * 100))
          )

          return {
            current: currentLevel,
            totalWorkHours,
            hoursToNext: roundToSingleDecimal(hoursToNext),
            progress,
          }
        })()
      : undefined

  return {
    member: {
      id: profile.id,
      username: profile.username || 'Anonymous',
      characterType: profile.character_type,
      level: profile.level || 1,
    },
    dailyStats,
    summary: {
      totalHours,
      averageHours,
      workDays,
      period: `${range.startDate.toLocaleDateString('ko-KR')} - ${range.endDate.toLocaleDateString('ko-KR')}`,
      earliestCheckIn: formatTime(earliestCheckIn),
      latestCheckOut: formatTime(latestCheckOut),
      mostProductiveDay,
    },
    dayPattern,
    weeklyPattern,
    level,
  }
}

export function buildLeaderboardStats({
  currentUserId,
  profiles,
  sessions,
}: {
  currentUserId: string
  profiles: Array<Pick<StatsProfile, 'id' | 'username' | 'character_type' | 'level'>>
  sessions: StatsSession[]
  range: StatsDateRange
}): LeaderboardStats {
  const memberStats = new Map<
    string,
    {
      id: string
      username: string
      characterType: CharacterType | null
      level: number
      totalHours: number
      workDays: Set<string>
    }
  >()

  profiles.forEach((profile) => {
    memberStats.set(profile.id, {
      id: profile.id,
      username: profile.username || 'Anonymous',
      characterType: profile.character_type,
      level: profile.level || 1,
      totalHours: 0,
      workDays: new Set<string>(),
    })
  })

  sessions.forEach((session) => {
    if (!session.duration_minutes || !memberStats.has(session.user_id)) {
      return
    }

    const target = memberStats.get(session.user_id)!
    const dateKey = session.date ?? (session.check_in_time ? toDateKey(new Date(session.check_in_time)) : null)

    target.totalHours += session.duration_minutes / 60

    if (dateKey) {
      target.workDays.add(dateKey)
    }
  })

  const members = Array.from(memberStats.values())
    .map((member) => ({
      ...member,
      totalHours: roundToSingleDecimal(member.totalHours),
      averageHours:
        member.workDays.size > 0
          ? roundToSingleDecimal(member.totalHours / member.workDays.size)
          : 0,
      workDays: member.workDays.size,
    }))
    .sort((left, right) => {
      if (right.totalHours !== left.totalHours) {
        return right.totalHours - left.totalHours
      }

      if (right.workDays !== left.workDays) {
        return right.workDays - left.workDays
      }

      if (right.averageHours !== left.averageHours) {
        return right.averageHours - left.averageHours
      }

      return left.username.localeCompare(right.username, 'ko')
    })
    .map((member, index) => ({
      ...member,
      rank: index + 1,
      isCurrentUser: member.id === currentUserId,
    }))

  return {
    currentUserId,
    members,
  }
}

import { describe, expect, it } from 'vitest'

import {
  buildLeaderboardStats,
  buildMemberStats,
  resolveStatsDateRange,
} from './calculations'

describe('resolveStatsDateRange', () => {
  it('기간 설정일 때 시작일과 종료일을 하루 단위 범위로 정리합니다', () => {
    const range = resolveStatsDateRange('custom', {
      customStartDate: '2026-04-01',
      customEndDate: '2026-04-07',
    })

    expect(range.startDateKey).toBe('2026-04-01')
    expect(range.endDateKey).toBe('2026-04-07')
    expect(range.startDate.getHours()).toBe(0)
    expect(range.startDate.getMinutes()).toBe(0)
    expect(range.endDate.getHours()).toBe(23)
    expect(range.endDate.getMinutes()).toBe(59)
  })
})

describe('buildMemberStats', () => {
  it('내 통계와 다른 사람 통계가 함께 쓸 수 있는 공용 상세 데이터를 만듭니다', () => {
    const range = resolveStatsDateRange('custom', {
      customStartDate: '2026-04-01',
      customEndDate: '2026-04-07',
    })

    const stats = buildMemberStats({
      profile: {
        id: 'me',
        username: '지헌',
        character_type: 1,
        level: 3,
        total_work_hours: 21,
      },
      sessions: [
        {
          user_id: 'me',
          date: '2026-04-01',
          check_in_time: '2026-04-01T00:00:00.000Z',
          check_out_time: '2026-04-01T08:00:00.000Z',
          duration_minutes: 480,
        },
        {
          user_id: 'me',
          date: '2026-04-03',
          check_in_time: '2026-04-03T01:00:00.000Z',
          check_out_time: '2026-04-03T06:00:00.000Z',
          duration_minutes: 300,
        },
      ],
      range,
      includeLevelProgress: true,
    })

    expect(stats.member.username).toBe('지헌')
    expect(stats.summary.totalHours).toBe(13)
    expect(stats.summary.averageHours).toBe(6.5)
    expect(stats.summary.workDays).toBe(2)
    expect(stats.summary.earliestCheckIn).toBe('오전 09:00')
    expect(stats.summary.latestCheckOut).toBe('오후 05:00')
    expect(stats.summary.mostProductiveDay).toBe('수')
    expect(stats.dayPattern.find((day) => day.day === '수')?.averageHours).toBe(8)
    expect(stats.weeklyPattern[0]).toEqual({ week: '3월 29일', hours: 13 })
    expect(stats.level).toEqual({
      current: 3,
      totalWorkHours: 21,
      hoursToNext: 3,
      progress: 63,
    })
  })
})

describe('buildLeaderboardStats', () => {
  it('선택 기간 총 근무시간 기준으로 리더보드를 만들고 나 자신도 포함합니다', () => {
    const range = resolveStatsDateRange('custom', {
      customStartDate: '2026-04-01',
      customEndDate: '2026-04-07',
    })

    const leaderboard = buildLeaderboardStats({
      currentUserId: 'me',
      profiles: [
        {
          id: 'me',
          username: '지헌',
          character_type: 1,
          level: 3,
        },
        {
          id: 'teammate-1',
          username: '아라',
          character_type: 2,
          level: 4,
        },
        {
          id: 'teammate-2',
          username: '민수',
          character_type: 3,
          level: 2,
        },
      ],
      sessions: [
        {
          user_id: 'me',
          date: '2026-04-02',
          check_in_time: '2026-04-02T00:00:00.000Z',
          check_out_time: '2026-04-02T06:00:00.000Z',
          duration_minutes: 360,
        },
        {
          user_id: 'teammate-1',
          date: '2026-04-01',
          check_in_time: '2026-04-01T00:00:00.000Z',
          check_out_time: '2026-04-01T10:00:00.000Z',
          duration_minutes: 600,
        },
        {
          user_id: 'teammate-1',
          date: '2026-04-03',
          check_in_time: '2026-04-03T00:00:00.000Z',
          check_out_time: '2026-04-03T04:00:00.000Z',
          duration_minutes: 240,
        },
      ],
      range,
    })

    expect(leaderboard.currentUserId).toBe('me')
    expect(leaderboard.members.map((member) => member.username)).toEqual(['아라', '지헌', '민수'])
    expect(leaderboard.members.map((member) => member.rank)).toEqual([1, 2, 3])
    expect(leaderboard.members[1]).toMatchObject({
      id: 'me',
      totalHours: 6,
      isCurrentUser: true,
    })
    expect(leaderboard.members[2]).toMatchObject({
      id: 'teammate-2',
      totalHours: 0,
      workDays: 0,
      isCurrentUser: false,
    })
  })
})

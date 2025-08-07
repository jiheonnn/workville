'use client'

import { useMemo } from 'react'

interface MemberStats {
  member: {
    id: string
    username: string
    characterType: string
    level: number
  }
  dailyStats: Array<{
    date: string
    hours: number
    dayOfWeek: string
    checkIn: string | null
    checkOut: string | null
  }>
  summary: {
    totalHours: number
    averageHours: number
    workDays: number
    period: string
    earliestCheckIn: string | null
    latestCheckOut: string | null
    mostProductiveDay: string | null
  }
  weeklyPattern: Array<{
    week: string
    hours: number
  }>
}

interface MemberStatsViewProps {
  stats: MemberStats
  formatDate: (date: string) => string
  getCharacterColor: (characterType: string) => string
}

export default function MemberStatsView({ stats, formatDate, getCharacterColor }: MemberStatsViewProps) {
  const maxDailyHours = Math.max(...stats.dailyStats.map(d => d.hours), 1)
  const maxWeeklyHours = Math.max(...stats.weeklyPattern.map(w => w.hours), 1)

  const dayOfWeekAverage = useMemo(() => {
    const dayMap: Record<string, { total: number, count: number }> = {}
    stats.dailyStats.forEach(day => {
      if (!dayMap[day.dayOfWeek]) {
        dayMap[day.dayOfWeek] = { total: 0, count: 0 }
      }
      dayMap[day.dayOfWeek].total += day.hours
      dayMap[day.dayOfWeek].count += 1
    })

    const days = ['월', '화', '수', '목', '금', '토', '일']
    return days.map(day => ({
      day,
      averageHours: dayMap[day] ? Math.round((dayMap[day].total / dayMap[day].count) * 10) / 10 : 0
    }))
  }, [stats.dailyStats])

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '-'
    return timeStr
  }

  return (
    <div className="space-y-6">
      {/* Member Info Card */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">{stats.member.username}</h3>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">레벨 {stats.member.level}</span>
              <span 
                className="px-3 py-1 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: getCharacterColor(stats.member.characterType) }}
              >
                {stats.member.characterType}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 mb-1">분석 기간</p>
            <p className="text-sm font-medium text-gray-800">{stats.summary.period}</p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border-2 border-gray-100 hover:border-emerald-300 transition-all duration-300">
          <p className="text-sm text-gray-600 mb-2">총 근무시간</p>
          <p className="text-3xl font-black text-emerald-600">{stats.summary.totalHours}h</p>
        </div>
        <div className="bg-white rounded-xl p-5 border-2 border-gray-100 hover:border-blue-300 transition-all duration-300">
          <p className="text-sm text-gray-600 mb-2">평균 근무시간</p>
          <p className="text-3xl font-black text-blue-600">{stats.summary.averageHours}h</p>
        </div>
        <div className="bg-white rounded-xl p-5 border-2 border-gray-100 hover:border-purple-300 transition-all duration-300">
          <p className="text-sm text-gray-600 mb-2">근무일수</p>
          <p className="text-3xl font-black text-purple-600">{stats.summary.workDays}일</p>
        </div>
        <div className="bg-white rounded-xl p-5 border-2 border-gray-100 hover:border-orange-300 transition-all duration-300">
          <p className="text-sm text-gray-600 mb-2">가장 생산적인 요일</p>
          <p className="text-2xl font-black text-orange-600">{stats.summary.mostProductiveDay || '-'}</p>
        </div>
      </div>

      {/* Work Pattern */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border-2 border-gray-100">
          <h4 className="text-sm font-semibold text-gray-700 mb-4">평균 출퇴근 시간</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-sm text-gray-600">가장 이른 출근</span>
              <span className="font-semibold text-blue-600">{formatTime(stats.summary.earliestCheckIn)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <span className="text-sm text-gray-600">가장 늦은 퇴근</span>
              <span className="font-semibold text-purple-600">{formatTime(stats.summary.latestCheckOut)}</span>
            </div>
          </div>
        </div>

        {/* Day of Week Pattern */}
        <div className="bg-white rounded-xl p-6 border-2 border-gray-100">
          <h4 className="text-sm font-semibold text-gray-700 mb-4">요일별 평균 근무시간</h4>
          <div className="space-y-2">
            {dayOfWeekAverage.map((day) => (
              <div key={day.day} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-8">{day.day}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: `${(day.averageHours / 12) * 100}%` }}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-700">
                    {day.averageHours}h
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Work Chart */}
      <div className="bg-white rounded-xl p-6 border-2 border-gray-100">
        <h4 className="text-sm font-semibold text-gray-700 mb-4">일별 근무시간</h4>
        <div className="h-64 flex items-end gap-1">
          {stats.dailyStats.map((day, index) => (
            <div key={index} className="flex-1 flex flex-col items-center justify-end">
              <span className="text-xs font-medium text-gray-700 mb-1">
                {day.hours > 0 ? `${day.hours}h` : ''}
              </span>
              <div
                className="w-full bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t transition-all duration-500 hover:opacity-80"
                style={{ 
                  height: `${(day.hours / maxDailyHours) * 100}%`,
                  minHeight: day.hours > 0 ? '4px' : '0'
                }}
                title={`${day.date}: ${day.hours}시간`}
              />
              <span className="text-xs text-gray-500 mt-1 -rotate-45 origin-left whitespace-nowrap">
                {formatDate(day.date)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Pattern */}
      {stats.weeklyPattern.length > 0 && (
        <div className="bg-white rounded-xl p-6 border-2 border-gray-100">
          <h4 className="text-sm font-semibold text-gray-700 mb-4">주간 근무 패턴</h4>
          <div className="space-y-3">
            {stats.weeklyPattern.map((week, index) => (
              <div key={index} className="flex items-center gap-4">
                <span className="text-sm text-gray-600 w-20">{week.week}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-700"
                    style={{ width: `${(week.hours / maxWeeklyHours) * 100}%` }}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-700">
                    {week.hours}h
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Daily Records */}
      <div className="bg-white rounded-xl p-6 border-2 border-gray-100">
        <h4 className="text-sm font-semibold text-gray-700 mb-4">상세 근무 기록</h4>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">날짜</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">요일</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">출근</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">퇴근</th>
                <th className="text-right py-2 px-3 text-sm font-medium text-gray-600">근무시간</th>
              </tr>
            </thead>
            <tbody>
              {stats.dailyStats.filter(day => day.hours > 0).map((day, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 px-3 text-sm text-gray-800">{day.date}</td>
                  <td className="py-2 px-3 text-sm text-gray-600">{day.dayOfWeek}</td>
                  <td className="py-2 px-3 text-sm text-gray-600">
                    {day.checkIn ? new Date(day.checkIn).toLocaleTimeString('ko-KR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    }) : '-'}
                  </td>
                  <td className="py-2 px-3 text-sm text-gray-600">
                    {day.checkOut ? new Date(day.checkOut).toLocaleTimeString('ko-KR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    }) : '-'}
                  </td>
                  <td className="py-2 px-3 text-sm font-medium text-right text-emerald-600">
                    {day.hours}h
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
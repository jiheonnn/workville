'use client'

import type { MemberStatsDetail } from '@/lib/stats/calculations'
import { getCharacterColor, getCharacterLabel } from '@/lib/character-utils'

interface MemberStatsViewProps {
  stats: MemberStatsDetail
  formatDate: (date: string) => string
  variant: 'me' | 'member'
}

function formatRecordTime(timeStr: string | null) {
  if (!timeStr) {
    return '-'
  }

  const date = new Date(timeStr)
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const period = hours < 12 ? '오전' : '오후'
  const hour12 = hours % 12 || 12

  return `${period} ${String(hour12).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export default function MemberStatsView({
  stats,
  formatDate,
  variant,
}: MemberStatsViewProps) {
  const maxDailyHours = Math.max(...stats.dailyStats.map(d => d.hours), 1)
  const maxWeeklyHours = Math.max(...stats.weeklyPattern.map(w => w.hours), 1)
  const isPersonalView = variant === 'me'

  return (
    <div className="space-y-6">
      {isPersonalView ? (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-700 mb-2">내 통계</p>
              <h3 className="text-2xl font-bold text-gray-800">{stats.member.username}</h3>
            </div>

            {stats.level && (
              <div className="w-full xl:max-w-md">
                <h4 className="text-sm font-semibold text-gray-700">현재 레벨</h4>
                <p className="text-3xl font-black bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mt-2">
                  Lv.{stats.level.current}
                </p>
                <div className="mt-4">
                  <div className="w-full bg-white rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-amber-400 h-4 rounded-full transition-all duration-500"
                      style={{ width: `${stats.level.progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
                    <span>누적 {stats.level.totalWorkHours}시간</span>
                    <span>다음 레벨까지 {stats.level.hoursToNext}시간</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-700 mb-2">선택한 팀원 통계</p>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">{stats.member.username}</h3>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">레벨 {stats.member.level}</span>
                <span 
                  className="px-3 py-1 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: getCharacterColor(stats.member.characterType) }}
                >
                  {getCharacterLabel(stats.member.characterType)}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">분석 기간</p>
              <p className="text-sm font-medium text-gray-800">{stats.summary.period}</p>
            </div>
          </div>
        </div>
      )}

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
              <span className="font-semibold text-blue-600">
                {stats.summary.earliestCheckIn || '-'}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <span className="text-sm text-gray-600">가장 늦은 퇴근</span>
              <span className="font-semibold text-purple-600">
                {stats.summary.latestCheckOut || '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Day of Week Pattern */}
        <div className="bg-white rounded-xl p-6 border-2 border-gray-100">
          <h4 className="text-sm font-semibold text-gray-700 mb-4">요일별 평균 근무시간</h4>
          <div className="space-y-2">
            {stats.dayPattern.map((day) => (
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
                    {formatRecordTime(day.checkIn)}
                  </td>
                  <td className="py-2 px-3 text-sm text-gray-600">
                    {formatRecordTime(day.checkOut)}
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

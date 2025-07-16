'use client'

import { memo } from 'react'
import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

interface PersonalStats {
  dailyStats: Array<{
    date: string
    hours: number
    dayOfWeek: string
  }>
  summary: {
    totalHours: number
    averageHours: number
    workDays: number
    period: string
  }
  level: {
    current: number
    totalWorkHours: number
    hoursToNext: number
    progress: number
  }
  dayPattern: Array<{
    day: string
    averageHours: number
  }>
}

interface PersonalStatsViewProps {
  stats: PersonalStats
  formatDate: (dateString: string) => string
}

const PersonalStatsView = memo(({ stats, formatDate }: PersonalStatsViewProps) => {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 rounded-2xl shadow-md p-6 transform hover:scale-105 transition-transform duration-200">
          <h3 className="text-sm font-semibold text-gray-700">총 근무시간</h3>
          <p className="text-3xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mt-2">
            {stats.summary.totalHours}시간
          </p>
        </div>
        <div className="bg-emerald-50 rounded-2xl shadow-md p-6 transform hover:scale-105 transition-transform duration-200">
          <h3 className="text-sm font-semibold text-gray-700">평균 근무시간</h3>
          <p className="text-3xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mt-2">
            {stats.summary.averageHours}시간
          </p>
        </div>
        <div className="bg-purple-50 rounded-2xl shadow-md p-6 transform hover:scale-105 transition-transform duration-200">
          <h3 className="text-sm font-semibold text-gray-700">근무일수</h3>
          <p className="text-3xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mt-2">
            {stats.summary.workDays}일
          </p>
        </div>
        <div className="bg-amber-50 rounded-2xl shadow-md p-6 transform hover:scale-105 transition-transform duration-200">
          <h3 className="text-sm font-semibold text-gray-700">현재 레벨</h3>
          <p className="text-3xl font-black bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mt-2">
            Lv.{stats.level.current}
          </p>
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-amber-400 h-3 rounded-full transition-width duration-500"
                style={{ width: `${stats.level.progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-2 font-medium">
              다음 레벨까지 {stats.level.hoursToNext}시간
            </p>
          </div>
        </div>
      </div>

      {/* Daily Work Hours Chart */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h3 className="text-xl font-bold text-gray-800 mb-6">📈 일별 근무 시간</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.dailyStats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
            />
            <YAxis />
            <Tooltip 
              labelFormatter={(value) => `날짜: ${value}`}
              formatter={(value: any) => [`${value}시간`, '근무시간']}
            />
            <Bar dataKey="hours" fill="#3B82F6" isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Day Pattern Chart */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h3 className="text-xl font-bold text-gray-800 mb-6">📅 요일별 평균 근무시간</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.dayPattern}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip 
              formatter={(value: any) => [`${value}시간`, '평균']}
            />
            <Bar dataKey="averageHours" fill="#10B981" isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
})

PersonalStatsView.displayName = 'PersonalStatsView'

export default PersonalStatsView
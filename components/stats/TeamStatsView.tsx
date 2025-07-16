'use client'

import { memo } from 'react'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

interface TeamStats {
  members: Array<{
    id: string
    username: string
    characterType: string
    level: number
    totalHours: number
    averageHours: number
    workDays: number
  }>
  summary: {
    totalMembers: number
    totalHours: number
    averageHoursPerMember: number
    period: string
  }
  dailyActivity: Array<{
    date: string
    hours: number
    activeMembers: number
  }>
}

interface TeamStatsViewProps {
  stats: TeamStats
  formatDate: (dateString: string) => string
  getCharacterColor: (characterType: string) => string
}

const TeamStatsView = memo(({ stats, formatDate, getCharacterColor }: TeamStatsViewProps) => {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-indigo-50 rounded-2xl shadow-md p-6 transform hover:scale-105 transition-transform duration-200">
          <h3 className="text-sm font-semibold text-gray-700">팀 총 근무시간</h3>
          <p className="text-3xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mt-2">
            {stats.summary.totalHours}시간
          </p>
        </div>
        <div className="bg-pink-50 rounded-2xl shadow-md p-6 transform hover:scale-105 transition-transform duration-200">
          <h3 className="text-sm font-semibold text-gray-700">인당 평균</h3>
          <p className="text-3xl font-black bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mt-2">
            {stats.summary.averageHoursPerMember}시간
          </p>
        </div>
        <div className="bg-teal-50 rounded-2xl shadow-md p-6 transform hover:scale-105 transition-transform duration-200">
          <h3 className="text-sm font-semibold text-gray-700">팀원 수</h3>
          <p className="text-3xl font-black bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mt-2">
            {stats.summary.totalMembers}명
          </p>
        </div>
      </div>

      {/* Team Member Comparison */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h3 className="text-xl font-bold text-gray-800 mb-6">📈 팀원별 근무시간</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.members} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="username" />
            <YAxis />
            <Tooltip 
              formatter={(value: any, name: string) => [
                `${value}시간`,
                name === 'totalHours' ? '총 근무시간' : '평균'
              ]}
            />
            <Bar dataKey="totalHours" fill="#3B82F6" isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Team Activity Timeline */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h3 className="text-xl font-bold text-gray-800 mb-6">📊 팀 활동 타임라인</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={stats.dailyActivity}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
            />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip 
              labelFormatter={(value) => `날짜: ${value}`}
              formatter={(value: any, name: string) => [
                name === 'hours' ? `${value}시간` : `${value}명`,
                name === 'hours' ? '총 근무시간' : '활동 인원'
              ]}
            />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="hours" 
              stroke="#3B82F6" 
              name="총 근무시간"
              isAnimationActive={false}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="activeMembers" 
              stroke="#10B981" 
              name="활동 인원"
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Team Member Details */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h3 className="text-xl font-bold text-gray-800 mb-6">📝 팀원 상세</h3>
        <div className="overflow-x-auto rounded-xl">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  팀원
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  레벨
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  총 근무시간
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  평균 근무시간
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  근무일수
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats.members.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div 
                        className="w-10 h-10 rounded-full flex-shrink-0 shadow-md"
                        style={{ background: `linear-gradient(135deg, ${getCharacterColor(member.characterType)}, ${getCharacterColor(member.characterType)}88)` }}
                      />
                      <span className="ml-3 font-semibold text-gray-800">{member.username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 rounded-full text-sm font-bold bg-amber-100 text-amber-800">
                      Lv.{member.level}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-700">
                    {member.totalHours}시간
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-700">
                    {member.averageHours}시간
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-700">
                    {member.workDays}일
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
})

TeamStatsView.displayName = 'TeamStatsView'

export default TeamStatsView
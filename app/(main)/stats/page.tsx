'use client'

import { useState, useEffect } from 'react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

type Period = 'week' | 'month' | 'quarter'

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

export default function StatsPage() {
  const [activeTab, setActiveTab] = useState<'personal' | 'team'>('personal')
  const [period, setPeriod] = useState<Period>('week')
  const [personalStats, setPersonalStats] = useState<PersonalStats | null>(null)
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [activeTab, period])

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)

      if (activeTab === 'personal') {
        const response = await fetch(`/api/stats/personal?period=${period}`)
        if (!response.ok) throw new Error('Failed to fetch personal stats')
        const data = await response.json()
        setPersonalStats(data)
      } else {
        const response = await fetch(`/api/stats/team?period=${period}`)
        if (!response.ok) throw new Error('Failed to fetch team stats')
        const data = await response.json()
        setTeamStats(data)
      }
    } catch (err) {
      setError('통계를 불러오는데 실패했습니다.')
      console.error('Error fetching stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

  const getCharacterColor = (characterType: string) => {
    const colors: Record<string, string> = {
      character1: '#EF4444',
      character2: '#3B82F6',
      character3: '#10B981',
      character4: '#8B5CF6'
    }
    return colors[characterType] || '#6B7280'
  }

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">통계</h2>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">통계</h2>

      {/* Tab Navigation */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('personal')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'personal'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          개인 통계
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'team'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          팀 통계
        </button>

        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setPeriod('week')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === 'week'
                ? 'bg-gray-800 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            1주일
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === 'month'
                ? 'bg-gray-800 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            1개월
          </button>
          <button
            onClick={() => setPeriod('quarter')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === 'quarter'
                ? 'bg-gray-800 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            3개월
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Personal Stats */}
      {activeTab === 'personal' && personalStats && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-600">총 근무시간</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {personalStats.summary.totalHours}시간
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-600">평균 근무시간</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {personalStats.summary.averageHours}시간
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-600">근무일수</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {personalStats.summary.workDays}일
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-600">현재 레벨</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                Lv.{personalStats.level.current}
              </p>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${personalStats.level.progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  다음 레벨까지 {personalStats.level.hoursToNext}시간
                </p>
              </div>
            </div>
          </div>

          {/* Daily Work Hours Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">일별 근무 시간</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={personalStats.dailyStats}>
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
                <Bar dataKey="hours" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Day Pattern Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">요일별 평균 근무시간</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={personalStats.dayPattern}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => [`${value}시간`, '평균']}
                />
                <Bar dataKey="averageHours" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Team Stats */}
      {activeTab === 'team' && teamStats && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-600">팀 총 근무시간</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {teamStats.summary.totalHours}시간
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-600">인당 평균</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {teamStats.summary.averageHoursPerMember}시간
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-600">팀원 수</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {teamStats.summary.totalMembers}명
              </p>
            </div>
          </div>

          {/* Team Member Comparison */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">팀원별 근무시간</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={teamStats.members} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="username" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    `${value}시간`,
                    name === 'totalHours' ? '총 근무시간' : '평균'
                  ]}
                />
                <Bar dataKey="totalHours" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Team Activity Timeline */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">팀 활동 타임라인</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={teamStats.dailyActivity}>
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
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="activeMembers" 
                  stroke="#10B981" 
                  name="활동 인원"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Team Member Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">팀원 상세</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      팀원
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      레벨
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      총 근무시간
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      평균 근무시간
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      근무일수
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {teamStats.members.map((member) => (
                    <tr key={member.id}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div 
                            className="w-8 h-8 rounded-full flex-shrink-0"
                            style={{ backgroundColor: getCharacterColor(member.characterType) }}
                          />
                          <span className="ml-3 font-medium">{member.username}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        Lv.{member.level}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {member.totalHours}시간
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {member.averageHours}시간
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {member.workDays}일
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
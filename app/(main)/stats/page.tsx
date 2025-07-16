'use client'

import { useState, useEffect, useCallback } from 'react'
import PersonalStatsView from '@/components/stats/PersonalStatsView'
import TeamStatsView from '@/components/stats/TeamStatsView'

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

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }, [])


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
        <h2 className="text-3xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-6">통계</h2>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-3xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-8">통계</h2>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('personal')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              activeTab === 'personal'
                ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg shadow-emerald-600/25 scale-105'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            👤 개인 통계
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              activeTab === 'team'
                ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg shadow-emerald-600/25 scale-105'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            👥 팀 통계
          </button>

          <div className="ml-auto flex gap-2">
            <button
              onClick={() => setPeriod('week')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                period === 'week'
                  ? 'bg-gradient-to-r from-gray-700 to-gray-900 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border-2 border-gray-200'
              }`}
            >
              1주일
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                period === 'month'
                  ? 'bg-gradient-to-r from-gray-700 to-gray-900 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border-2 border-gray-200'
              }`}
            >
              1개월
            </button>
            <button
              onClick={() => setPeriod('quarter')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                period === 'quarter'
                  ? 'bg-gradient-to-r from-gray-700 to-gray-900 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border-2 border-gray-200'
              }`}
            >
              3개월
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-5 rounded-xl mb-6 border border-red-200 animate-slideIn">
            ⚠️ {error}
          </div>
        )}

        {/* Personal Stats */}
        {activeTab === 'personal' && personalStats && (
          <PersonalStatsView stats={personalStats} formatDate={formatDate} />
        )}

        {/* Team Stats */}
        {activeTab === 'team' && teamStats && (
          <TeamStatsView stats={teamStats} formatDate={formatDate} getCharacterColor={getCharacterColor} />
        )}
      </div>
    </div>
  )
}
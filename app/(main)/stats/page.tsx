'use client'

import { useState, useEffect, useCallback } from 'react'

import LeaderboardView from '@/components/stats/LeaderboardView'
import MemberStatsView from '@/components/stats/MemberStatsView'
import type {
  LeaderboardStats,
  MemberStatsDetail,
  StatsPeriod,
} from '@/lib/stats/calculations'

export default function StatsPage() {
  const [activeTab, setActiveTab] = useState<'personal' | 'ranking'>('personal')
  const [period, setPeriod] = useState<StatsPeriod>('week')
  const [personalStats, setPersonalStats] = useState<MemberStatsDetail | null>(null)
  const [leaderboardStats, setLeaderboardStats] = useState<LeaderboardStats | null>(null)
  const [memberStats, setMemberStats] = useState<MemberStatsDetail | null>(null)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [loadingPersonal, setLoadingPersonal] = useState(true)
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false)
  const [loadingMemberStats, setLoadingMemberStats] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [customEndDate, setCustomEndDate] = useState<string>('')

  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams({ period })

    if (period === 'custom' && customStartDate && customEndDate) {
      params.set('startDate', customStartDate)
      params.set('endDate', customEndDate)
    }

    return params.toString()
  }, [customEndDate, customStartDate, period])

  const fetchPersonalStats = useCallback(async () => {
    try {
      setLoadingPersonal(true)
      setError(null)

      const response = await fetch(`/api/stats/personal?${buildQueryString()}`)
      if (!response.ok) throw new Error('Failed to fetch personal stats')

      const data = (await response.json()) as MemberStatsDetail
      setPersonalStats(data)
    } catch (err) {
      setError('내 통계를 불러오는데 실패했습니다.')
      console.error('Error fetching personal stats:', err)
    } finally {
      setLoadingPersonal(false)
    }
  }, [buildQueryString])

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoadingLeaderboard(true)
      setError(null)

      const response = await fetch(`/api/stats/team?${buildQueryString()}`)
      if (!response.ok) throw new Error('Failed to fetch leaderboard')

      const data = (await response.json()) as LeaderboardStats
      setLeaderboardStats(data)

      setSelectedMemberId((currentSelectedMemberId) => {
        const memberIds = data.members.map((member) => member.id)

        if (currentSelectedMemberId && memberIds.includes(currentSelectedMemberId)) {
          return currentSelectedMemberId
        }

        return null
      })
    } catch (err) {
      setError('리더보드를 불러오는데 실패했습니다.')
      console.error('Error fetching leaderboard:', err)
    } finally {
      setLoadingLeaderboard(false)
    }
  }, [buildQueryString])

  const fetchMemberStats = useCallback(async (memberId: string) => {
    try {
      setLoadingMemberStats(true)
      setError(null)

      const response = await fetch(`/api/stats/member?userId=${memberId}&${buildQueryString()}`)
      if (!response.ok) throw new Error('Failed to fetch member stats')

      const data = (await response.json()) as MemberStatsDetail
      setMemberStats(data)
    } catch (err) {
      setError('선택한 팀원 통계를 불러오는데 실패했습니다.')
      console.error('Error fetching member stats:', err)
    } finally {
      setLoadingMemberStats(false)
    }
  }, [buildQueryString])

  useEffect(() => {
    if (period === 'custom' && (!customStartDate || !customEndDate)) {
      return
    }

    if (activeTab === 'personal') {
      void fetchPersonalStats()
    }
  }, [activeTab, customEndDate, customStartDate, fetchPersonalStats, period])

  useEffect(() => {
    if (period === 'custom' && (!customStartDate || !customEndDate)) {
      return
    }

    if (activeTab === 'ranking') {
      void fetchLeaderboard()
    }
  }, [activeTab, buildQueryString, customEndDate, customStartDate, fetchLeaderboard, period])

  useEffect(() => {
    if (period === 'custom' && (!customStartDate || !customEndDate)) {
      return
    }

    if (activeTab === 'ranking' && selectedMemberId) {
      void fetchMemberStats(selectedMemberId)
    }
  }, [
    activeTab,
    customEndDate,
    customStartDate,
    fetchMemberStats,
    period,
    selectedMemberId,
  ])

  useEffect(() => {
    if (activeTab === 'ranking' && !selectedMemberId) {
      setMemberStats(null)
    }
  }, [activeTab, selectedMemberId])

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }, [])

  const isLoading =
    activeTab === 'personal'
      ? loadingPersonal
      : loadingLeaderboard || loadingMemberStats

  if (isLoading && activeTab === 'personal' && !personalStats) {
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
            👤 내 통계
          </button>
          <button
            onClick={() => setActiveTab('ranking')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              activeTab === 'ranking'
                ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg shadow-emerald-600/25 scale-105'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            🏆 랭킹
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
            <button
              onClick={() => setPeriod('custom')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                period === 'custom'
                  ? 'bg-gradient-to-r from-gray-700 to-gray-900 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border-2 border-gray-200'
              }`}
            >
              기간 설정
            </button>
          </div>
        </div>

        {/* Custom Date Range Inputs */}
        {period === 'custom' && (
          <div className="flex gap-4 mb-6 p-4 bg-gray-50 rounded-xl animate-slideIn">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-800"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-800"
              />
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 p-5 rounded-xl mb-6 border border-red-200 animate-slideIn">
            ⚠️ {error}
          </div>
        )}

        {isLoading && activeTab === 'ranking' && !leaderboardStats && (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
          </div>
        )}

        {activeTab === 'personal' && personalStats && (
          <MemberStatsView stats={personalStats} formatDate={formatDate} variant="me" />
        )}

        {activeTab === 'ranking' && leaderboardStats && (
          <div className="space-y-6 animate-fadeIn">
            <LeaderboardView
              selectedMemberId={selectedMemberId}
              stats={leaderboardStats}
              onSelectMember={(memberId) => {
                setSelectedMemberId((currentSelectedMemberId) =>
                  currentSelectedMemberId === memberId ? null : memberId
                )
              }}
            />

            {memberStats && (
              <MemberStatsView
                stats={memberStats}
                formatDate={formatDate}
                variant={
                  memberStats.member.id === leaderboardStats.currentUserId ? 'me' : 'member'
                }
              />
            )}

            {!memberStats && (
              <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center">
                <p className="text-lg font-semibold text-gray-700">팀원을 선택하면 상세 통계가 펼쳐집니다.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { CharacterType } from '@/lib/types'
import CalendarView from '@/components/work-log/CalendarView'
import { Button } from '@/components/ui/button'

interface Profile {
  id: string
  username: string
  character_type: CharacterType
}

interface WorkLog {
  id: string
  date: string
  content: string
  created_at: string
  user_id: string
  start_time: string | null
  end_time: string | null
  profiles: Profile
}

export default function LogsPage() {
  const [logs, setLogs] = useState<WorkLog[]>([])
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  
  // Filter states
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | undefined>()

  useEffect(() => {
    fetchLogs()
  }, [selectedUserId, startDate, endDate])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      setError(null)

      // Build query params
      const params = new URLSearchParams()
      if (selectedUserId) params.append('userId', selectedUserId)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      
      const response = await fetch(`/api/team-logs?${params}`)
      if (!response.ok) throw new Error('Failed to fetch logs')
      
      const data = await response.json()
      setLogs(data.logs)
      setUsers(data.users)
    } catch (err) {
      setError('업무일지를 불러오는데 실패했습니다.')
      console.error('Error fetching logs:', err)
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setSelectedUserId('')
    setStartDate('')
    setEndDate('')
    setSelectedCalendarDate(undefined)
  }

  const handleCalendarDateSelect = (date: Date) => {
    setSelectedCalendarDate(date)
    const dateStr = date.toISOString().split('T')[0]
    setStartDate(dateStr)
    setEndDate(dateStr)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    })
  }

  const formatTime = (timeString: string | null) => {
    if (!timeString) return 'N/A'
    const date = new Date(timeString)
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  }

  const getCharacterEmoji = (characterType: CharacterType) => {
    const emojis: Record<CharacterType, string> = {
      character1: '🔴',
      character2: '🔵',
      character3: '🟢',
      character4: '🟣'
    }
    return emojis[characterType] || '⚪'
  }

  if (loading && logs.length === 0) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">업무일지</h2>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-100 rounded-lg h-32 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">업무일지</h2>
        <div className="flex gap-2">
          <Button
            onClick={() => setViewMode('list')}
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
          >
            목록 보기
          </Button>
          <Button
            onClick={() => setViewMode('calendar')}
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            size="sm"
          >
            캘린더 보기
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">팀원</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            >
              <option value="">전체</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {getCharacterEmoji(user.character_type)} {user.username}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">시작일</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">종료일</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full p-2 text-gray-600 hover:text-gray-800 border rounded-lg hover:bg-gray-50"
            >
              필터 초기화
            </button>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Calendar or List View */}
      {viewMode === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <CalendarView 
              logs={logs}
              onDateSelect={handleCalendarDateSelect}
              selectedDate={selectedCalendarDate}
            />
          </div>
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-bold text-xl text-gray-800">
              {selectedCalendarDate 
                ? formatDate(selectedCalendarDate.toISOString())
                : '날짜를 선택하세요'}
            </h3>
            {selectedCalendarDate && (
              logs.filter(log => log.date === selectedCalendarDate.toISOString().split('T')[0])
                .length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-12 text-center">
                    <p className="text-gray-800">이 날짜에 작성된 업무일지가 없습니다.</p>
                  </div>
                ) : (
                  logs.filter(log => log.date === selectedCalendarDate.toISOString().split('T')[0])
                    .map(log => (
                      <div key={log.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden relative">
                                <Image src={`/characters/${log.profiles.character_type}/working_1.png`} alt={log.profiles.username} fill className="object-cover" />
                              </div>
                              <div>
                                <h3 className="font-bold text-lg text-gray-800">{log.profiles.username}</h3>
                                <p className="text-sm text-gray-800 font-medium">{formatDate(log.date)}</p>
                                <div className="text-xs text-gray-600 font-medium mt-1">
                                  <span>출근: {formatTime(log.start_time)}</span>
                                  <span className="mx-2">|</span>
                                  <span>퇴근: {formatTime(log.end_time)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="prose prose-sm max-w-none">
                            <pre className="whitespace-pre-wrap font-sans text-gray-900 bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-xl overflow-auto max-h-96 border border-gray-200">
                              {log.content}
                            </pre>
                          </div>
                        </div>
                      </div>
                    ))
                )
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {logs.length === 0 ? (
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-12 text-center">
              <p className="text-gray-800 text-lg font-medium">📄 해당 기간에 작성된 업무일지가 없습니다.</p>
            </div>
          ) : (
            logs.map(log => (
              <div key={log.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden relative">
                        <Image src={`/characters/${log.profiles.character_type}/working_1.png`} alt={log.profiles.username} fill className="object-cover" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">{log.profiles.username}</h3>
                        <p className="text-sm text-gray-800 font-medium">{formatDate(log.date)}</p>
                        <div className="text-xs text-gray-600 font-medium mt-1">
                          <span>출근: {formatTime(log.start_time)}</span>
                          <span className="mx-2">|</span>
                          <span>퇴근: {formatTime(log.end_time)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-gray-900 bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-xl overflow-auto max-h-96 border border-gray-200">
                      {log.content}
                    </pre>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

        {/* Loading more indicator */}
        {loading && logs.length > 0 && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        )}
    </div>

  )
}
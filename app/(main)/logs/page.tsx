'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { CharacterType } from '@/lib/types'
import { getCharacterEmoji, getCharacterImagePath } from '@/lib/character-utils'
import { validateWorkSessionEditWindow } from '@/lib/work-sessions/validation'
import CalendarView from '@/components/work-log/CalendarView'
import WorkLogDisplay from '@/components/work-log/WorkLogDisplay'
import WorkSessionEditModal from '@/components/work-log/WorkSessionEditModal'

interface Profile {
  id: string
  username: string
  character_type: CharacterType | null
}

interface WorkSession {
  id: string
  date: string
  check_in_time: string
  check_out_time: string | null
  duration_minutes: number | null
  break_minutes?: number | null
}

interface WorkLog {
  id: string
  date: string
  content: string
  todos?: any[]
  completed_todos?: any[]
  roi_high?: string
  roi_low?: string
  tomorrow_priority?: string
  feedback?: string
  created_at: string
  user_id: string
  start_time: string | null
  end_time: string | null
  work_sessions: WorkSession[]
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
  const [allLogs, setAllLogs] = useState<WorkLog[]>([]) // Store all logs for calendar view
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [canManageOwnRecords, setCanManageOwnRecords] = useState(false)
  const [editingSession, setEditingSession] = useState<WorkSession | null>(null)
  const calendarDataFetchedRef = useRef(false)

  const fetchLogs = useCallback(async () => {
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
      setCurrentUserId(typeof data.currentUserId === 'string' ? data.currentUserId : null)
      setCanManageOwnRecords(data.canManageOwnRecords === true)
    } catch (err) {
      setError('업무일지를 불러오는데 실패했습니다.')
      console.error('Error fetching logs:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedUserId, startDate, endDate])

  const fetchAllLogs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch all logs without any filters for calendar view
      const response = await fetch('/api/team-logs')
      if (!response.ok) throw new Error('Failed to fetch logs')
      
      const data = await response.json()
      setAllLogs(data.logs)
      setUsers(data.users)
      setCurrentUserId(typeof data.currentUserId === 'string' ? data.currentUserId : null)
      setCanManageOwnRecords(data.canManageOwnRecords === true)
    } catch (err) {
      setError('업무일지를 불러오는데 실패했습니다.')
      console.error('Error fetching all logs:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchLogs()
  }, [fetchLogs])

  // Fetch all logs when switching to calendar view (only once)
  useEffect(() => {
    if (viewMode !== 'calendar' || calendarDataFetchedRef.current) {
      return
    }

    calendarDataFetchedRef.current = true
    void fetchAllLogs()
  }, [fetchAllLogs, viewMode])

  const clearFilters = () => {
    setSelectedUserId('')
    setStartDate('')
    setEndDate('')
    setSelectedCalendarDate(undefined)
  }

  const handleCalendarDateSelect = (date: Date) => {
    setSelectedCalendarDate(date)
    // In calendar mode, we don't update the filters to keep all logs visible
    // The filtering happens on the client side only
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


  const calculateTotalDuration = (sessions: WorkSession[]) => {
    const totalMinutes = sessions.reduce((total, session) => {
      return total + (session.duration_minutes || 0)
    }, 0)

    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60

    return `${hours}시간 ${minutes}분`
  }

  const renderWorkSessions = (sessions: WorkSession[], isOwnLog: boolean) => {
    if (!sessions || sessions.length === 0) return 'N/A'
    
    return sessions.map((session, index) => (
      <div key={session.id || index} className="flex flex-wrap items-center gap-1 text-xs">
        <span>출근: {formatTime(session.check_in_time)}</span>
        <span className="mx-1">→</span>
        <span>퇴근: {formatTime(session.check_out_time)}</span>
        {canEditSession(session, isOwnLog) && (
          <button
            type="button"
            onClick={() => setEditingSession(session)}
            className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
          >
            <span aria-hidden="true">✎</span>
            수정
          </button>
        )}
      </div>
    ))
  }

  const canEditSession = (session: WorkSession, isOwnLog: boolean) => {
    return (
      isOwnLog &&
      canManageOwnRecords &&
      Boolean(session.id) &&
      Boolean(session.check_out_time) &&
      validateWorkSessionEditWindow(session.date).ok
    )
  }

  const refreshAfterSessionEdit = async () => {
    await fetchLogs()

    if (viewMode === 'calendar') {
      await fetchAllLogs()
    }
  }

  const renderLogCard = (log: WorkLog) => {
    const isOwnLog = currentUserId === log.user_id
    const sessions = log.work_sessions || []

    return (
      <div key={log.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden relative">
                <Image src={getCharacterImagePath(log.profiles.character_type, 'working', 1)} alt={log.profiles.username} fill className="object-cover" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-800">{log.profiles.username}</h3>
                <p className="text-sm text-gray-800 font-medium">{formatDate(log.date)}</p>
                <div className="text-sm text-gray-600 font-medium mt-1">
                  <div className="mb-1">총 근무시간: {calculateTotalDuration(log.work_sessions || [])}</div>
                  <div className="space-y-1">
                    {renderWorkSessions(sessions, isOwnLog)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="prose prose-sm max-w-none">
            <WorkLogDisplay
              content={log.content}
              todos={log.todos}
              completed_todos={log.completed_todos}
              roi_high={log.roi_high}
              roi_low={log.roi_low}
              tomorrow_priority={log.tomorrow_priority}
              feedback={log.feedback}
            />
          </div>
        </div>
      </div>
    )
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
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
              viewMode === 'list' 
                ? 'bg-gradient-to-r from-gray-700 to-gray-900 text-white shadow-md' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            목록 보기
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
              viewMode === 'calendar' 
                ? 'bg-gradient-to-r from-gray-700 to-gray-900 text-white shadow-md' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            캘린더 보기
          </button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-gradient-to-r from-white to-gray-50 rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">🔍</span>
          <h3 className="text-sm font-semibold text-gray-700">검색 필터</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">팀원</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200 text-gray-800 font-medium"
            >
              <option value="">전체 팀원</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {getCharacterEmoji(user.character_type)} {user.username}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">시작일</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200 text-gray-800 font-medium"
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">종료일</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200 text-gray-800 font-medium"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full px-4 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 hover:text-gray-700 transition-all duration-200 text-sm font-medium"
            >
              초기화
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
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <div className="xl:col-span-3">
            <CalendarView 
              logs={allLogs.length > 0 ? allLogs : logs}
              onDateSelect={handleCalendarDateSelect}
              selectedDate={selectedCalendarDate}
            />
          </div>
          <div className="xl:col-span-2 space-y-4">
            <h3 className="font-bold text-xl text-gray-800">
              {selectedCalendarDate 
                ? formatDate(selectedCalendarDate.toISOString())
                : '날짜를 선택하세요'}
            </h3>
            {selectedCalendarDate && (
              (allLogs.length > 0 ? allLogs : logs).filter(log => {
                const year = selectedCalendarDate.getFullYear()
                const month = String(selectedCalendarDate.getMonth() + 1).padStart(2, '0')
                const day = String(selectedCalendarDate.getDate()).padStart(2, '0')
                const dateStr = `${year}-${month}-${day}`
                return log.date === dateStr
              }).length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-12 text-center">
                    <p className="text-gray-800">이 날짜에 작성된 업무일지가 없습니다.</p>
                  </div>
                ) : (
                  (allLogs.length > 0 ? allLogs : logs).filter(log => {
                    const year = selectedCalendarDate.getFullYear()
                    const month = String(selectedCalendarDate.getMonth() + 1).padStart(2, '0')
                    const day = String(selectedCalendarDate.getDate()).padStart(2, '0')
                    const dateStr = `${year}-${month}-${day}`
                    return log.date === dateStr
                  }).map(renderLogCard)
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
            logs.map(renderLogCard)
          )}
        </div>
      )}

        {/* Loading more indicator */}
        {loading && logs.length > 0 && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        )}
      <WorkSessionEditModal
        session={editingSession}
        onClose={() => setEditingSession(null)}
        onSaved={refreshAfterSessionEdit}
      />
    </div>

  )
}

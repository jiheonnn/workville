'use client'

import { useMemo, useCallback } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { CharacterType } from '@/lib/types'

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
  profiles: Profile
}

interface CalendarViewProps {
  logs: WorkLog[]
  onDateSelect: (date: Date) => void
  selectedDate?: Date
}

export default function CalendarView({ logs, onDateSelect, selectedDate }: CalendarViewProps) {
  // Use useMemo to optimize date calculation
  const logsByDate = useMemo(() => {
    const grouped: Record<string, WorkLog[]> = {}
    logs.forEach(log => {
      // Ensure we're using the correct date without timezone issues
      const dateStr = log.date
      if (!grouped[dateStr]) {
        grouped[dateStr] = []
      }
      grouped[dateStr].push(log)
    })
    return grouped
  }, [logs])

  // Function to get logs for a specific date
  const getLogsForDate = useCallback((date: Date) => {
    // Convert date to YYYY-MM-DD format matching the database
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    return logsByDate[dateStr] || []
  }, [logsByDate])

  // Custom tile content to show team member avatars
  const tileContent = useCallback(({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null
    
    const logsForDate = getLogsForDate(date)
    if (logsForDate.length === 0) return null

    // Get unique users for this date
    const uniqueUsers = Array.from(new Set(logsForDate.map(log => log.user_id)))
      .map(userId => logsForDate.find(log => log.user_id === userId)!)
      .slice(0, 4) // Show max 4 avatars

    return (
      <div className="mt-8 flex flex-wrap justify-center gap-0.5">
        {uniqueUsers.map((log) => (
          <div key={log.user_id} className="relative">
            <img 
              src={`/characters/${log.profiles.character_type}/normal.png`}
              alt={log.profiles.username}
              className="w-7 h-7 rounded-full border-2 border-white shadow-sm"
              title={log.profiles.username}
            />
          </div>
        ))}
        {uniqueUsers.length > 4 && (
          <div className="w-7 h-7 rounded-full bg-gray-400 flex items-center justify-center text-xs font-bold text-white shadow-sm">
            +{uniqueUsers.length - 4}
          </div>
        )}
      </div>
    )
  }, [getLogsForDate])

  // Custom tile className for dates with logs
  const tileClassName = useCallback(({ date, view }: { date: Date; view: string }) => {
    if (view === 'month' && getLogsForDate(date).length > 0) {
      return 'has-logs'
    }
    return null
  }, [getLogsForDate])

  return (
    <div className="calendar-wrapper bg-gradient-to-br from-white to-gray-50 p-6 rounded-2xl shadow-xl">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span className="text-2xl">📅</span>
          업무일지 캘린더
        </h3>
        <p className="text-sm text-gray-600 mt-1">날짜를 클릭하여 업무일지를 확인하세요</p>
      </div>
      <Calendar
        onChange={(value) => {
          if (value instanceof Date) {
            onDateSelect(value)
          }
        }}
        value={selectedDate}
        tileContent={tileContent}
        tileClassName={tileClassName}
        locale="ko-KR"
        formatShortWeekday={(locale, date) => ['일', '월', '화', '수', '목', '금', '토'][date.getDay()]}
        formatMonthYear={(locale, date) => `${date.getFullYear()}년 ${date.getMonth() + 1}월`}
        className="rounded-lg shadow-inner border-0"
        navigationLabel={({ label }) => (
          <span className="flex items-center justify-center gap-2">
            {label}
          </span>
        )}
        prevLabel={<span className="text-xl">‹</span>}
        nextLabel={<span className="text-xl">›</span>}
        prev2Label={<span className="text-xl">«</span>}
        next2Label={<span className="text-xl">»</span>}
      />
    </div>
  )
}
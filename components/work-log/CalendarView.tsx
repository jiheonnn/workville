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
  const logDates = useMemo(() => {
    return new Set(logs.map(log => log.date))
  }, [logs])

  // Function to check if a date has logs
  const hasLogsOnDate = useCallback((date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return logDates.has(dateStr)
  }, [logDates])

  // Custom tile content to show indicator for dates with logs
  const tileContent = useCallback(({ date, view }: { date: Date; view: string }) => {
    if (view === 'month' && hasLogsOnDate(date)) {
      return (
        <div className="flex justify-center mt-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        </div>
      )
    }
    return null
  }, [hasLogsOnDate])

  // Custom tile className for dates with logs
  const tileClassName = useCallback(({ date, view }: { date: Date; view: string }) => {
    if (view === 'month' && hasLogsOnDate(date)) {
      return 'has-logs'
    }
    return null
  }, [hasLogsOnDate])

  return (
    <div className="calendar-wrapper">
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
        className="rounded-lg shadow border-0"
      />
    </div>
  )
}
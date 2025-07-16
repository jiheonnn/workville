'use client'

import { useState, useEffect } from 'react'
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
  const [logDates, setLogDates] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Extract dates that have logs
    const dates = new Set(logs.map(log => log.date))
    setLogDates(dates)
  }, [logs])

  // Function to check if a date has logs
  const hasLogsOnDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return logDates.has(dateStr)
  }

  // Custom tile content to show indicator for dates with logs
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month' && hasLogsOnDate(date)) {
      return (
        <div className="flex justify-center mt-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        </div>
      )
    }
    return null
  }

  // Custom tile className for dates with logs
  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month' && hasLogsOnDate(date)) {
      return 'has-logs'
    }
    return null
  }

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
      
      <style jsx global>{`
        .calendar-wrapper .react-calendar {
          width: 100%;
          background: white;
          border: none;
          font-family: inherit;
          line-height: 1.5;
          padding: 20px;
        }
        
        .calendar-wrapper .react-calendar__tile {
          height: 60px;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
          padding: 5px;
          position: relative;
        }
        
        .calendar-wrapper .react-calendar__tile--active {
          background: #10b981;
          color: white;
        }
        
        .calendar-wrapper .react-calendar__tile--active:enabled:hover,
        .calendar-wrapper .react-calendar__tile--active:enabled:focus {
          background: #059669;
        }
        
        .calendar-wrapper .react-calendar__tile--now {
          background: #f3f4f6;
        }
        
        .calendar-wrapper .react-calendar__tile.has-logs {
          font-weight: 600;
        }
        
        .calendar-wrapper .react-calendar__month-view__days__day--weekend {
          color: #dc2626;
        }
        
        .calendar-wrapper .react-calendar__navigation button {
          font-size: 1.1rem;
          color: #374151;
        }
        
        .calendar-wrapper .react-calendar__navigation button:enabled:hover,
        .calendar-wrapper .react-calendar__navigation button:enabled:focus {
          background-color: #f3f4f6;
        }
      `}</style>
    </div>
  )
}
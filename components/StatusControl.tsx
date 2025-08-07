'use client'

import { useEffect, useState } from 'react'
import { useVillageStore } from '@/lib/stores/village-store'
import { UserStatus } from '@/lib/types'
import WorkLogConfirmModal from '@/components/work-log/WorkLogConfirmModal'

export default function StatusControl() {
  const [showWorkLogModal, setShowWorkLogModal] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const { 
    currentUserStatus, 
    todaySessions,
    totalDurationMinutes,
    isLoading, 
    error,
    fetchCurrentStatus,
    updateMyStatus 
  } = useVillageStore()

  useEffect(() => {
    fetchCurrentStatus()
    
    // Check for existing work session and set checkInDate
    const initializeCheckInDate = async () => {
      try {
        const sessionResponse = await fetch('/api/work-sessions/today')
        if (sessionResponse.ok) {
          const { session } = await sessionResponse.json()
          if (session && session.date && !session.check_out_time) {
            // Active session found, set the check-in date
            const { setCheckInDate } = await import('@/lib/stores/work-log-store').then(m => m.useWorkLogStore.getState())
            setCheckInDate(session.date)
            console.log('Initialized checkInDate from existing session:', session.date)
          }
        }
      } catch (error) {
        console.error('Failed to initialize checkInDate:', error)
      }
    }
    
    initializeCheckInDate()
    
    // Update time every second for real-time display
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])

  const handleStatusChange = async (newStatus: UserStatus) => {
    console.log('handleStatusChange called with:', newStatus)
    console.log('Current status:', currentUserStatus)
    console.log('isLoading:', isLoading)
    
    if (isLoading || currentUserStatus === newStatus) {
      console.log('Returning early - isLoading or same status')
      return
    }
    
    // If changing from working or break to home, show work log modal
    if ((currentUserStatus === 'working' || currentUserStatus === 'break') && newStatus === 'home') {
      console.log('Showing work log modal')
      setShowWorkLogModal(true)
      return
    }
    
    console.log('Calling updateMyStatus...')
    const success = await updateMyStatus(newStatus)
    console.log('updateMyStatus result:', success)
    if (success) {
      // If changing to working status, check for existing session or create new work log
      if (newStatus === 'working') {
        try {
          const today = new Date().toISOString().split('T')[0]
          
          // Check if there's already an ACTIVE work session (not checked out)
          const sessionResponse = await fetch('/api/work-sessions/today')
          let checkInDate = today
          
          if (sessionResponse.ok) {
            const { session } = await sessionResponse.json()
            // Only use existing session date if it's still active (no check_out_time)
            if (session && session.date && !session.check_out_time) {
              // Use the existing session's date (working overnight case)
              checkInDate = session.date
              console.log('Continuing existing session from:', checkInDate)
            } else {
              // No active session, use today for new session
              console.log('Starting new session with today:', today)
            }
          }
          
          // Set the check-in date in the work log store
          const { setCheckInDate } = await import('@/lib/stores/work-log-store').then(m => m.useWorkLogStore.getState())
          setCheckInDate(checkInDate)
          
          // Create or update work log for the check-in date
          await fetch('/api/work-logs', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              date: checkInDate,
              content: '',
              todos: [],
              completed_todos: [],
              roi_high: '',
              roi_low: '',
              tomorrow_priority: '',
              feedback: ''
            }),
          })
          console.log('Work log created/updated for date:', checkInDate)
        } catch (error) {
          console.error('Failed to create work log:', error)
        }
      }
      
      console.log(`Status changed to ${newStatus}`)
    } else {
      console.error('Failed to update status')
    }
  }

  const handleWorkLogSubmit = async () => {
    // After work log is saved, update status to home
    const success = await updateMyStatus('home')
    if (success) {
      setShowWorkLogModal(false)
      // Clear the check-in date when going home
      const { setCheckInDate } = await import('@/lib/stores/work-log-store').then(m => m.useWorkLogStore.getState())
      setCheckInDate(null)
    }
  }

  const handleWorkLogSkip = () => {
    // User chose to cancel, just close modal and maintain current status
    setShowWorkLogModal(false)
    // Don't update status, keep the current state (working or break)
  }

  const getButtonStyle = (status: UserStatus) => {
    const isActive = currentUserStatus === status
    const baseStyle = "px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2"
    
    if (isActive) {
      switch (status) {
        case 'working':
          return `${baseStyle} bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 scale-105 border-2 border-blue-400`
        case 'break':
          return `${baseStyle} bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/25 scale-105 border-2 border-purple-400`
        case 'home':
          return `${baseStyle} bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg shadow-gray-500/25 scale-105 border-2 border-gray-400`
      }
    }
    
    return `${baseStyle} bg-white hover:bg-gray-50 text-gray-600 border-2 border-gray-200 hover:border-gray-300 hover:shadow-md`
  }

  const getStatusIcon = (status: UserStatus) => {
    switch (status) {
      case 'working':
        return '💼'
      case 'break':
        return '☕'
      case 'home':
        return '🏠'
    }
  }

  const getStatusText = (status: UserStatus) => {
    switch (status) {
      case 'working':
        return '출근'
      case 'break':
        return '휴식'
      case 'home':
        return '퇴근'
    }
  }

  // Calculate today's work time
  const getTodayWorkTime = () => {
    let totalMinutes = totalDurationMinutes
    
    // If currently working (not on break), add time since last status change
    const activeSession = todaySessions.find(session => !session.check_out_time)
    if (activeSession && activeSession.check_in_time && currentUserStatus === 'working') {
      // Only count time if actually working, not on break
      const checkInTime = new Date(activeSession.check_in_time)
      const currentWorkingMinutes = Math.floor((currentTime.getTime() - checkInTime.getTime()) / (1000 * 60))
      
      // Note: The server already handles break time subtraction,
      // but for real-time display we need to calculate it here too
      // This is a simplified calculation for display purposes
      totalMinutes = totalDurationMinutes + currentWorkingMinutes
    }
    // If on break, don't add any additional time
    
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return `${hours}시간 ${minutes}분`
  }

  // Get the latest check-in time
  const getLatestCheckInTime = () => {
    if (!todaySessions || todaySessions.length === 0) return null
    
    // Find the most recent session
    const latestSession = todaySessions[todaySessions.length - 1]
    return latestSession?.check_in_time
  }

  return (
    <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl p-10 border border-gray-100/50 animate-fadeIn">
      <h2 className="text-2xl font-black mb-6 bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
        근무 상태 관리
      </h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 animate-slideIn">
          {error}
        </div>
      )}
      
      <div className="space-y-6">
        <div className="flex flex-col gap-3 min-w-0">
          <button
            onClick={() => handleStatusChange('working')}
            disabled={isLoading}
            className={getButtonStyle('working')}
          >
            <span className="text-xl">{getStatusIcon('working')}</span>
            <span>{getStatusText('working')}</span>
          </button>
          
          <button
            onClick={() => handleStatusChange('break')}
            disabled={isLoading}
            className={getButtonStyle('break')}
          >
            <span className="text-xl">{getStatusIcon('break')}</span>
            <span>{getStatusText('break')}</span>
          </button>
          
          <button
            onClick={() => handleStatusChange('home')}
            disabled={isLoading}
            className={getButtonStyle('home')}
          >
            <span className="text-xl">{getStatusIcon('home')}</span>
            <span>{getStatusText('home')}</span>
          </button>
        </div>
        
        <div className="pt-6 border-t-2 border-gray-100">
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-semibold whitespace-nowrap">오늘 근무 시간</span>
              <span className="font-black text-lg bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent whitespace-nowrap">
                {getTodayWorkTime()}
              </span>
            </div>
            
            {getLatestCheckInTime() && (
              <div className="mt-3 text-xs text-gray-600 font-medium flex items-center gap-2">
                <span className="text-emerald-600">⏰</span>
                최근 출근: {new Date(getLatestCheckInTime()!).toLocaleTimeString('ko-KR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <WorkLogConfirmModal
        isOpen={showWorkLogModal}
        onClose={handleWorkLogSkip}
        onConfirm={handleWorkLogSubmit}
      />
    </div>
  )
}
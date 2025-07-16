'use client'

import { useEffect, useState } from 'react'
import { useVillageStore } from '@/lib/stores/village-store'
import { UserStatus } from '@/lib/types'
import WorkLogModal from '@/components/work-log/WorkLogModal'

export default function StatusControl() {
  const [showWorkLogModal, setShowWorkLogModal] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const { 
    currentUserStatus, 
    todaySession,
    isLoading, 
    error,
    fetchCurrentStatus,
    updateMyStatus 
  } = useVillageStore()

  useEffect(() => {
    fetchCurrentStatus()
    
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
    
    // If changing from working to home, show work log modal
    if (currentUserStatus === 'working' && newStatus === 'home') {
      console.log('Showing work log modal')
      setShowWorkLogModal(true)
      return
    }
    
    console.log('Calling updateMyStatus...')
    const success = await updateMyStatus(newStatus)
    console.log('updateMyStatus result:', success)
    if (success) {
      // You could add a toast notification here
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
    }
  }

  const handleWorkLogSkip = async () => {
    // User chose to skip work log, just update status
    const success = await updateMyStatus('home')
    if (success) {
      setShowWorkLogModal(false)
    }
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
    if (!todaySession) return '0시간 0분'
    
    let totalMinutes = 0
    
    if (todaySession.duration_minutes) {
      totalMinutes = todaySession.duration_minutes
    } else if (todaySession.check_in_time && (currentUserStatus === 'working' || currentUserStatus === 'break')) {
      // Currently working or on break, calculate time since check-in
      const checkInTime = new Date(todaySession.check_in_time)
      totalMinutes = Math.floor((currentTime.getTime() - checkInTime.getTime()) / (1000 * 60))
    }
    
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return `${hours}시간 ${minutes}분`
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
            
            {todaySession?.check_in_time && (
              <div className="mt-3 text-xs text-gray-600 font-medium flex items-center gap-2">
                <span className="text-emerald-600">⏰</span>
                출근 시간: {new Date(todaySession.check_in_time).toLocaleTimeString('ko-KR')}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <WorkLogModal
        isOpen={showWorkLogModal}
        onClose={handleWorkLogSkip}
        onSubmit={handleWorkLogSubmit}
      />
    </div>
  )
}
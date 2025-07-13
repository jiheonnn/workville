'use client'

import { useEffect, useState } from 'react'
import { useVillageStore } from '@/lib/stores/village-store'
import { UserStatus } from '@/lib/types'
import WorkLogModal from '@/components/work-log/WorkLogModal'

export default function StatusControl() {
  const [showWorkLogModal, setShowWorkLogModal] = useState(false)
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
  }, [])

  const handleStatusChange = async (newStatus: UserStatus) => {
    if (isLoading || currentUserStatus === newStatus) return
    
    // If changing from working to home, show work log modal
    if (currentUserStatus === 'working' && newStatus === 'home') {
      setShowWorkLogModal(true)
      return
    }
    
    const success = await updateMyStatus(newStatus)
    if (success) {
      // You could add a toast notification here
      console.log(`Status changed to ${newStatus}`)
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
    const baseStyle = "px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2"
    
    if (isActive) {
      switch (status) {
        case 'working':
          return `${baseStyle} bg-blue-600 text-white shadow-lg scale-105`
        case 'break':
          return `${baseStyle} bg-purple-600 text-white shadow-lg scale-105`
        case 'home':
          return `${baseStyle} bg-gray-600 text-white shadow-lg scale-105`
      }
    }
    
    return `${baseStyle} bg-gray-200 hover:bg-gray-300 text-gray-700`
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
    } else if (todaySession.check_in_time && currentUserStatus === 'working') {
      // Currently working, calculate time since check-in
      const checkInTime = new Date(todaySession.check_in_time)
      const now = new Date()
      totalMinutes = Math.floor((now.getTime() - checkInTime.getTime()) / (1000 * 60))
    }
    
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return `${hours}시간 ${minutes}분`
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold mb-4">근무 상태 관리</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <div className="space-y-4">
        <div className="flex gap-3">
          <button
            onClick={() => handleStatusChange('working')}
            disabled={isLoading}
            className={getButtonStyle('working')}
          >
            <span>{getStatusIcon('working')}</span>
            <span>{getStatusText('working')}</span>
          </button>
          
          <button
            onClick={() => handleStatusChange('break')}
            disabled={isLoading}
            className={getButtonStyle('break')}
          >
            <span>{getStatusIcon('break')}</span>
            <span>{getStatusText('break')}</span>
          </button>
          
          <button
            onClick={() => handleStatusChange('home')}
            disabled={isLoading}
            className={getButtonStyle('home')}
          >
            <span>{getStatusIcon('home')}</span>
            <span>{getStatusText('home')}</span>
          </button>
        </div>
        
        <div className="pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">오늘 근무 시간:</span>
            <span className="font-semibold text-lg">{getTodayWorkTime()}</span>
          </div>
          
          {todaySession?.check_in_time && (
            <div className="mt-2 text-sm text-gray-500">
              출근 시간: {new Date(todaySession.check_in_time).toLocaleTimeString('ko-KR')}
            </div>
          )}
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
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Period = 'week' | 'month' | 'quarter' | 'custom'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query params
    const { searchParams } = new URL(request.url)
    const period = (searchParams.get('period') || 'week') as Period
    const customStartDate = searchParams.get('startDate')
    const customEndDate = searchParams.get('endDate')

    // Calculate date range
    let endDate = new Date()
    let startDate = new Date()
    
    if (period === 'custom' && customStartDate && customEndDate) {
      startDate = new Date(customStartDate)
      endDate = new Date(customEndDate)
    } else {
      switch (period) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7)
          break
        case 'month':
          startDate.setDate(endDate.getDate() - 30)
          break
        case 'quarter':
          startDate.setDate(endDate.getDate() - 90)
          break
      }
    }

    // Get user profile for level info
    const { data: profile } = await supabase
      .from('profiles')
      .select('level, total_work_hours')
      .eq('id', user.id)
      .single()

    // Get daily work hours
    const { data: sessions, error: sessionsError } = await supabase
      .from('work_sessions')
      .select('date, duration_minutes')
      .eq('user_id', user.id)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: true })

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError)
      return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 })
    }

    // Aggregate daily hours
    const dailyHoursMap = new Map<string, number>()
    
    // Initialize all dates in range with 0
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      dailyHoursMap.set(currentDate.toISOString().split('T')[0], 0)
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Fill in actual work hours
    sessions?.forEach(session => {
      if (session.duration_minutes) {
        const hours = session.duration_minutes / 60
        dailyHoursMap.set(session.date, (dailyHoursMap.get(session.date) || 0) + hours)
      }
    })

    // Convert to array format for charts
    const dailyStats = Array.from(dailyHoursMap.entries()).map(([date, hours]) => ({
      date,
      hours: Math.round(hours * 10) / 10, // Round to 1 decimal
      dayOfWeek: new Date(date).toLocaleDateString('ko-KR', { weekday: 'short' })
    }))

    // Calculate aggregates
    const totalHours = dailyStats.reduce((sum, day) => sum + day.hours, 0)
    const workDays = dailyStats.filter(day => day.hours > 0).length
    const averageHours = workDays > 0 ? totalHours / workDays : 0

    // Level progress
    const currentLevel = profile?.level || 1
    const totalWorkHours = profile?.total_work_hours || 0
    const hoursForCurrentLevel = (currentLevel - 1) * 8
    const hoursForNextLevel = currentLevel * 8
    const hoursToNextLevel = Math.max(0, hoursForNextLevel - totalWorkHours)
    const levelProgress = ((totalWorkHours - hoursForCurrentLevel) / 8) * 100

    // Day of week pattern
    const dayPattern = ['일', '월', '화', '수', '목', '금', '토'].map((day, index) => {
      const dayStats = dailyStats.filter(stat => 
        new Date(stat.date).getDay() === index
      )
      const dayTotal = dayStats.reduce((sum, stat) => sum + stat.hours, 0)
      const dayAvg = dayStats.length > 0 ? dayTotal / dayStats.length : 0
      
      return {
        day,
        averageHours: Math.round(dayAvg * 10) / 10
      }
    })

    return NextResponse.json({
      dailyStats,
      summary: {
        totalHours: Math.round(totalHours * 10) / 10,
        averageHours: Math.round(averageHours * 10) / 10,
        workDays,
        period
      },
      level: {
        current: currentLevel,
        totalWorkHours: Math.round(totalWorkHours * 10) / 10,
        hoursToNext: Math.round(hoursToNextLevel * 10) / 10,
        progress: Math.round(levelProgress)
      },
      dayPattern
    })

  } catch (error) {
    console.error('Personal stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
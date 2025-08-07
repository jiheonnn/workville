import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const period = searchParams.get('period') || 'week'
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, character_type, level, total_work_hours')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
    }

    // Calculate date range
    let startDate: Date
    let endDate: Date = new Date()
    endDate.setHours(23, 59, 59, 999)

    if (period === 'custom' && startDateParam && endDateParam) {
      startDate = new Date(startDateParam)
      endDate = new Date(endDateParam)
      endDate.setHours(23, 59, 59, 999)
    } else {
      switch (period) {
        case 'week':
          startDate = new Date()
          startDate.setDate(startDate.getDate() - 7)
          break
        case 'month':
          startDate = new Date()
          startDate.setMonth(startDate.getMonth() - 1)
          break
        case 'quarter':
          startDate = new Date()
          startDate.setMonth(startDate.getMonth() - 3)
          break
        default:
          startDate = new Date()
          startDate.setDate(startDate.getDate() - 7)
      }
      startDate.setHours(0, 0, 0, 0)
    }

    // Get work sessions for the user
    const { data: sessions, error: sessionsError } = await supabase
      .from('work_sessions')
      .select('check_in_time, check_out_time, duration_minutes')
      .eq('user_id', userId)
      .gte('check_in_time', startDate.toISOString())
      .lte('check_in_time', endDate.toISOString())
      .order('check_in_time', { ascending: true })

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError)
      return NextResponse.json({ error: 'Failed to fetch work sessions' }, { status: 500 })
    }

    // Process daily stats
    const dailyStatsMap = new Map<string, {
      hours: number
      checkIn: string | null
      checkOut: string | null
    }>()

    const dayOfWeekMap = ['일', '월', '화', '수', '목', '금', '토']

    sessions?.forEach(session => {
      if (session.check_in_time) {
        const date = new Date(session.check_in_time)
        const dateKey = date.toISOString().split('T')[0]
        
        const existing = dailyStatsMap.get(dateKey) || { hours: 0, checkIn: null, checkOut: null }
        existing.hours += (session.duration_minutes || 0) / 60
        
        // Track earliest check-in and latest check-out for the day
        if (!existing.checkIn || session.check_in_time < existing.checkIn) {
          existing.checkIn = session.check_in_time
        }
        if (session.check_out_time && (!existing.checkOut || session.check_out_time > existing.checkOut)) {
          existing.checkOut = session.check_out_time
        }
        
        dailyStatsMap.set(dateKey, existing)
      }
    })

    // Generate daily stats array
    const dailyStats = []
    const current = new Date(startDate)
    while (current <= endDate) {
      const dateKey = current.toISOString().split('T')[0]
      const dayData = dailyStatsMap.get(dateKey) || { hours: 0, checkIn: null, checkOut: null }
      
      dailyStats.push({
        date: dateKey,
        hours: Math.round(dayData.hours * 10) / 10,
        dayOfWeek: dayOfWeekMap[current.getDay()],
        checkIn: dayData.checkIn,
        checkOut: dayData.checkOut
      })
      
      current.setDate(current.getDate() + 1)
    }

    // Calculate summary stats
    const totalHours = dailyStats.reduce((sum, day) => sum + day.hours, 0)
    const workDays = dailyStats.filter(day => day.hours > 0).length
    const averageHours = workDays > 0 ? totalHours / workDays : 0

    // Find earliest check-in and latest check-out
    let earliestCheckIn: string | null = null
    let latestCheckOut: string | null = null
    dailyStats.forEach(day => {
      if (day.checkIn && (!earliestCheckIn || new Date(day.checkIn).getHours() * 60 + new Date(day.checkIn).getMinutes() < 
          new Date(earliestCheckIn).getHours() * 60 + new Date(earliestCheckIn).getMinutes())) {
        earliestCheckIn = day.checkIn
      }
      if (day.checkOut && (!latestCheckOut || new Date(day.checkOut).getHours() * 60 + new Date(day.checkOut).getMinutes() >
          new Date(latestCheckOut).getHours() * 60 + new Date(latestCheckOut).getMinutes())) {
        latestCheckOut = day.checkOut
      }
    })

    // Find most productive day
    const dayHours = dailyStats.reduce((acc, day) => {
      acc[day.dayOfWeek] = (acc[day.dayOfWeek] || 0) + day.hours
      return acc
    }, {} as Record<string, number>)
    
    const mostProductiveDay = Object.entries(dayHours).reduce((max, [day, hours]) => 
      hours > (max.hours || 0) ? { day, hours } : max, 
      { day: null as string | null, hours: 0 }
    ).day

    // Calculate weekly pattern
    const weeklyPattern = []
    const weekMap = new Map<string, number>()
    
    dailyStats.forEach(day => {
      const date = new Date(day.date)
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      const weekKey = weekStart.toISOString().split('T')[0]
      
      weekMap.set(weekKey, (weekMap.get(weekKey) || 0) + day.hours)
    })

    weekMap.forEach((hours, weekStart) => {
      weeklyPattern.push({
        week: new Date(weekStart).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
        hours: Math.round(hours * 10) / 10
      })
    })

    const formatTime = (dateStr: string | null) => {
      if (!dateStr) return null
      const date = new Date(dateStr)
      return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    }

    return NextResponse.json({
      member: {
        id: profile.id,
        username: profile.username,
        characterType: profile.character_type,
        level: profile.level
      },
      dailyStats,
      summary: {
        totalHours: Math.round(totalHours * 10) / 10,
        averageHours: Math.round(averageHours * 10) / 10,
        workDays,
        period: `${startDate.toLocaleDateString('ko-KR')} - ${endDate.toLocaleDateString('ko-KR')}`,
        earliestCheckIn: formatTime(earliestCheckIn),
        latestCheckOut: formatTime(latestCheckOut),
        mostProductiveDay
      },
      weeklyPattern
    })
  } catch (error) {
    console.error('Error in member stats API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
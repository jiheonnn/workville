import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
    const period = searchParams.get('period') || 'week'
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

    // Get all team members with their work sessions
    const { data: teamStats, error } = await supabase
      .from('profiles')
      .select(`
        id,
        username,
        character_type,
        level,
        total_work_hours,
        work_sessions!inner (
          date,
          duration_minutes
        )
      `)
      .gte('work_sessions.date', startDate.toISOString().split('T')[0])
      .lte('work_sessions.date', endDate.toISOString().split('T')[0])

    if (error) {
      console.error('Error fetching team stats:', error)
      return NextResponse.json({ error: 'Failed to fetch team statistics' }, { status: 500 })
    }

    // Process team member statistics
    const memberStats = new Map<string, {
      id: string
      username: string
      character_type: string
      level: number
      totalHours: number
      workDays: Set<string>
      dailyHours: Map<string, number>
    }>()

    // Initialize member stats
    teamStats?.forEach(member => {
      if (!memberStats.has(member.id)) {
        memberStats.set(member.id, {
          id: member.id,
          username: member.username || 'Anonymous',
          character_type: member.character_type,
          level: member.level || 1,
          totalHours: 0,
          workDays: new Set(),
          dailyHours: new Map()
        })
      }

      const stats = memberStats.get(member.id)!
      
      // Process work sessions
      member.work_sessions?.forEach((session: any) => {
        if (session.duration_minutes) {
          const hours = session.duration_minutes / 60
          stats.totalHours += hours
          stats.workDays.add(session.date)
          
          // Track daily hours
          const currentDaily = stats.dailyHours.get(session.date) || 0
          stats.dailyHours.set(session.date, currentDaily + hours)
        }
      })
    })

    // Convert to array and calculate averages
    const teamMemberStats = Array.from(memberStats.values()).map(member => ({
      id: member.id,
      username: member.username,
      characterType: member.character_type,
      level: member.level,
      totalHours: Math.round(member.totalHours * 10) / 10,
      averageHours: member.workDays.size > 0 
        ? Math.round((member.totalHours / member.workDays.size) * 10) / 10 
        : 0,
      workDays: member.workDays.size
    }))

    // Sort by total hours descending
    teamMemberStats.sort((a, b) => b.totalHours - a.totalHours)

    // Calculate team totals
    const teamTotalHours = teamMemberStats.reduce((sum, member) => sum + member.totalHours, 0)
    const teamAverageHours = teamMemberStats.length > 0 
      ? teamTotalHours / teamMemberStats.length 
      : 0

    // Get daily team activity
    const dailyTeamHours = new Map<string, number>()
    const currentDate = new Date(startDate)
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      dailyTeamHours.set(dateStr, 0)
      
      memberStats.forEach(member => {
        const hours = member.dailyHours.get(dateStr) || 0
        dailyTeamHours.set(dateStr, (dailyTeamHours.get(dateStr) || 0) + hours)
      })
      
      currentDate.setDate(currentDate.getDate() + 1)
    }

    const dailyActivity = Array.from(dailyTeamHours.entries()).map(([date, hours]) => ({
      date,
      hours: Math.round(hours * 10) / 10,
      activeMembers: Array.from(memberStats.values()).filter(
        member => member.dailyHours.has(date) && member.dailyHours.get(date)! > 0
      ).length
    }))

    return NextResponse.json({
      members: teamMemberStats,
      summary: {
        totalMembers: teamMemberStats.length,
        totalHours: Math.round(teamTotalHours * 10) / 10,
        averageHoursPerMember: Math.round(teamAverageHours * 10) / 10,
        period
      },
      dailyActivity
    })

  } catch (error) {
    console.error('Team stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
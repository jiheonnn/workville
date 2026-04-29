import { NextRequest, NextResponse } from 'next/server'

import {
  sendAutoStatusNotification,
  sendWorkSummaryNotification,
} from '@/lib/slack/notifications'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import {
  AUTO_BREAK_THRESHOLD_MINUTES,
  AUTO_CHECKOUT_THRESHOLD_MINUTES,
  getAutoStatusAction,
} from '@/lib/work-sessions/auto-status'

type OpenWorkSession = {
  id: string
  team_id: string
  user_id: string
  date: string
  check_in_time: string
  break_minutes: number | null
  last_break_start: string | null
}

type UserStatusRow = {
  team_id: string
  user_id: string
  status: 'working' | 'home' | 'break'
  last_activity_at?: string | null
}

type ProfileSummary = {
  id: string
  username: string
  total_work_hours?: number | null
}

type WorkLogSummary = {
  id: string
  team_id: string
  user_id: string
  date: string
  updated_at: string | null
}

function isAuthorizedCronRequest(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')

  return Boolean(cronSecret) && authHeader === `Bearer ${cronSecret}`
}

function formatKoreaTime(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Seoul',
  })
}

function createScopedKey(teamId: string, userId: string) {
  return `${teamId}:${userId}`
}

function createWorkLogKey(teamId: string, userId: string, date: string) {
  return `${teamId}:${userId}:${date}`
}

function chooseLatestWorkLog(logs: WorkLogSummary[]) {
  return logs.reduce<WorkLogSummary | null>((latest, log) => {
    if (!latest) {
      return log
    }

    return (log.updated_at || '') > (latest.updated_at || '') ? log : latest
  }, null)
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceRoleClient()
  const now = new Date()
  const { data: sessions, error: sessionsError } = await supabase
    .from('work_sessions')
    .select('id, team_id, user_id, date, check_in_time, break_minutes, last_break_start')
    .is('check_out_time', null)

  if (sessionsError) {
    console.error('Error loading auto status sessions:', sessionsError)
    return NextResponse.json({ error: '자동 상태 처리 대상 세션을 불러오지 못했습니다.' }, { status: 500 })
  }

  const openSessions = (sessions || []) as OpenWorkSession[]

  if (openSessions.length === 0) {
    return NextResponse.json({ checked: 0, autoBreaks: 0, autoCheckouts: 0, skipped: 0, failed: 0 })
  }

  const userIds = [...new Set(openSessions.map((session) => session.user_id))]
  const sessionDates = [...new Set(openSessions.map((session) => session.date))]

  const [{ data: statuses, error: statusesError }, { data: profiles, error: profilesError }, { data: workLogs, error: workLogsError }] =
    await Promise.all([
      supabase
        .from('user_status')
        .select('team_id, user_id, status, last_activity_at')
        .in('user_id', userIds),
      supabase
        .from('profiles')
        .select('id, username, total_work_hours')
        .in('id', userIds),
      supabase
        .from('work_logs')
        .select('*')
        .in('user_id', userIds)
        .in('date', sessionDates),
    ])

  if (statusesError || profilesError || workLogsError) {
    console.error('Error loading auto status context:', {
      statusesError,
      profilesError,
      workLogsError,
    })
    return NextResponse.json({ error: '자동 상태 처리 컨텍스트를 불러오지 못했습니다.' }, { status: 500 })
  }

  const statusByScope = new Map(
    ((statuses || []) as UserStatusRow[]).map((status) => [
      createScopedKey(status.team_id, status.user_id),
      status,
    ])
  )
  const profileById = new Map(
    ((profiles || []) as ProfileSummary[]).map((profile) => [profile.id, profile])
  )
  const workLogsBySessionDate = new Map<string, WorkLogSummary[]>()

  for (const log of (workLogs || []) as WorkLogSummary[]) {
    const key = createWorkLogKey(log.team_id, log.user_id, log.date)
    workLogsBySessionDate.set(key, [...(workLogsBySessionDate.get(key) || []), log])
  }

  let autoBreaks = 0
  let autoCheckouts = 0
  let skipped = 0
  let failed = 0

  for (const session of openSessions) {
    const status = statusByScope.get(createScopedKey(session.team_id, session.user_id))

    if (!status) {
      skipped += 1
      continue
    }

    const workLog = chooseLatestWorkLog(
      workLogsBySessionDate.get(createWorkLogKey(session.team_id, session.user_id, session.date)) || []
    )
    const action = getAutoStatusAction({
      currentStatus: status.status,
      checkInTime: session.check_in_time,
      lastActivityAt: status.last_activity_at || null,
      workLogUpdatedAt: workLog?.updated_at || null,
      now,
      existingBreakMinutes: session.break_minutes || 0,
      lastBreakStart: session.last_break_start,
    })

    if (!action) {
      continue
    }

    const profile = profileById.get(session.user_id)
    const username = profile?.username || '알 수 없는 사용자'

    if (action.kind === 'start_break') {
      const [{ error: sessionUpdateError }, { error: statusUpdateError }] = await Promise.all([
        supabase
          .from('work_sessions')
          .update({ last_break_start: action.effectiveAt })
          .eq('id', session.id),
        supabase
          .from('user_status')
          .update({ status: 'break', last_updated: action.effectiveAt })
          .eq('team_id', session.team_id)
          .eq('user_id', session.user_id),
      ])

      if (sessionUpdateError || statusUpdateError) {
        console.error('Error applying auto break:', { sessionUpdateError, statusUpdateError })
        failed += 1
        continue
      }

      autoBreaks += 1

      const deliveryResult = await sendAutoStatusNotification(session.team_id, {
        username,
        action: 'break',
        effectiveTime: formatKoreaTime(action.effectiveAt),
        inactiveHours: AUTO_BREAK_THRESHOLD_MINUTES / 60,
      })

      if (deliveryResult === 'failed') {
        failed += 1
      } else if (deliveryResult === 'skipped') {
        skipped += 1
      }
      continue
    }

    const [{ error: sessionUpdateError }, { error: statusUpdateError }, { error: profileUpdateError }] =
      await Promise.all([
        supabase
          .from('work_sessions')
          .update({
            check_out_time: action.effectiveAt,
            duration_minutes: action.durationMinutes,
            break_minutes: action.totalBreakMinutes,
            last_break_start: null,
          })
          .eq('id', session.id),
        supabase
          .from('user_status')
          .update({ status: 'home', last_updated: action.effectiveAt })
          .eq('team_id', session.team_id)
          .eq('user_id', session.user_id),
        supabase
          .from('profiles')
          .update({
            total_work_hours: (profile?.total_work_hours || 0) + action.durationMinutes / 60,
            level: Math.floor(((profile?.total_work_hours || 0) + action.durationMinutes / 60) / 8) + 1,
          })
          .eq('id', session.user_id),
      ])

    if (sessionUpdateError || statusUpdateError || profileUpdateError) {
      console.error('Error applying auto checkout:', {
        sessionUpdateError,
        statusUpdateError,
        profileUpdateError,
      })
      failed += 1
      continue
    }

    autoCheckouts += 1

    const deliveryResult = await sendAutoStatusNotification(session.team_id, {
      username,
      action: 'checkout',
      effectiveTime: formatKoreaTime(action.effectiveAt),
      inactiveHours: AUTO_CHECKOUT_THRESHOLD_MINUTES / 60,
    })

    if (deliveryResult === 'failed') {
      failed += 1
    } else if (deliveryResult === 'skipped') {
      skipped += 1
    }

    const didSendSummary = await sendWorkSummaryNotification(
      session.team_id,
      username,
      action.durationMinutes,
      action.totalBreakMinutes,
      workLog,
      { automaticCheckout: true }
    )

    if (!didSendSummary) {
      failed += 1
    }
  }

  return NextResponse.json({
    checked: openSessions.length,
    autoBreaks,
    autoCheckouts,
    skipped,
    failed,
  })
}

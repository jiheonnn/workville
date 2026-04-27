import { NextRequest, NextResponse } from 'next/server'

import { sendCheckoutReminderNotification } from '@/lib/slack/notifications'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import {
  CHECKOUT_REMINDER_THRESHOLD_MINUTES,
  formatCheckoutReminderElapsedTime,
  formatCheckoutReminderStartTime,
} from '@/lib/work-sessions/checkout-reminders'

type OpenWorkSession = {
  id: string
  team_id: string
  user_id: string
  check_in_time: string
}

type ProfileSummary = {
  id: string
  username: string
}

const CHECKOUT_REMINDER_TYPE = 'checkout_12h'

function isAuthorizedCronRequest(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')

  return Boolean(cronSecret) && authHeader === `Bearer ${cronSecret}`
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceRoleClient()
  const now = new Date()
  const thresholdTime = new Date(
    now.getTime() - CHECKOUT_REMINDER_THRESHOLD_MINUTES * 60 * 1000
  ).toISOString()

  const { data: sessions, error: sessionsError } = await supabase
    .from('work_sessions')
    .select('id, team_id, user_id, check_in_time')
    .is('check_out_time', null)
    .lte('check_in_time', thresholdTime)

  if (sessionsError) {
    console.error('Error loading checkout reminder sessions:', sessionsError)
    return NextResponse.json({ error: '리마인드 대상 세션을 불러오지 못했습니다.' }, { status: 500 })
  }

  const openSessions = (sessions || []) as OpenWorkSession[]

  if (openSessions.length === 0) {
    return NextResponse.json({ checked: 0, sent: 0, skipped: 0, failed: 0 })
  }

  const sessionIds = openSessions.map((session) => session.id)
  const { data: existingReminders, error: remindersError } = await supabase
    .from('work_session_reminders')
    .select('work_session_id')
    .eq('reminder_type', CHECKOUT_REMINDER_TYPE)
    .in('work_session_id', sessionIds)

  if (remindersError) {
    console.error('Error loading checkout reminder history:', remindersError)
    return NextResponse.json({ error: '리마인드 발송 기록을 불러오지 못했습니다.' }, { status: 500 })
  }

  const remindedSessionIds = new Set(
    (existingReminders || []).map((reminder) => reminder.work_session_id)
  )
  const pendingSessions = openSessions.filter((session) => !remindedSessionIds.has(session.id))

  if (pendingSessions.length === 0) {
    return NextResponse.json({ checked: 0, sent: 0, skipped: 0, failed: 0 })
  }

  const userIds = [...new Set(pendingSessions.map((session) => session.user_id))]
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, username')
    .in('id', userIds)

  if (profilesError) {
    console.error('Error loading checkout reminder profiles:', profilesError)
    return NextResponse.json({ error: '리마인드 대상 사용자를 불러오지 못했습니다.' }, { status: 500 })
  }

  const profileById = new Map(
    ((profiles || []) as ProfileSummary[]).map((profile) => [profile.id, profile])
  )

  let sent = 0
  let skipped = 0
  let failed = 0

  for (const session of pendingSessions) {
    const profile = profileById.get(session.user_id)
    const deliveryResult = await sendCheckoutReminderNotification(session.team_id, {
      username: profile?.username || '알 수 없는 사용자',
      checkInTime: formatCheckoutReminderStartTime(session.check_in_time),
      elapsedTime: formatCheckoutReminderElapsedTime({
        checkInTime: session.check_in_time,
        now,
      }),
    })

    if (deliveryResult === 'skipped') {
      skipped += 1
      continue
    }

    if (deliveryResult === 'failed') {
      failed += 1
      continue
    }

    sent += 1

    // 이유: Slack 발송 성공 후에만 기록을 남겨야 실패한 알림이 다음 Cron에서 재시도됩니다.
    const { error: insertError } = await supabase
      .from('work_session_reminders')
      .insert({
        id: crypto.randomUUID(),
        team_id: session.team_id,
        work_session_id: session.id,
        user_id: session.user_id,
        reminder_type: CHECKOUT_REMINDER_TYPE,
        sent_at: now.toISOString(),
        created_at: now.toISOString(),
      })

    if (insertError) {
      console.error('Error saving checkout reminder history:', insertError)
    }
  }

  return NextResponse.json({
    checked: pendingSessions.length,
    sent,
    skipped,
    failed,
  })
}

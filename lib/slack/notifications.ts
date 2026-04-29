import { UserStatus } from '@/lib/types'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

interface SlackMessage {
  text: string
  username?: string
  icon_emoji?: string
}

interface StatusChangeData {
  username: string
  previousStatus: UserStatus
  newStatus: UserStatus
  timestamp?: string
}

type SlackNotificationKind = 'status_change' | 'work_summary' | 'checkout_reminder'
export type SlackNotificationDeliveryResult = 'sent' | 'skipped' | 'failed'

interface TeamSlackNotificationSetting {
  webhook_url: string
  is_enabled: boolean
  notify_status_changes: boolean
  notify_work_summaries: boolean
  notify_checkout_reminders: boolean
}

interface AutoStatusData {
  username: string
  action: 'break' | 'checkout'
  effectiveTime: string
  inactiveHours: number
}

const STATUS_EMOJI = {
  working: '💼',
  home: '🏠', 
  break: '☕'
} as const

const STATUS_TEXT = {
  working: '출근',
  home: '퇴근',
  break: '휴식'
} as const

const CHARACTER_EMOJI = [
  '🧑‍💻', // Character 1
  '👩‍💻', // Character 2  
  '🧑‍🎨', // Character 3
  '👩‍🎨'  // Character 4
] as const

async function getTeamSlackSetting(
  teamId: string,
  kind: SlackNotificationKind
): Promise<TeamSlackNotificationSetting | null> {
  try {
    const supabase = createServiceRoleClient()
    const { data, error } = await supabase
      .from('team_slack_notification_settings')
      .select('webhook_url, is_enabled, notify_status_changes, notify_work_summaries, notify_checkout_reminders')
      .eq('team_id', teamId)
      .single()

    if (error || !data) {
      if (error?.code !== 'PGRST116') {
        console.error('Failed to load Slack notification setting:', error)
      }
      return null
    }

    if (!data.is_enabled) {
      return null
    }

    if (kind === 'status_change' && !data.notify_status_changes) {
      return null
    }

    if (kind === 'work_summary' && !data.notify_work_summaries) {
      return null
    }

    if (kind === 'checkout_reminder' && !data.notify_checkout_reminders) {
      return null
    }

    return data
  } catch (error) {
    console.error('Error loading Slack notification setting:', error)
    return null
  }
}

async function postSlackMessage(webhookUrl: string, payload: SlackMessage): Promise<boolean> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      console.error('Failed to send Slack notification:', response.status, response.statusText)
      return false
    }

    return true
  } catch (error) {
    console.error('Error sending Slack notification:', error)
    return false
  }
}

export async function sendSlackNotification(teamId: string, data: StatusChangeData): Promise<boolean> {
  const setting = await getTeamSlackSetting(teamId, 'status_change')

  if (!setting) {
    return true
  }

  const payload: SlackMessage = {
    text: formatStatusChangeMessage(data),
    username: 'Workville 알림봇',
    icon_emoji: ':office:'
  }

  return postSlackMessage(setting.webhook_url, payload)
}

function formatStatusChangeMessage(data: StatusChangeData): string {
  const { username, previousStatus, newStatus, timestamp } = data
  const emoji = STATUS_EMOJI[newStatus]
  const action = STATUS_TEXT[newStatus]
  
  const time = timestamp 
    ? new Date(timestamp).toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Seoul'
      })
    : '지금'

  // 상태별 메시지 생성
  let message = ''
  
  if (newStatus === 'working') {
    if (previousStatus === 'home') {
      message = `${emoji} *${username}*님이 출근했습니다! (${time})`
    } else if (previousStatus === 'break') {
      message = `${emoji} *${username}*님이 휴식을 마치고 업무에 복귀했습니다. (${time})`
    }
  } else if (newStatus === 'home') {
    if (previousStatus === 'working') {
      message = `${emoji} *${username}*님이 퇴근했습니다. 수고하셨습니다! (${time})`
    } else if (previousStatus === 'break') {
      message = `${emoji} *${username}*님이 휴식 중에 퇴근했습니다. (${time})`
    }
  } else if (newStatus === 'break') {
    message = `${emoji} *${username}*님이 잠시 휴식 중입니다. (${time})`
  }

  return message || `*${username}*님의 상태가 변경되었습니다: ${STATUS_TEXT[previousStatus]} → ${STATUS_TEXT[newStatus]}`
}

export async function sendWorkSummaryNotification(
  teamId: string,
  username: string,
  durationMinutes: number,
  breakMinutes: number,
  workLog?: any,
  options?: { automaticCheckout?: boolean }
): Promise<boolean> {
  const setting = await getTeamSlackSetting(teamId, 'work_summary')

  if (!setting) {
    return true
  }

  try {
    const workHours = Math.floor(durationMinutes / 60)
    const workMinutes = durationMinutes % 60
    const breakHours = Math.floor(breakMinutes / 60)
    const breakMins = breakMinutes % 60

    let workTimeText = ''
    if (workHours > 0) {
      workTimeText = `${workHours}시간 ${workMinutes}분`
    } else {
      workTimeText = `${workMinutes}분`
    }

    let breakTimeText = ''
    if (breakMinutes > 0) {
      if (breakHours > 0) {
        breakTimeText = `\n   • 휴식 시간: ${breakHours}시간 ${breakMins}분`
      } else {
        breakTimeText = `\n   • 휴식 시간: ${breakMins}분`
      }
    }

    let message = options?.automaticCheckout
      ? `📊 *${username}*님의 오늘 근무 요약 (자동 퇴근 처리)\n   • 근무 시간: ${workTimeText}${breakTimeText}\n   • 안내: 6시간 동안 활동이 없어 자동 퇴근 처리되었습니다. 필요하면 업무기록에서 수정하세요.`
      : `📊 *${username}*님의 오늘 근무 요약\n   • 근무 시간: ${workTimeText}${breakTimeText}`
    
    if (workLog) {
      try {
        // 완료된 할 일 추가
        if (workLog.completed_todos && workLog.completed_todos.length > 0) {
          message += '\n\n✅ *완료한 업무*'
          workLog.completed_todos.forEach((todo: any) => {
            message += `\n   • ${todo.text}`
          })
        }
        
        // 미완료 할 일 추가
        if (workLog.todos && workLog.todos.length > 0) {
          message += '\n\n⏳ *진행 중인 업무*'
          workLog.todos.forEach((todo: any) => {
            message += `\n   • ${todo.text}`
          })
        }
        
        // ROI 평가 추가
        if (workLog.roi_high || workLog.roi_low || workLog.tomorrow_priority) {
          message += '\n\n💡 *ROI 자가진단*'
          if (workLog.roi_high) {
            message += `\n   • 가장 ROI 높은 일: ${workLog.roi_high}`
          }
          if (workLog.roi_low) {
            message += `\n   • 가장 ROI 낮은 일: ${workLog.roi_low}`
          }
          if (workLog.tomorrow_priority) {
            message += `\n   • 내일 최우선 과제: ${workLog.tomorrow_priority}`
          }
        }
        
        // 자가 피드백 추가
        if (workLog.feedback) {
          message += '\n\n💭 *자가 피드백*'
          message += `\n   ${workLog.feedback}`
        }
      } catch (error) {
        console.error('Error processing work log:', error)
      }
    }

    const payload: SlackMessage = {
      text: message,
      username: 'Workville 알림봇',
      icon_emoji: ':chart_with_upwards_trend:'
    }

    return postSlackMessage(setting.webhook_url, payload)
  } catch (error) {
    console.error('Error sending work summary notification:', error)
    return false
  }
}

function formatAutoStatusMessage(data: AutoStatusData) {
  const actionText = data.action === 'break' ? '자동 휴식' : '자동 퇴근'
  const reasonText =
    data.action === 'break'
      ? `${data.inactiveHours}시간 동안 활동이 없어 자동 휴식 처리되었습니다.`
      : `${data.inactiveHours}시간 동안 활동이 없어 자동 퇴근 처리되었습니다.`

  return [
    `ℹ️ *${data.username}*님이 ${actionText} 처리되었습니다.`,
    `   • 처리 시각: ${data.effectiveTime}`,
    `   • 사유: ${reasonText}`,
    `   • 필요하면 업무기록에서 수정할 수 있습니다.`,
  ].join('\n')
}

export async function sendAutoStatusNotification(
  teamId: string,
  data: AutoStatusData
): Promise<SlackNotificationDeliveryResult> {
  const setting = await getTeamSlackSetting(teamId, 'checkout_reminder')

  if (!setting) {
    return 'skipped'
  }

  const payload: SlackMessage = {
    text: formatAutoStatusMessage(data),
    username: 'Workville 알림봇',
    icon_emoji: ':information_source:',
  }

  const ok = await postSlackMessage(setting.webhook_url, payload)

  return ok ? 'sent' : 'failed'
}

import { UserStatus } from '@/lib/types'

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

export async function sendSlackNotification(data: StatusChangeData): Promise<boolean> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  
  // Slack 웹훅 URL이 설정되지 않았으면 알림 건너뛰기
  if (!webhookUrl) {
    console.log('Slack webhook URL not configured, skipping notification')
    return true
  }

  try {
    const message = formatStatusChangeMessage(data)
    
    const payload: SlackMessage = {
      text: message,
      username: 'Workville 알림봇',
      icon_emoji: ':office:'
    }

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

    console.log('Slack notification sent successfully')
    return true
  } catch (error) {
    console.error('Error sending Slack notification:', error)
    return false
  }
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
  username: string,
  durationMinutes: number,
  breakMinutes: number
): Promise<boolean> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  
  if (!webhookUrl) {
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

    const message = `📊 *${username}*님의 오늘 근무 요약\n   • 근무 시간: ${workTimeText}${breakTimeText}`

    const payload: SlackMessage = {
      text: message,
      username: 'Workville 알림봇',
      icon_emoji: ':chart_with_upwards_trend:'
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    return response.ok
  } catch (error) {
    console.error('Error sending work summary notification:', error)
    return false
  }
}
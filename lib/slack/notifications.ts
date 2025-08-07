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
  breakMinutes: number,
  workLog?: any
): Promise<boolean> {
  console.log('=== sendWorkSummaryNotification called ===')
  console.log('Username:', username)
  console.log('Duration:', durationMinutes)
  console.log('Break:', breakMinutes)
  console.log('WorkLog:', JSON.stringify(workLog, null, 2))
  
  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  
  if (!webhookUrl) {
    console.log('No webhook URL configured')
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

    // 기본 메시지 생성
    let message = `📊 *${username}*님의 오늘 근무 요약\n   • 근무 시간: ${workTimeText}${breakTimeText}`
    
    // 업무일지가 있으면 내용 추가
    console.log('Checking workLog for content...')
    console.log('workLog exists:', !!workLog)
    if (workLog) {
      console.log('workLog.todos:', workLog.todos)
      console.log('workLog.completed_todos:', workLog.completed_todos)
      console.log('workLog.roi_high:', workLog.roi_high)
      console.log('workLog.feedback:', workLog.feedback)
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

    console.log('Final message to send:', message)
    
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
export const CHECKOUT_REMINDER_THRESHOLD_MINUTES = 12 * 60

interface CheckoutReminderTimeInput {
  checkInTime: string
  now: Date
}

export function getCheckoutReminderElapsedMinutes({
  checkInTime,
  now,
}: CheckoutReminderTimeInput) {
  const checkInDate = new Date(checkInTime)
  const elapsedMilliseconds = now.getTime() - checkInDate.getTime()

  return Math.max(0, Math.floor(elapsedMilliseconds / (1000 * 60)))
}

export function isCheckoutReminderDue(input: CheckoutReminderTimeInput) {
  return getCheckoutReminderElapsedMinutes(input) >= CHECKOUT_REMINDER_THRESHOLD_MINUTES
}

export function formatCheckoutReminderElapsedTime(input: CheckoutReminderTimeInput) {
  const elapsedMinutes = getCheckoutReminderElapsedMinutes(input)
  const hours = Math.floor(elapsedMinutes / 60)
  const minutes = elapsedMinutes % 60

  return `${hours}시간 ${minutes}분`
}

export function formatCheckoutReminderStartTime(checkInTime: string) {
  return new Date(checkInTime).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Seoul',
  })
}

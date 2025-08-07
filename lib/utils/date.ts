/**
 * Get the current date in Korean timezone (YYYY-MM-DD format)
 */
export const getKoreanDate = (date?: Date): string => {
  const targetDate = date || new Date()
  const year = targetDate.toLocaleString('en-US', {timeZone: 'Asia/Seoul', year: 'numeric'})
  const month = targetDate.toLocaleString('en-US', {timeZone: 'Asia/Seoul', month: '2-digit'})
  const day = targetDate.toLocaleString('en-US', {timeZone: 'Asia/Seoul', day: '2-digit'})
  return `${year}-${month}-${day}`
}

/**
 * Get today's date in Korean timezone
 */
export const getTodayKorea = (): string => {
  return getKoreanDate()
}
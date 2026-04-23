import { formatDurationMinutes } from '@/lib/village/status-summary'

interface VillageStatusSummaryCardProps {
  label: string
  totalMinutes: number
  latestCheckInTime: string | null
}

function formatCompactDuration(totalMinutes: number) {
  if (totalMinutes < 60) {
    return `${totalMinutes}분`
  }

  return formatDurationMinutes(totalMinutes)
}

export default function VillageStatusSummaryCard({
  label,
  totalMinutes,
  latestCheckInTime,
}: VillageStatusSummaryCardProps) {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-6">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">{label}</span>
        <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 whitespace-nowrap">
          {formatCompactDuration(totalMinutes)}
        </span>
      </div>

      {latestCheckInTime && (
        <div className="mt-3 flex items-center gap-2 text-xs font-medium text-gray-600">
          <span className="text-emerald-600">⏰</span>
          최근 출근:{' '}
          {new Date(latestCheckInTime).toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      )}
    </div>
  )
}

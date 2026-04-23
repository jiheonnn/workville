'use client'

import WorkLogEditor from '@/components/work-log/WorkLogEditor'

import VillageStatusSummaryCard from './VillageStatusSummaryCard'

interface VillageWorkLogPanelProps {
  error: string | null
  summaryLabel: string
  summaryTotalMinutes: number
  latestCheckInTime: string | null
}

export default function VillageWorkLogPanel({
  error,
  summaryLabel,
  summaryTotalMinutes,
  latestCheckInTime,
}: VillageWorkLogPanelProps) {
  return (
    <div className="rounded-2xl border border-gray-100/60 bg-white/90 p-6 shadow-2xl backdrop-blur-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-black bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
          오늘의 업무일지
        </h2>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <VillageStatusSummaryCard
          label={summaryLabel}
          totalMinutes={summaryTotalMinutes}
          latestCheckInTime={latestCheckInTime}
        />
        <WorkLogEditor />
      </div>
    </div>
  )
}

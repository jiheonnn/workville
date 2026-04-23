'use client'

import { cn } from '@/lib/utils'
import { type UserStatus } from '@/lib/types'
import { VILLAGE_STATUS_SEGMENTS } from '@/lib/village/status-segment'

interface VillageStatusSegmentedControlProps {
  currentStatus: UserStatus
  onStatusChange: (status: UserStatus) => void
}

export default function VillageStatusSegmentedControl({
  currentStatus,
  onStatusChange,
}: VillageStatusSegmentedControlProps) {
  const selectedIndex = Math.max(
    0,
    VILLAGE_STATUS_SEGMENTS.findIndex((segment) => segment.status === currentStatus)
  )
  const selectedSegment = VILLAGE_STATUS_SEGMENTS[selectedIndex]

  return (
    <div
      className="rounded-3xl border border-gray-200 bg-gray-100/90 p-1.5 shadow-inner shadow-gray-200/70"
      role="tablist"
      aria-label="근무 상태"
    >
      <div className="relative flex">
        <div
          aria-hidden="true"
          className={cn(
            'absolute inset-y-0 left-0 z-0 w-1/3 rounded-[22px] border-2 transition-[transform,background-color,border-color,box-shadow] duration-300 ease-out will-change-transform',
            selectedSegment.activeClassName
          )}
          style={{
            transform: `translateX(${selectedIndex * 100}%)`,
          }}
        />
        {VILLAGE_STATUS_SEGMENTS.map((segment) => {
          const isActive = segment.status === currentStatus

          return (
            <button
              key={segment.status}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onStatusChange(segment.status)}
              className={cn(
                'relative z-10 flex min-w-0 flex-1 items-center justify-center gap-2 rounded-[22px] border-2 border-transparent px-4 py-3 text-sm font-semibold transition-colors duration-300',
                isActive
                  ? 'text-white'
                  : cn('bg-transparent text-gray-600', segment.inactiveClassName)
              )}
            >
              <span aria-hidden="true" className="text-lg">
                {segment.emoji}
              </span>
              <span>{segment.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

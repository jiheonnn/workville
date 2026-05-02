'use client'

import dynamic from 'next/dynamic'
import AtlasBanner from '@/components/ui/AtlasBanner'
import WorkLogConfirmModal from '@/components/work-log/WorkLogConfirmModal'
import VillageStatusSegmentedControl from '@/components/village/VillageStatusSegmentedControl'
import VillageWorkLogPanel from '@/components/village/VillageWorkLogPanel'
import { useVillageStatusController } from '@/hooks/useVillageStatusController'
import {
  VILLAGE_MAP_COLUMN_CLASS_NAME,
  VILLAGE_PAGE_CONTAINER_CLASS_NAME,
  VILLAGE_PAGE_GRID_CLASS_NAME,
  VILLAGE_WORK_LOG_COLUMN_CLASS_NAME,
} from '@/lib/village/page-layout'

const VillageMap = dynamic(() => import('@/components/village/VillageMap'), {
  loading: () => <div className="w-full h-[500px] bg-white rounded-2xl shadow-xl animate-pulse" />
})

export default function VillagePage() {
  const {
    currentUserStatus,
    error,
    latestCheckInTime,
    recordReviewBanner,
    showWorkLogModal,
    statusTransitionBanner,
    statusSummary,
    closeRecordReviewBanner,
    closeStatusTransitionBanner,
    handleRecordReviewAction,
    handleStatusChange,
    handleWorkLogSubmit,
    handleWorkLogSkip,
  } = useVillageStatusController()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100">
      {recordReviewBanner ? (
        <AtlasBanner
          tone={recordReviewBanner.tone}
          title={recordReviewBanner.title}
          message={recordReviewBanner.message}
          actionLabel={recordReviewBanner.actionLabel}
          onAction={recordReviewBanner.actionLabel ? handleRecordReviewAction : undefined}
          onClose={closeRecordReviewBanner}
          autoCloseMs={5000}
        />
      ) : statusTransitionBanner ? (
        <AtlasBanner
          tone={statusTransitionBanner.tone}
          title={statusTransitionBanner.title}
          message={statusTransitionBanner.message}
          onClose={closeStatusTransitionBanner}
          autoCloseMs={statusTransitionBanner.autoCloseMs}
        />
      ) : null}

      <div className={VILLAGE_PAGE_CONTAINER_CLASS_NAME}>
        <div className={VILLAGE_PAGE_GRID_CLASS_NAME}>
          <div className={VILLAGE_MAP_COLUMN_CLASS_NAME}>
            <VillageMap
              footer={
                <VillageStatusSegmentedControl
                  currentStatus={currentUserStatus}
                  onStatusChange={handleStatusChange}
                />
              }
            />
          </div>
          <div className={VILLAGE_WORK_LOG_COLUMN_CLASS_NAME}>
            <VillageWorkLogPanel
              error={error}
              summaryLabel={statusSummary.label}
              summaryTotalMinutes={statusSummary.totalMinutes}
              latestCheckInTime={latestCheckInTime}
            />
          </div>
        </div>
      </div>

      <WorkLogConfirmModal
        isOpen={showWorkLogModal}
        onClose={handleWorkLogSkip}
        onConfirm={handleWorkLogSubmit}
      />
    </div>
  )
}

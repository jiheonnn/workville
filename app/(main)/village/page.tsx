'use client'

import dynamic from 'next/dynamic'
import AtlasBanner from '@/components/ui/AtlasBanner'
import WorkLogConfirmModal from '@/components/work-log/WorkLogConfirmModal'
import VillageStatusSegmentedControl from '@/components/village/VillageStatusSegmentedControl'
import VillageWorkLogPanel from '@/components/village/VillageWorkLogPanel'
import { useVillageStatusController } from '@/hooks/useVillageStatusController'

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

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
          <div className="xl:col-span-3">
            <VillageMap
              footer={
                <VillageStatusSegmentedControl
                  currentStatus={currentUserStatus}
                  onStatusChange={handleStatusChange}
                />
              }
            />
          </div>
          <div className="xl:col-span-2">
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

'use client'

import { useWorkLogStore } from '@/lib/stores/work-log-store'

export default function ROISection() {
  const { currentLog, updateField } = useWorkLogStore()

  if (!currentLog) return null

  return (
    <div className="bg-yellow-50 rounded-xl p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        💡 ROI 자가 진단
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            1. 오늘 한 일 중 가장 <span className="text-green-600">ROI 높은 일</span>은?
          </label>
          <input
            type="text"
            value={currentLog.roi_high}
            onChange={(e) => updateField('roi_high', e.target.value)}
            placeholder="가장 가치 있었던 일을 적어주세요"
            className="w-full px-4 py-2 bg-white rounded-lg border border-yellow-200 focus:border-yellow-400 focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            2. 오늘 한 일 중 가장 <span className="text-red-600">ROI 낮은 일</span>은?
          </label>
          <input
            type="text"
            value={currentLog.roi_low}
            onChange={(e) => updateField('roi_low', e.target.value)}
            placeholder="개선이 필요한 일을 적어주세요"
            className="w-full px-4 py-2 bg-white rounded-lg border border-yellow-200 focus:border-yellow-400 focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            3. 내일 가장 먼저 할 일 <span className="text-blue-600">(ROI 기준)</span>
          </label>
          <input
            type="text"
            value={currentLog.tomorrow_priority}
            onChange={(e) => updateField('tomorrow_priority', e.target.value)}
            placeholder="내일 최우선 과제를 적어주세요"
            className="w-full px-4 py-2 bg-white rounded-lg border border-yellow-200 focus:border-yellow-400 focus:outline-none transition-colors"
          />
        </div>
      </div>
    </div>
  )
}
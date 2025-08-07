'use client'

import { useWorkLogStore } from '@/lib/stores/work-log-store'

export default function FeedbackSection() {
  const { currentLog, updateField } = useWorkLogStore()

  if (!currentLog) return null

  return (
    <div className="bg-purple-50 rounded-xl p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        ✅ 자가 피드백
      </h3>
      
      <textarea
        value={currentLog.feedback}
        onChange={(e) => updateField('feedback', e.target.value)}
        placeholder="오늘 하루를 돌아보며 느낀 점, 개선할 점, 잘한 점 등을 자유롭게 적어주세요..."
        className="w-full min-h-[120px] px-4 py-3 bg-white text-black rounded-lg border border-purple-200 focus:border-purple-400 focus:outline-none transition-colors resize-y placeholder:text-gray-500"
      />
      
      <p className="mt-2 text-xs text-gray-600">
        💭 오늘의 성과와 개선점을 기록하여 내일의 성장으로 연결하세요
      </p>
    </div>
  )
}
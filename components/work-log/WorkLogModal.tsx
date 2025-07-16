'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface WorkLogModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
}

export default function WorkLogModal({ isOpen, onClose, onSubmit }: WorkLogModalProps) {
  const [template, setTemplate] = useState('')
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch template when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchTemplate()
    }
  }, [isOpen])

  const fetchTemplate = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('work_log_template')
        .select('content')
        .single()

      if (error) throw error
      
      setTemplate(data.content)
      setContent(data.content)
    } catch (err) {
      console.error('Error fetching template:', err)
      setContent('## 오늘 한 일\n- \n\n## 내일 할 일\n- \n\n## 이슈 및 특이사항\n- ')
    }
  }

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError('업무 일지 내용을 입력해주세요.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/work-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save work log')
      }

      // Success - close modal and notify parent
      onSubmit()
      onClose() // Close the modal after successful save
      setContent(template) // Reset to template
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || '업무 일지 저장에 실패했습니다.')
      } else {
        setError('업무 일지 저장에 실패했습니다.')
      }
      console.error('Error saving work log:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden transform transition-all duration-300 scale-100 animate-slideIn">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-100">
          <h2 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            오늘의 업무 일지
          </h2>
          <p className="text-gray-600 mt-1 text-sm">오늘 하신 업무를 정리해주세요</p>
        </div>

        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 180px)' }}>
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-center gap-2">
              <span className="text-red-500">⚠️</span>
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">📝 오늘 한 일</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-80 p-4 border-2 border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-mono text-sm leading-relaxed"
                placeholder="## 오늘 한 일\n- \n\n## 내일 할 일\n- \n\n## 이슈 및 특이사항\n- "
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-2.5 text-gray-600 hover:text-gray-800 font-semibold rounded-xl hover:bg-gray-100 transition-all duration-200 disabled:opacity-50"
          >
            나중에 작성
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                저장 중...
              </>
            ) : (
              <>
                💾 저장하고 퇴근
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
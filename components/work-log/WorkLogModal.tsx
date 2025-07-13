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
        throw new Error('Failed to save work log')
      }

      // Success - close modal and notify parent
      onSubmit()
      setContent(template) // Reset to template
    } catch (err) {
      setError('업무 일지 저장에 실패했습니다.')
      console.error('Error saving work log:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold">오늘의 업무 일지</h2>
          <p className="text-gray-600 mt-1">오늘 하신 업무를 정리해주세요</p>
        </div>

        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-96 p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="업무 내용을 입력하세요..."
            disabled={isLoading}
          />
        </div>

        <div className="p-6 border-t flex justify-between">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
          >
            나중에 작성
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '저장 중...' : '저장하고 퇴근'}
          </button>
        </div>
      </div>
    </div>
  )
}
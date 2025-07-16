'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/auth-store'

interface WorkLogTemplate {
  id: string
  content: string
  updated_at: string
  updated_by: string | null
}

export default function TemplateEditor() {
  const [template, setTemplate] = useState<WorkLogTemplate | null>(null)
  const [editedContent, setEditedContent] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuthStore()
  const supabase = createClient()

  // Fetch current template
  const fetchTemplate = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('work_log_template')
        .select('*')
        .single()

      if (error) throw error

      setTemplate(data)
      setEditedContent(data.content)
    } catch (err) {
      console.error('Error fetching template:', err)
      setError('템플릿을 불러오는데 실패했습니다.')
    }
  }, [supabase])

  // Save template
  const saveTemplate = async () => {
    if (!template || !user) return

    setIsSaving(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('work_log_template')
        .update({ 
          content: editedContent,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', template.id)

      if (error) throw error

      await fetchTemplate()
      setIsEditing(false)
    } catch (err) {
      console.error('Error saving template:', err)
      setError('템플릿 저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  // Subscribe to realtime updates
  useEffect(() => {
    // Fetch template on mount
    fetchTemplate()

    const channel = supabase
      .channel('template-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'work_log_template',
        },
        () => {
          fetchTemplate()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchTemplate, supabase])

  if (!template) {
    return <div className="animate-pulse bg-gradient-to-r from-gray-100 to-gray-200 h-48 rounded-2xl" />
  }

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800">📝 업무 일지 템플릿</h3>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/25 hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            ✏️ 편집
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => {
                setEditedContent(template.content)
                setIsEditing(false)
                setError(null)
              }}
              className="px-5 py-2.5 bg-white text-gray-600 font-medium rounded-xl border-2 border-gray-200 hover:bg-gray-50 transition-all duration-200"
            >
              취소
            </button>
            <button
              onClick={saveTemplate}
              disabled={isSaving}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? '저장 중...' : '💾 저장'}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm font-medium animate-slideIn">
          ⚠️ {error}
        </div>
      )}

      {!isEditing ? (
        <div className="bg-white rounded-xl shadow-inner">
          <pre className="whitespace-pre-wrap p-6 font-mono text-sm text-gray-700 leading-relaxed">
            {template.content}
          </pre>
          {template.updated_by && (
            <div className="px-6 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 rounded-b-xl">
              <p className="text-xs text-gray-600 font-medium">
                🕒 마지막 수정: {new Date(template.updated_at).toLocaleString('ko-KR')}
              </p>
            </div>
          )}
        </div>
      ) : (
        <textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          placeholder="업무 일지 템플릿을 입력하세요..."
          className="w-full min-h-[300px] p-6 bg-white rounded-xl shadow-inner border-2 border-emerald-200 focus:border-emerald-400 focus:outline-none transition-colors font-mono text-sm leading-relaxed resize-y"
        />
      )}

      <div className="mt-6 p-5 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
        <p className="text-sm text-emerald-800 font-medium">
          💡 이 템플릿은 모든 팀원이 공유합니다. 수정 시 다른 팀원들의 업무 일지 작성에 영향을 줍니다.
        </p>
      </div>
    </div>
  )
}
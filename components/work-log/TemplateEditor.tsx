'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
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
  const fetchTemplate = async () => {
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
  }

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
  }, [])

  if (!template) {
    return <div className="animate-pulse bg-gray-100 h-48 rounded-lg" />
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">업무 일지 템플릿</h3>
        {!isEditing ? (
          <Button
            onClick={() => setIsEditing(true)}
            variant="outline"
            size="sm"
          >
            편집
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setEditedContent(template.content)
                setIsEditing(false)
                setError(null)
              }}
              variant="outline"
              size="sm"
            >
              취소
            </Button>
            <Button
              onClick={saveTemplate}
              disabled={isSaving}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              {isSaving ? '저장 중...' : '저장'}
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
          {error}
        </div>
      )}

      {!isEditing ? (
        <div className="prose prose-sm max-w-none">
          <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded-md text-sm">
            {template.content}
          </pre>
          {template.updated_by && (
            <p className="text-xs text-gray-500 mt-2">
              마지막 수정: {new Date(template.updated_at).toLocaleString('ko-KR')}
            </p>
          )}
        </div>
      ) : (
        <Textarea
          value={editedContent}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditedContent(e.target.value)}
          placeholder="업무 일지 템플릿을 입력하세요..."
          className="min-h-[200px] font-mono text-sm"
        />
      )}

      <div className="mt-4 p-3 bg-blue-50 rounded-md">
        <p className="text-sm text-blue-700">
          💡 이 템플릿은 모든 팀원이 공유합니다. 수정 시 다른 팀원들의 업무 일지 작성에 영향을 줍니다.
        </p>
      </div>
    </div>
  )
}
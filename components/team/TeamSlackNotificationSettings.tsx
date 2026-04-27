'use client'

import { FormEvent, useEffect, useState } from 'react'

export interface SlackNotificationSettingView {
  isConfigured: boolean
  isEnabled: boolean
  notifyStatusChanges: boolean
  notifyWorkSummaries: boolean
  notifyCheckoutReminders: boolean
}

export interface SlackNotificationSettingPayload {
  webhookUrl: string
  isEnabled: boolean
  notifyStatusChanges: boolean
  notifyWorkSummaries: boolean
  notifyCheckoutReminders: boolean
}

interface TeamSlackNotificationSettingsProps {
  setting: SlackNotificationSettingView | null
  isLoading: boolean
  error: string | null
  onSave: (payload: SlackNotificationSettingPayload) => Promise<boolean>
  onDelete: () => Promise<boolean>
}

export default function TeamSlackNotificationSettings({
  setting,
  isLoading,
  error,
  onSave,
  onDelete,
}: TeamSlackNotificationSettingsProps) {
  const [webhookUrl, setWebhookUrl] = useState('')
  const [isEnabled, setIsEnabled] = useState(true)
  const [notifyStatusChanges, setNotifyStatusChanges] = useState(true)
  const [notifyWorkSummaries, setNotifyWorkSummaries] = useState(true)
  const [notifyCheckoutReminders, setNotifyCheckoutReminders] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setIsEnabled(setting?.isEnabled ?? true)
    setNotifyStatusChanges(setting?.notifyStatusChanges ?? true)
    setNotifyWorkSummaries(setting?.notifyWorkSummaries ?? true)
    setNotifyCheckoutReminders(setting?.notifyCheckoutReminders ?? true)
    setWebhookUrl('')
  }, [setting])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)

    const ok = await onSave({
      webhookUrl,
      isEnabled,
      notifyStatusChanges,
      notifyWorkSummaries,
      notifyCheckoutReminders,
    })

    if (ok) {
      setWebhookUrl('')
    }

    setIsSaving(false)
  }

  const handleDelete = async () => {
    setIsSaving(true)
    const ok = await onDelete()

    if (ok) {
      setWebhookUrl('')
    }

    setIsSaving(false)
  }

  const isConfigured = setting?.isConfigured === true
  const canSubmit = !isSaving && !isLoading && (isConfigured || webhookUrl.trim().length > 0)

  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-slate-900">Slack 알림 설정</h3>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isConfigured ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
          {isConfigured ? '연결됨' : '미연결'}
        </span>
      </div>

      <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Webhook URL</span>
          <input
            type="url"
            value={webhookUrl}
            onChange={(event) => setWebhookUrl(event.currentTarget.value)}
            placeholder="https://hooks.slack.com/services/..."
            className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-emerald-500"
            disabled={isLoading || isSaving}
          />
        </label>

        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(event) => setIsEnabled(event.currentTarget.checked)}
              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              disabled={isLoading || isSaving}
            />
            Slack 알림 활성화
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={notifyStatusChanges}
              onChange={(event) => setNotifyStatusChanges(event.currentTarget.checked)}
              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              disabled={isLoading || isSaving}
            />
            출근/퇴근/휴식 알림
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={notifyWorkSummaries}
              onChange={(event) => setNotifyWorkSummaries(event.currentTarget.checked)}
              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              disabled={isLoading || isSaving}
            />
            퇴근 요약 알림
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={notifyCheckoutReminders}
              onChange={(event) => setNotifyCheckoutReminders(event.currentTarget.checked)}
              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              disabled={isLoading || isSaving}
            />
            12시간 퇴근 리마인드
          </label>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            저장
          </button>
          {isConfigured && (
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={isLoading || isSaving}
              className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
            >
              연결 해제
            </button>
          )}
        </div>
      </form>
    </section>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'

interface EditableWorkSession {
  id: string
  check_in_time: string
  check_out_time: string | null
  duration_minutes: number | null
  break_minutes?: number | null
}

interface WorkSessionEditModalProps {
  session: EditableWorkSession | null
  onClose: () => void
  onSaved: () => Promise<void>
}

interface DateTimeParts {
  date: string
  hour: string
  minute: string
}

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'))
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'))
const EMPTY_DATE_TIME_PARTS: DateTimeParts = {
  date: '',
  hour: '09',
  minute: '00',
}

function toDateTimeParts(value: string | null): DateTimeParts {
  if (!value) {
    return EMPTY_DATE_TIME_PARTS
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return EMPTY_DATE_TIME_PARTS
  }

  const offsetMs = date.getTimezoneOffset() * 60 * 1000
  const localIso = new Date(date.getTime() - offsetMs).toISOString()

  return {
    date: localIso.slice(0, 10),
    hour: localIso.slice(11, 13),
    minute: localIso.slice(14, 16),
  }
}

function toIsoStringFromParts(parts: DateTimeParts) {
  return new Date(`${parts.date}T${parts.hour}:${parts.minute}:00`).toISOString()
}

function hasCompleteParts(parts: DateTimeParts) {
  return Boolean(parts.date && parts.hour && parts.minute)
}

function TimeField({
  label,
  value,
  onChange,
}: {
  label: string
  value: DateTimeParts
  onChange: (value: DateTimeParts) => void
}) {
  return (
    <div>
      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
      <div className="mt-2 grid grid-cols-[minmax(0,1fr)_88px_88px] gap-2">
        <input
          type="date"
          value={value.date}
          onChange={(event) => onChange({ ...value, date: event.currentTarget.value })}
          className="min-w-0 rounded-xl border-2 border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200"
        />
        <select
          value={value.hour}
          onChange={(event) => onChange({ ...value, hour: event.currentTarget.value })}
          className="rounded-xl border-2 border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200"
          aria-label={`${label} 시`}
        >
          {HOUR_OPTIONS.map((hour) => (
            <option key={hour} value={hour}>
              {hour}시
            </option>
          ))}
        </select>
        <select
          value={value.minute}
          onChange={(event) => onChange({ ...value, minute: event.currentTarget.value })}
          className="rounded-xl border-2 border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200"
          aria-label={`${label} 분`}
        >
          {MINUTE_OPTIONS.map((minute) => (
            <option key={minute} value={minute}>
              {minute}분
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default function WorkSessionEditModal({
  session,
  onClose,
  onSaved,
}: WorkSessionEditModalProps) {
  const initialCheckIn = useMemo(
    () => toDateTimeParts(session?.check_in_time ?? null),
    [session?.check_in_time]
  )
  const initialCheckOut = useMemo(
    () => toDateTimeParts(session?.check_out_time ?? null),
    [session?.check_out_time]
  )
  const [checkInTime, setCheckInTime] = useState<DateTimeParts>(initialCheckIn)
  const [checkOutTime, setCheckOutTime] = useState<DateTimeParts>(initialCheckOut)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setCheckInTime(initialCheckIn)
    setCheckOutTime(initialCheckOut)
    setError(null)
  }, [initialCheckIn, initialCheckOut])

  if (!session) {
    return null
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!hasCompleteParts(checkInTime) || !hasCompleteParts(checkOutTime)) {
      setError('출근/퇴근 시간을 모두 입력해주세요.')
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch(`/api/work-sessions/${session.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          checkInTime: toIsoStringFromParts(checkInTime),
          checkOutTime: toIsoStringFromParts(checkOutTime),
          reason: '업무기록 화면에서 직접 정정',
        }),
      })
      const body = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(typeof body.error === 'string' ? body.error : '근무시간 수정에 실패했습니다.')
        return
      }

      await onSaved()
      onClose()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '근무시간 수정에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
      >
        <div className="mb-5">
          <h3 className="text-lg font-black text-slate-900">근무시간 수정</h3>
        </div>

        <div className="space-y-4">
          <TimeField label="출근 시간" value={checkInTime} onChange={setCheckInTime} />
          <TimeField label="퇴근 시간" value={checkOutTime} onChange={setCheckOutTime} />
        </div>

        {error ? (
          <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            저장
          </button>
        </div>
      </form>
    </div>
  )
}

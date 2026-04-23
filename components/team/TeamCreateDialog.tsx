'use client'

import { useState, type FormEvent } from 'react'

interface TeamCreateDialogProps {
  onCreate: (name: string) => Promise<boolean>
  isLoading: boolean
  compact?: boolean
}

export default function TeamCreateDialog({
  onCreate,
  isLoading,
  compact = false,
}: TeamCreateDialogProps) {
  const [name, setName] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedName = name.trim()
    if (!trimmedName) {
      return
    }

    const created = await onCreate(trimmedName)
    if (created) {
      setName('')
    }
  }

  return (
    <section className={`bg-white border border-gray-100 ${compact ? 'rounded-3xl p-5 shadow-[0_14px_40px_rgba(15,23,42,0.08)]' : 'rounded-2xl p-6 shadow-lg'}`}>
      <h2 className={`${compact ? 'text-lg' : 'text-xl'} font-bold text-gray-800`}>새 팀 만들기</h2>

      <form className={`flex flex-col gap-3 ${compact ? 'mt-4' : 'mt-4 sm:flex-row'}`} onSubmit={(event) => void handleSubmit(event)}>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="팀 이름을 입력하세요"
          className="flex-1 rounded-2xl border border-gray-200 px-4 py-3"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          팀 생성
        </button>
      </form>
    </section>
  )
}

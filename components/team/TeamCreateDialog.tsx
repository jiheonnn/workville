'use client'

import { useState, type FormEvent } from 'react'

interface TeamCreateDialogProps {
  onCreate: (name: string) => Promise<boolean>
  isLoading: boolean
}

export default function TeamCreateDialog({
  onCreate,
  isLoading,
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
    <section className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <h2 className="text-xl font-bold text-gray-800">새 팀 만들기</h2>
      <p className="text-sm text-gray-600 mt-2">
        팀을 만들면 바로 팀장이 되며, 이후 상단에서 활성 팀 전환이 가능합니다.
      </p>

      <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={(event) => void handleSubmit(event)}>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="팀 이름을 입력하세요"
          className="flex-1 px-4 py-3 rounded-xl border border-gray-200"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-5 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50"
        >
          팀 생성
        </button>
      </form>
    </section>
  )
}

'use client'

import { useState, type FormEvent } from 'react'

interface InviteMemberDialogProps {
  disabled?: boolean
  onInvite: (email: string) => Promise<boolean>
  compact?: boolean
}

export default function InviteMemberDialog({
  disabled = false,
  onInvite,
  compact = false,
}: InviteMemberDialogProps) {
  const [email, setEmail] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      return
    }

    const invited = await onInvite(trimmedEmail)
    if (invited) {
      setEmail('')
    }
  }

  return (
    <section className={`border border-gray-100 bg-white ${compact ? 'rounded-2xl p-5 shadow-none' : 'rounded-2xl p-6 shadow-lg'}`}>
      <h3 className="text-lg font-bold text-gray-800">팀원 초대</h3>
      <form className={`mt-4 flex flex-col gap-3 ${compact ? '' : 'sm:flex-row'}`} onSubmit={(event) => void handleSubmit(event)}>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="example@workville.dev"
          disabled={disabled}
          className="flex-1 rounded-2xl border border-gray-200 px-4 py-3 disabled:bg-gray-50"
        />
        <button
          type="submit"
          disabled={disabled}
          className="rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          초대 보내기
        </button>
      </form>
    </section>
  )
}

'use client'

import { useState, type FormEvent } from 'react'

interface InviteMemberDialogProps {
  disabled?: boolean
  onInvite: (email: string) => Promise<boolean>
}

export default function InviteMemberDialog({
  disabled = false,
  onInvite,
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
    <section className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <h3 className="text-lg font-bold text-gray-800">팀원 초대</h3>
      <p className="text-sm text-gray-600 mt-2">
        팀장만 이메일로 초대를 보낼 수 있습니다. 초대받은 사용자는 가입 전후와 상관없이 로그인 후 수락할 수 있습니다.
      </p>
      <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={(event) => void handleSubmit(event)}>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="example@workville.dev"
          disabled={disabled}
          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 disabled:bg-gray-50"
        />
        <button
          type="submit"
          disabled={disabled}
          className="px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          초대 보내기
        </button>
      </form>
    </section>
  )
}

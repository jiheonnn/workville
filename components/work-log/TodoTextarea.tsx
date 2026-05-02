'use client'

import {
  useLayoutEffect,
  useRef,
  type ChangeEvent,
  type CompositionEvent,
  type KeyboardEvent,
} from 'react'

export const TODO_TEXTAREA_MIN_HEIGHT_PX = 24
export const TODO_TEXTAREA_MAX_HEIGHT_PX = 72

export const TODO_TEXTAREA_CLASS_NAME =
  'flex-1 min-h-[24px] max-h-[72px] resize-none overflow-y-auto whitespace-pre-wrap break-words bg-transparent text-gray-700 outline-none leading-6 placeholder-gray-400'

export function resizeTodoTextarea(textarea: HTMLTextAreaElement) {
  textarea.style.height = 'auto'

  const nextHeight = Math.min(
    Math.max(textarea.scrollHeight, TODO_TEXTAREA_MIN_HEIGHT_PX),
    TODO_TEXTAREA_MAX_HEIGHT_PX
  )

  // 이유: 3줄을 넘는 할 일이 전체 카드 높이를 계속 밀어내지 않도록 textarea 내부 스크롤로 넘깁니다.
  textarea.style.height = `${nextHeight}px`
  textarea.style.overflowY =
    textarea.scrollHeight > TODO_TEXTAREA_MAX_HEIGHT_PX ? 'auto' : 'hidden'
}

interface TodoEnterSubmitState {
  key: string
  shiftKey: boolean
  isComposing?: boolean
  isCompositionInProgress?: boolean
}

export function shouldSubmitTodoOnEnter({
  key,
  shiftKey,
  isComposing = false,
  isCompositionInProgress = false,
}: TodoEnterSubmitState) {
  return key === 'Enter' && !shiftKey && !isComposing && !isCompositionInProgress
}

interface TodoTextareaProps {
  value: string
  placeholder: string
  onChange: (value: string) => void
  onEnterWithoutShift?: () => void
}

export default function TodoTextarea({
  value,
  placeholder,
  onChange,
  onEnterWithoutShift,
}: TodoTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isComposingRef = useRef(false)

  useLayoutEffect(() => {
    if (textareaRef.current) {
      resizeTodoTextarea(textareaRef.current)
    }
  }, [value])

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    resizeTodoTextarea(event.currentTarget)
    onChange(event.currentTarget.value)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      shouldSubmitTodoOnEnter({
        key: event.key,
        shiftKey: event.shiftKey,
        isComposing: event.nativeEvent.isComposing,
        isCompositionInProgress: isComposingRef.current,
      }) &&
      onEnterWithoutShift
    ) {
      event.preventDefault()
      onEnterWithoutShift()
    }
  }

  const handleCompositionStart = (_event: CompositionEvent<HTMLTextAreaElement>) => {
    isComposingRef.current = true
  }

  const handleCompositionEnd = (_event: CompositionEvent<HTMLTextAreaElement>) => {
    // 이유: 일부 브라우저/IME 조합에서는 keyDown의 nativeEvent.isComposing 값이
    // 늦게 반영될 수 있어, React composition 이벤트 상태도 함께 기준으로 사용합니다.
    isComposingRef.current = false
  }

  return (
    <textarea
      ref={textareaRef}
      rows={1}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      placeholder={placeholder}
      className={TODO_TEXTAREA_CLASS_NAME}
    />
  )
}

'use client'

import { memo, useLayoutEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import { useWorkLogStore } from '@/lib/stores/work-log-store'

export const TODO_TEXTAREA_MIN_HEIGHT_PX = 24
export const TODO_TEXTAREA_MAX_HEIGHT_PX = 72

export const TODO_TEXTAREA_CLASS_NAME =
  'flex-1 min-h-[24px] max-h-[72px] resize-none overflow-y-auto whitespace-pre-wrap break-words bg-transparent text-gray-700 outline-none leading-6 placeholder-gray-400'

export const COMPLETED_TODO_TEXT_CLASS_NAME =
  'flex-1 max-h-[72px] overflow-y-auto whitespace-pre-wrap break-words text-gray-600 line-through leading-6'

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

interface TodoTextareaProps {
  value: string
  placeholder: string
  onChange: (value: string) => void
  onEnterWithoutShift?: () => void
}

function TodoTextarea({
  value,
  placeholder,
  onChange,
  onEnterWithoutShift,
}: TodoTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
    if (event.key === 'Enter' && !event.shiftKey && onEnterWithoutShift) {
      event.preventDefault()
      onEnterWithoutShift()
    }
  }

  return (
    <textarea
      ref={textareaRef}
      rows={1}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={TODO_TEXTAREA_CLASS_NAME}
    />
  )
}

const TodoSection = memo(function TodoSection() {
  const [newTodoText, setNewTodoText] = useState('')
  const { 
    currentLog, 
    addTodo, 
    toggleTodo, 
    deleteTodo, 
    updateTodoText 
  } = useWorkLogStore()

  const handleAddTodo = () => {
    if (newTodoText.trim()) {
      addTodo(newTodoText.trim())
      setNewTodoText('')
    }
  }

  if (!currentLog) return null

  return (
    <div className="space-y-6">
      {/* 오늘 할 일 */}
      <div className="bg-blue-50 rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          ✈️ 오늘 할 일
          <span className="text-sm font-normal text-gray-600">
            ({currentLog.todos.length}개)
          </span>
        </h3>
        
        <div className="space-y-2">
          {currentLog.todos.map((todo) => {
            const isCarriedOver = todo.text.startsWith('[어제 못한일]')
            const displayText = isCarriedOver 
              ? todo.text.replace('[어제 못한일] ', '') 
              : todo.text
            
            return (
              <div
                key={todo.id}
                className="flex items-start gap-3 p-3 bg-white rounded-lg hover:shadow-sm transition-all"
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id)}
                  className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                />
                <div className="flex-1 flex items-start gap-2">
                  {isCarriedOver && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 whitespace-nowrap">
                      어제 못한일
                    </span>
                  )}
                  <TodoTextarea
                    value={displayText}
                    onChange={(value) => {
                      const newText = isCarriedOver 
                        ? `[어제 못한일] ${value}`
                        : value
                      updateTodoText(todo.id, newText)
                    }}
                    placeholder="할 일을 입력하세요"
                  />
                </div>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )
          })}
          
          {/* 새 TO-DO 추가 */}
          <div className="flex items-center gap-3 p-3 bg-white/70 rounded-lg border-2 border-dashed border-blue-200">
            <div className="w-5 h-5 flex items-center justify-center">
              <span className="text-blue-500 text-xl">+</span>
            </div>
            <TodoTextarea
              value={newTodoText}
              onChange={setNewTodoText}
              onEnterWithoutShift={handleAddTodo}
              placeholder="새로운 할 일 추가..."
            />
            {newTodoText && (
              <button
                onClick={handleAddTodo}
                className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
              >
                추가
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 완료한 일 */}
      {currentLog.completed_todos.length > 0 && (
        <div className="bg-green-50 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            ✅ 완료한 일
            <span className="text-sm font-normal text-gray-600">
              ({currentLog.completed_todos.length}개)
            </span>
          </h3>
          
          <div className="space-y-2">
            {currentLog.completed_todos.map((todo) => (
              <div
                key={todo.id}
                className="flex items-start gap-3 p-3 bg-white/70 rounded-lg"
              >
                <input
                  type="checkbox"
                  checked={true}
                  onChange={() => toggleTodo(todo.id)}
                  className="mt-1 w-5 h-5 text-green-600 rounded focus:ring-green-500 cursor-pointer"
                />
                <span className={COMPLETED_TODO_TEXT_CLASS_NAME}>
                  {todo.text}
                </span>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
})

export default TodoSection

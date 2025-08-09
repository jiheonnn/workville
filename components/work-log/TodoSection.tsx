'use client'

import { useState, memo } from 'react'
import { useWorkLogStore, TodoItem } from '@/lib/stores/work-log-store'

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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAddTodo()
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
          {currentLog.todos.map((todo) => (
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
              <input
                type="text"
                value={todo.text}
                onChange={(e) => updateTodoText(todo.id, e.target.value)}
                className="flex-1 bg-transparent outline-none text-gray-700"
                placeholder="할 일을 입력하세요"
              />
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
          
          {/* 새 TO-DO 추가 */}
          <div className="flex items-center gap-3 p-3 bg-white/70 rounded-lg border-2 border-dashed border-blue-200">
            <div className="w-5 h-5 flex items-center justify-center">
              <span className="text-blue-500 text-xl">+</span>
            </div>
            <input
              type="text"
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="새로운 할 일 추가..."
              className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400"
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
                <span className="flex-1 text-gray-600 line-through">
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
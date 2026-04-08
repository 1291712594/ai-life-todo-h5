import React, { useCallback, useRef } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useLongPress } from '../hooks/useLongPress.js'
import { categoryMap } from '../utils/timeHelper.js'

function TodoItem({ todo, index, onLongPress, onTimeClick }) {
  const { toggleTodoComplete, dynamicTagsEnabled } = useApp()
  const isClickRef = useRef(false)
  const timeTouchTriggeredRef = useRef(false)

  const handleToggle = useCallback((e) => {
    e.stopPropagation()
    isClickRef.current = true
    setTimeout(() => {
      isClickRef.current = false
    }, 100)
    toggleTodoComplete(todo._id)
  }, [todo._id, toggleTodoComplete])

  const handleLongPress = useCallback(() => {
    if (isClickRef.current) return
    if (window.navigator.vibrate) {
      window.navigator.vibrate(50)
    }
    onLongPress(todo, index)
  }, [todo, index, onLongPress])

  const longPressHandlers = useLongPress(handleLongPress, { delay: 500 })

  const getTagClass = (tag) => {
    if (tag === '工作') return 'todo-tag work'
    if (tag === '育儿') return 'todo-tag parenting'
    return 'todo-tag'
  }

  const handleTimeClick = useCallback((e) => {
    if (timeTouchTriggeredRef.current) {
      timeTouchTriggeredRef.current = false
      return
    }
    e.stopPropagation()
    onTimeClick?.(todo)
  }, [onTimeClick, todo])

  const handleTimeTouchEnd = useCallback((e) => {
    timeTouchTriggeredRef.current = true
    e.preventDefault()
    e.stopPropagation()
    onTimeClick?.(todo)
  }, [onTimeClick, todo])

  return (
    <div 
      className="todo-item"
      {...longPressHandlers}
    >
      <div 
        className={`todo-checkbox ${todo.isCompleted ? 'checked' : ''}`}
        onClick={handleToggle}
      />
      <div className="todo-content">
        <div className={`todo-text ${todo.isCompleted ? 'completed' : ''}`}>
          {todo.content}
        </div>
        <div className="todo-meta">
          {todo.displayTime && (
            <span
              className="todo-time"
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={handleTimeTouchEnd}
              onClick={handleTimeClick}
            >
              {todo.displayTime}
            </span>
          )}
          <div className="todo-tags-right">
            <span className="todo-category">
              {categoryMap[todo.category] || '其他'}
            </span>
            {dynamicTagsEnabled && todo.dynamicTag && (
              <span className={getTagClass(todo.dynamicTag)}>
                {todo.dynamicTag}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TodoItem

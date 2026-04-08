import React, { useState, useCallback } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { parseInput } from '../utils/parseInput.js'

function TodoInput() {
  const [inputValue, setInputValue] = useState('')
  const { addTodoItem } = useApp()

  const handleInputChange = useCallback((e) => {
    setInputValue(e.target.value)
  }, [])

  const handleAdd = useCallback(async () => {
    const trimmedValue = inputValue.trim()
    if (!trimmedValue) {
      alert('写点内容吧')
      return
    }

    const parsed = parseInput(trimmedValue)

    if (parsed.timeError) {
      alert('时间格式错误，请使用 HH:MM 格式（例如 14:30）')
      return
    }

    try {
      await addTodoItem({
        content: parsed.content,
        category: parsed.category,
        time: parsed.time,
        displayTime: parsed.displayTime
      })
      setInputValue('')
    } catch (error) {
      console.error('添加失败:', error)
      alert(`添加失败: ${error.message || '请检查网络连接或后端服务是否运行'}`)
    }
  }, [inputValue, addTodoItem])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAdd()
    }
  }, [handleAdd])

  return (
    <div className="input-section">
      <input
        type="text"
        className="input-area"
        placeholder="添加待办事项，例如：明天下午3点开会"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
      />
      <button className="add-btn" onClick={handleAdd}>
        添加
      </button>
    </div>
  )
}

export default TodoInput

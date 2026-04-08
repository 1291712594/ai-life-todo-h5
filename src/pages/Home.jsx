import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import TodoInput from '../components/TodoInput.jsx'
import CategoryTabs from '../components/CategoryTabs.jsx'
import TodoItem from '../components/TodoItem.jsx'
import TimePickerModal from '../components/TimePickerModal.jsx'
import ConfirmModal from '../components/ConfirmModal.jsx'
import { addTodo } from '../api.js'
import { categoryOptions, extractDateLabel } from '../utils/timeHelper.js'
import { hasShownFirstTip, setHasShownFirstTip } from '../utils/storage.js'

function Home() {
  const {
    filteredTodos,
    loading,
    isOnline,
    isRefreshing,
    loadTodos,
    refreshTodos,
    deleteTodoItem,
    updateTodoItem,
    currentTab,
    todos
  } = useApp()

  const [showFirstTip, setShowFirstTip] = useState(false)
  const [showActionSheet, setShowActionSheet] = useState(false)
  const [actionTargetItem, setActionTargetItem] = useState(null)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [showUndoToast, setShowUndoToast] = useState(false)
  const [deletedItem, setDeletedItem] = useState(null)
  const [pullDistance, setPullDistance] = useState(0)
  const [canReleaseToRefresh, setCanReleaseToRefresh] = useState(false)
  const undoTimerRef = useRef(null)
  const todoListRef = useRef(null)
  const pullStartYRef = useRef(0)
  const pullDistanceRef = useRef(0)
  const isPullTrackingRef = useRef(false)

  useEffect(() => {
    loadTodos()
    
    if (!hasShownFirstTip()) {
      setShowFirstTip(true)
      setHasShownFirstTip(true)
      setTimeout(() => {
        setShowFirstTip(false)
      }, 3000)
    }
  }, [loadTodos])

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current)
      }
    }
  }, [])

  const handleLongPress = useCallback((item, index) => {
    setActionTargetItem(item)
    setShowActionSheet(true)
  }, [])

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return
    await refreshTodos()
  }, [isRefreshing, refreshTodos])

  const resetPullRefreshState = useCallback(() => {
    isPullTrackingRef.current = false
    pullDistanceRef.current = 0
    setPullDistance(0)
    setCanReleaseToRefresh(false)
  }, [])

  const handlePullTouchStart = useCallback((event) => {
    if (loading || isRefreshing) return
    const list = todoListRef.current
    if (!list || list.scrollTop !== 0) return
    const touch = event.touches?.[0]
    if (!touch) return

    isPullTrackingRef.current = true
    pullStartYRef.current = touch.clientY
    pullDistanceRef.current = 0
  }, [isRefreshing, loading])

  const handlePullTouchMove = useCallback((event) => {
    if (loading || isRefreshing || !isPullTrackingRef.current) return
    const list = todoListRef.current
    if (!list) return
    if (list.scrollTop !== 0) {
      resetPullRefreshState()
      return
    }

    const touch = event.touches?.[0]
    if (!touch) return
    const delta = touch.clientY - pullStartYRef.current
    if (delta <= 0) {
      pullDistanceRef.current = 0
      setPullDistance(0)
      setCanReleaseToRefresh(false)
      return
    }

    event.preventDefault()
    pullDistanceRef.current = delta
    setPullDistance(Math.min(delta, 80))
    setCanReleaseToRefresh(delta > 50)
  }, [isRefreshing, loading, resetPullRefreshState])

  const handlePullTouchEnd = useCallback(async () => {
    if (!isPullTrackingRef.current) {
      resetPullRefreshState()
      return
    }

    const shouldRefresh = pullDistanceRef.current > 50 && !loading && !isRefreshing
    resetPullRefreshState()
    if (shouldRefresh) {
      await handleRefresh()
    }
  }, [handleRefresh, isRefreshing, loading, resetPullRefreshState])

  useEffect(() => {
    const list = todoListRef.current
    if (!list) return

    list.addEventListener('touchstart', handlePullTouchStart, { passive: true })
    list.addEventListener('touchmove', handlePullTouchMove, { passive: false })
    list.addEventListener('touchend', handlePullTouchEnd)
    list.addEventListener('touchcancel', resetPullRefreshState)

    return () => {
      list.removeEventListener('touchstart', handlePullTouchStart)
      list.removeEventListener('touchmove', handlePullTouchMove)
      list.removeEventListener('touchend', handlePullTouchEnd)
      list.removeEventListener('touchcancel', resetPullRefreshState)
    }
  }, [handlePullTouchEnd, handlePullTouchMove, handlePullTouchStart, resetPullRefreshState])

  const closeActionSheet = useCallback((clearTarget = true) => {
    setShowActionSheet(false)
    if (clearTarget) {
      setActionTargetItem(null)
    }
  }, [])

  const handleDelete = useCallback(() => {
    setShowConfirmDelete(true)
    closeActionSheet(false)
  }, [closeActionSheet])

  const confirmDelete = useCallback(async () => {
    const targetItem = actionTargetItem
    if (!targetItem) {
      setShowConfirmDelete(false)
      return
    }

    try {
      await deleteTodoItem(targetItem._id)
      setDeletedItem(targetItem)
      setShowUndoToast(true)

      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current)
      }
      undoTimerRef.current = setTimeout(() => {
        setShowUndoToast(false)
        setDeletedItem(null)
      }, 3000)
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除失败，请重试')
    } finally {
      setShowConfirmDelete(false)
      setActionTargetItem(null)
    }
  }, [actionTargetItem, deleteTodoItem])

  const handleUndoDelete = useCallback(async () => {
    if (!deletedItem) return

    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current)
    }

    try {
      await addTodo({
        content: deletedItem.content,
        category: deletedItem.category,
        time: deletedItem.time || null,
        displayTime: deletedItem.displayTime || null,
        dateLabel: deletedItem.dateLabel || extractDateLabel(deletedItem.displayTime)
      })
      await refreshTodos()
      setShowUndoToast(false)
      setDeletedItem(null)
    } catch (error) {
      alert('恢复失败，请重试')
    }
  }, [deletedItem, refreshTodos])

  const handleChangeTime = useCallback(() => {
    setShowTimePicker(true)
    closeActionSheet(false)
  }, [closeActionSheet])

  const handleTimeTextClick = useCallback((item) => {
    setActionTargetItem(item)
    setShowTimePicker(true)
  }, [])

  const confirmTimeChange = useCallback(async (newTime) => {
    const targetItem = actionTargetItem
    if (!targetItem) {
      setShowTimePicker(false)
      return
    }

    const currentTodo = todos.find(t => t._id === targetItem._id)
    const dateLabel = currentTodo?.dateLabel || extractDateLabel(currentTodo?.displayTime) || '今天'
    const newDisplayTime = `${dateLabel} ${newTime}`

    try {
      await updateTodoItem(targetItem._id, { 
        time: newTime, 
        displayTime: newDisplayTime,
        dateLabel
      })
      setShowTimePicker(false)
      setActionTargetItem(null)
    } catch (error) {
      alert('修改时间失败')
    }
  }, [actionTargetItem, todos, updateTodoItem])

  const handleChangeCategory = useCallback(() => {
    setShowCategoryPicker(true)
    closeActionSheet(false)
  }, [closeActionSheet])

  const confirmCategoryChange = useCallback(async (newCategory) => {
    if (!actionTargetItem || newCategory === actionTargetItem.category) {
      setShowCategoryPicker(false)
      setActionTargetItem(null)
      return
    }

    try {
      await updateTodoItem(actionTargetItem._id, { category: newCategory })
      setShowCategoryPicker(false)
      setActionTargetItem(null)
    } catch (error) {
      alert('修改分类失败')
    }
  }, [actionTargetItem, updateTodoItem])

  const getInitialTime = useCallback(() => {
    if (!actionTargetItem) return '12:00'
    return actionTargetItem.time || '12:00'
  }, [actionTargetItem])

  const showPullRefresh = pullDistance > 0 || isRefreshing

  return (
    <div className="page">
      {/* 导航栏 */}
      <div className="nav-bar">
        <div className="nav-title">AI极简清单</div>
        <div className="nav-right">
          <div className={`sync-status ${isOnline ? 'online' : 'offline'}`}>
            <div className={`sync-icon ${isOnline ? 'online' : 'offline'}`} />
            <span className="sync-text">{isOnline ? '在线' : '离线'}</span>
          </div>
          <Link to="/settings" className="settings-btn" style={{ textDecoration: 'none' }}>
            ⚙️
          </Link>
        </div>
      </div>

      {/* 输入区域 */}
      <TodoInput />

      {/* 分类标签 */}
      <CategoryTabs />

      {/* 清单列表 */}
      <div
        ref={todoListRef}
        className="todo-list"
      >
        {showPullRefresh && (
          <div
            className="pull-refresh"
            style={{
              height: `${isRefreshing ? 48 : Math.max(36, pullDistance)}px`
            }}
          >
            <div className={`pull-refresh-icon ${isRefreshing ? 'spinning' : ''}`} />
            <span>
              {isRefreshing ? '刷新中...' : canReleaseToRefresh ? '松开刷新' : '下拉刷新'}
            </span>
          </div>
        )}
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner" />
            <span>加载中...</span>
          </div>
        ) : filteredTodos.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <div className="empty-text">
              {currentTab === 'all' ? '暂无待办事项' : '该分类下暂无事项'}
            </div>
          </div>
        ) : (
          filteredTodos.map((todo, index) => (
            <TodoItem
              key={todo._id}
              todo={todo}
              index={index}
              onLongPress={handleLongPress}
              onTimeClick={handleTimeTextClick}
            />
          ))
        )}
      </div>

      {/* 首次提示 */}
      {showFirstTip && (
        <div className="first-tip">
          数据存于云端，换设备不丢失
        </div>
      )}

      {/* 长按菜单 */}
      <div className={`action-sheet-mask ${showActionSheet ? 'show' : ''}`} onClick={closeActionSheet}>
        <div className="action-sheet" onClick={e => e.stopPropagation()}>
          <div className="action-sheet-item" onClick={handleChangeTime}>
            修改时间
          </div>
          <div className="action-sheet-item" onClick={handleChangeCategory}>
            修改分类
          </div>
          <div className="action-sheet-item danger" onClick={handleDelete}>
            删除
          </div>
          <div className="action-sheet-item action-sheet-cancel" onClick={closeActionSheet}>
            取消
          </div>
        </div>
      </div>

      {/* 时间选择器 */}
      <TimePickerModal
        isOpen={showTimePicker}
        onClose={() => {
          setShowTimePicker(false)
          setActionTargetItem(null)
        }}
        onConfirm={confirmTimeChange}
        initialTime={getInitialTime()}
      />

      {/* 分类选择器 */}
      <div className={`modal-mask ${showCategoryPicker ? 'show' : ''}`} onClick={() => setShowCategoryPicker(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title">修改分类</div>
          </div>
          <div className="modal-body">
            <div className="category-options">
              {categoryOptions.map(option => (
                <div
                  key={option.value}
                  className={`category-option ${actionTargetItem?.category === option.value ? 'selected' : ''}`}
                  onClick={() => confirmCategoryChange(option.value)}
                >
                  {option.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 删除确认 */}
      <ConfirmModal
        open={showConfirmDelete}
        isOpen={showConfirmDelete}
        onClose={() => {
          setShowConfirmDelete(false)
          setActionTargetItem(null)
        }}
        onConfirm={confirmDelete}
        title="提示"
        message="确定删除吗？"
      />

      {/* 撤销提示 */}
      {showUndoToast && (
        <div className="undo-toast">
          <span>已删除</span>
          <span className="undo-btn" onClick={handleUndoDelete}>
            撤销
          </span>
        </div>
      )}

      {import.meta.env.DEV && (
        <button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: isRefreshing ? '#ccc' : '#07c160',
            color: 'white',
            border: 'none',
            fontSize: '20px',
            cursor: isRefreshing ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100
          }}
        >
          {isRefreshing ? '⏳' : '🔄'}
        </button>
      )}
    </div>
  )
}

export default Home

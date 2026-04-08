import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { 
  getUserType, 
  setUserType as saveUserType,
  getDynamicTagsEnabled,
  setDynamicTagsEnabled as saveDynamicTagsEnabled
} from '../utils/storage.js'
import { getTodos, addTodo as apiAddTodo, updateTodo as apiUpdateTodo, deleteTodo as apiDeleteTodo } from '../api.js'
import { sortTodos, categoryMap, extractDateLabel } from '../utils/timeHelper.js'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [todos, setTodos] = useState([])
  const [filteredTodos, setFilteredTodos] = useState([])
  const [loading, setLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(true)
  const [userType, setUserTypeState] = useState(getUserType())
  const [dynamicTagsEnabled, setDynamicTagsEnabledState] = useState(getDynamicTagsEnabled())
  const [currentTab, setCurrentTab] = useState('all')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const tabs = [
    { label: '全部', value: 'all' },
    { label: '购物', value: 'shopping' },
    { label: '日程', value: 'schedule' },
    { label: '其他', value: 'other' },
    { label: '已完成', value: 'completed' }
  ]

  const normalizeCategory = useCallback((category) => {
    if (category === 'shopping' || category === 'schedule' || category === 'other') {
      return category
    }
    return 'other'
  }, [])

  const computeDynamicTag = useCallback((content, category) => {
    if (!content) return null

    const babyKeywords = ['奶粉', '尿布', '玩具', '辅食', '童装', '接孩子', '送孩子', '家长会', '幼儿园', '亲子', '儿童', '宝贝']
    const workKeywords = ['开会', '会议', '汇报', '周报', '面试', '需求', '评审', '办公用品', '文件', '打印', '资料', '合同']

    for (const kw of babyKeywords) {
      if (content.includes(kw)) return '育儿'
    }

    for (const kw of workKeywords) {
      if (content.includes(kw)) return '工作'
    }

    return null
  }, [])

  const applyFilterAndSort = useCallback(() => {
    let filtered = [...todos]

    if (currentTab === 'completed') {
      filtered = filtered.filter(t => t.isCompleted)
      filtered = sortTodos(filtered, userType, currentTab)
    } else if (currentTab !== 'all') {
      filtered = filtered.filter(t => normalizeCategory(t.category) === currentTab && !t.isCompleted)
      filtered = sortTodos(filtered, userType, currentTab)
    } else {
      const uncompleted = filtered.filter(t => !t.isCompleted)
      const completed = filtered.filter(t => t.isCompleted)
      filtered = [...sortTodos(uncompleted, userType, currentTab), ...sortTodos(completed, userType, currentTab)]
    }

    setFilteredTodos(filtered)
  }, [todos, currentTab, userType, normalizeCategory])

  useEffect(() => {
    applyFilterAndSort()
  }, [applyFilterAndSort])

  const loadTodos = useCallback(async (options = {}) => {
    const { silent = false } = options
    
    if (!navigator.onLine) {
      setIsOnline(false)
      setLoading(false)
      setIsRefreshing(false)
      return
    }

    if (!silent) setLoading(true)
    
    try {
      const todoList = await getTodos()
      const todosWithTags = todoList.map(todo => ({
        ...todo,
        category: normalizeCategory(todo.category),
        dateLabel: todo.dateLabel || extractDateLabel(todo.displayTime),
        dynamicTag: computeDynamicTag(todo.content, normalizeCategory(todo.category))
      }))
      setTodos(todosWithTags)
      setIsOnline(true)
    } catch (error) {
      console.error('加载清单失败:', error)
      setIsOnline(false)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [computeDynamicTag, normalizeCategory])

  const refreshTodos = useCallback(async () => {
    setIsRefreshing(true)
    await loadTodos({ silent: true })
  }, [loadTodos])

  const addTodoItem = useCallback(async (todoData) => {
    if (!navigator.onLine) {
      throw new Error('网络不可用')
    }
    
    try {
      await apiAddTodo(todoData)
      await loadTodos({ silent: true })
    } catch (error) {
      console.error('添加事项失败:', error)
      throw error
    }
  }, [loadTodos])

  const updateTodoItem = useCallback(async (id, updates) => {
    if (!navigator.onLine) {
      throw new Error('网络不可用')
    }

    try {
      await apiUpdateTodo(id, updates)
      setTodos(prev => prev.map(todo =>
        todo._id === id ? {
          ...todo,
          ...updates,
          category: normalizeCategory(updates.category ?? todo.category),
          dateLabel: extractDateLabel(updates.displayTime ?? todo.displayTime),
          updatedAt: new Date().toISOString(),
          dynamicTag: computeDynamicTag(updates.content ?? todo.content, normalizeCategory(updates.category ?? todo.category))
        } : todo
      ))
    } catch (error) {
      console.error('更新事项失败:', error)
      throw error
    }
  }, [computeDynamicTag, normalizeCategory])

  const deleteTodoItem = useCallback(async (id) => {
    try {
      await apiDeleteTodo(id)
      setTodos(prev => prev.filter(todo => todo._id !== id))
    } catch (error) {
      console.error('删除事项失败:', error)
      throw error
    }
  }, [])

  const toggleTodoComplete = useCallback(async (id) => {
    const todo = todos.find(t => t._id === id)
    if (!todo) return
    
    const newStatus = !todo.isCompleted
    await updateTodoItem(id, { isCompleted: newStatus })
  }, [todos, updateTodoItem])

  const setUserType = useCallback((type) => {
    setUserTypeState(type)
    saveUserType(type)
  }, [])

  // 网络状态监听 - 放在 loadTodos 定义之后
  const checkNetworkStatus = useCallback(() => {
    const online = navigator.onLine
    setIsOnline(online)
    // 网络恢复时自动重新加载数据
    if (online) {
      loadTodos()
    }
  }, [loadTodos])

  useEffect(() => {
    checkNetworkStatus()
    window.addEventListener('online', checkNetworkStatus)
    window.addEventListener('offline', checkNetworkStatus)
    return () => {
      window.removeEventListener('online', checkNetworkStatus)
      window.removeEventListener('offline', checkNetworkStatus)
    }
  }, [checkNetworkStatus])

  const setDynamicTagsEnabled = useCallback((enabled) => {
    setDynamicTagsEnabledState(enabled)
    saveDynamicTagsEnabled(enabled)
    setTodos(prev => prev.map(todo => ({
      ...todo,
      dynamicTag: computeDynamicTag(todo.content, normalizeCategory(todo.category))
    })))
  }, [computeDynamicTag, normalizeCategory])

  const value = {
    todos,
    filteredTodos,
    loading,
    isOnline,
    isRefreshing,
    userType,
    dynamicTagsEnabled,
    currentTab,
    tabs,
    categoryMap,
    setCurrentTab,
    loadTodos,
    refreshTodos,
    addTodoItem,
    updateTodoItem,
    deleteTodoItem,
    toggleTodoComplete,
    setUserType,
    setDynamicTagsEnabled,
    computeDynamicTag
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

export default AppContext

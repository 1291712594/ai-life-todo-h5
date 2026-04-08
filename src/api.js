import { getUserId } from './utils/storage.js'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

// 模拟数据 - 用于前端开发和测试
let mockTodos = [
  {
    _id: 'mock-1',
    content: '去超市买牛奶和面包',
    category: 'shopping',
    isCompleted: false,
    time: null,
    displayTime: null,
    createdAt: new Date().toISOString()
  },
  {
    _id: 'mock-2',
    content: '完成项目报告',
    category: 'other',
    isCompleted: false,
    time: null,
    displayTime: null,
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    _id: 'mock-3',
    content: '晚上7点健身',
    category: 'schedule',
    isCompleted: false,
    time: '19:00',
    displayTime: '今天 19:00',
    createdAt: new Date(Date.now() - 172800000).toISOString()
  },
  {
    _id: 'mock-4',
    content: '阅读30分钟',
    category: 'other',
    isCompleted: false,
    time: null,
    displayTime: null,
    createdAt: new Date(Date.now() - 259200000).toISOString()
  },
  {
    _id: 'mock-5',
    content: '明天下午3点开会',
    category: 'schedule',
    isCompleted: false,
    time: '15:00',
    displayTime: '明天 15:00',
    createdAt: new Date().toISOString()
  }
]

const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms))

// 生成唯一ID
const generateId = () => 'mock-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)

async function mockRequest(path, options = {}) {
  const { method = 'GET', body } = options
  await delay(300)

  if (path === '/todos' && method === 'GET') {
    return { success: true, data: [...mockTodos] }
  }

  if (path === '/todos' && method === 'POST') {
    const newTodo = {
      _id: generateId(),
      ...body,
      isCompleted: false,
      createdAt: new Date().toISOString()
    }
    mockTodos.unshift(newTodo)
    return { success: true, data: newTodo }
  }

  const todoIdMatch = path.match(/^\/todos\/(.+)$/)
  if (!todoIdMatch) {
    throw new Error('未匹配的 mock 接口')
  }
  const id = todoIdMatch[1]
  const index = mockTodos.findIndex(t => t._id === id)
  if (index === -1) {
    throw new Error('事项不存在')
  }

  if (method === 'PATCH') {
    mockTodos[index] = { ...mockTodos[index], ...body }
    return { success: true, data: mockTodos[index] }
  }

  if (method === 'DELETE') {
    mockTodos.splice(index, 1)
    return { success: true, data: null }
  }

  throw new Error('未支持的 mock 请求方法')
}

async function request(path, options = {}) {
  const { method = 'GET', body } = options
  const headers = {
    'X-User-Id': getUserId()
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  if (import.meta.env.DEV) {
    const mockResult = await mockRequest(path, { method, body })
    return mockResult?.data ?? mockResult
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || `请求失败(${response.status})`)
  }

  const result = await response.json().catch(() => null)
  return result?.data ?? result
}

export async function getTodos() {
  return request('/todos')
}

export async function addTodo(todo) {
  return request('/todos', { method: 'POST', body: todo })
}

export async function updateTodo(id, updates) {
  return request(`/todos/${id}`, { method: 'PATCH', body: updates })
}

export async function deleteTodo(id) {
  return request(`/todos/${id}`, { method: 'DELETE' })
}

export default {
  getTodos,
  addTodo,
  updateTodo,
  deleteTodo
}

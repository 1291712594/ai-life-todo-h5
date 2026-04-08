const STORAGE_KEYS = {
  USER_TYPE: 'userType',
  DYNAMIC_TAGS_ENABLED: 'dynamicTagsEnabled',
  USER_ID: 'userId',
  HAS_SHOWN_FIRST_TIP: 'hasShownFirstTip'
}

// 内存存储降级方案
const memoryStorage = {}

export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export function getUserId() {
  try {
    let userId = localStorage.getItem(STORAGE_KEYS.USER_ID)
    if (!userId) {
      userId = generateUUID()
      localStorage.setItem(STORAGE_KEYS.USER_ID, userId)
    }
    return userId
  } catch (e) {
    console.warn('localStorage 不可用，使用内存存储')
    if (!memoryStorage[STORAGE_KEYS.USER_ID]) {
      memoryStorage[STORAGE_KEYS.USER_ID] = generateUUID()
    }
    return memoryStorage[STORAGE_KEYS.USER_ID]
  }
}

export function getUserType() {
  try {
    return localStorage.getItem(STORAGE_KEYS.USER_TYPE) || '上班族'
  } catch (e) {
    console.warn('localStorage 不可用，使用内存存储')
    return memoryStorage[STORAGE_KEYS.USER_TYPE] || '上班族'
  }
}

export function setUserType(userType) {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_TYPE, userType)
  } catch (e) {
    console.warn('localStorage 不可用，使用内存存储')
    memoryStorage[STORAGE_KEYS.USER_TYPE] = userType
  }
}

export function getDynamicTagsEnabled() {
  try {
    const value = localStorage.getItem(STORAGE_KEYS.DYNAMIC_TAGS_ENABLED)
    return value === null ? true : value === 'true'
  } catch (e) {
    console.warn('localStorage 不可用，使用内存存储')
    const value = memoryStorage[STORAGE_KEYS.DYNAMIC_TAGS_ENABLED]
    return value === undefined ? true : value === 'true'
  }
}

export function setDynamicTagsEnabled(enabled) {
  try {
    localStorage.setItem(STORAGE_KEYS.DYNAMIC_TAGS_ENABLED, String(enabled))
  } catch (e) {
    console.warn('localStorage 不可用，使用内存存储')
    memoryStorage[STORAGE_KEYS.DYNAMIC_TAGS_ENABLED] = String(enabled)
  }
}

export function hasShownFirstTip() {
  try {
    return localStorage.getItem(STORAGE_KEYS.HAS_SHOWN_FIRST_TIP) === 'true'
  } catch (e) {
    console.warn('localStorage 不可用，使用内存存储')
    return memoryStorage[STORAGE_KEYS.HAS_SHOWN_FIRST_TIP] === 'true'
  }
}

export function setHasShownFirstTip(shown) {
  try {
    localStorage.setItem(STORAGE_KEYS.HAS_SHOWN_FIRST_TIP, String(shown))
  } catch (e) {
    console.warn('localStorage 不可用，使用内存存储')
    memoryStorage[STORAGE_KEYS.HAS_SHOWN_FIRST_TIP] = String(shown)
  }
}

export default {
  getUserId,
  getUserType,
  setUserType,
  getDynamicTagsEnabled,
  setDynamicTagsEnabled,
  hasShownFirstTip,
  setHasShownFirstTip
}

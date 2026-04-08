export function getTimestamp(displayTime) {
  if (!displayTime) return Infinity
  
  const now = new Date()
  let targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const timeMatch = displayTime.match(/(\d{1,2}):(\d{2})/)
  const hour = timeMatch ? parseInt(timeMatch[1]) : 0
  const minute = timeMatch ? parseInt(timeMatch[2]) : 0
  targetDate.setHours(hour, minute, 0, 0)

  if (displayTime.includes('后天')) {
    targetDate.setDate(targetDate.getDate() + 2)
  } else if (displayTime.includes('明天')) {
    targetDate.setDate(targetDate.getDate() + 1)
  } else if (displayTime.includes('今天')) {
    // today, no change needed
  } else if (/(本周|这周|下周)\s*[一二三四五六日天]/.test(displayTime)) {
    const prefixedWeekdayMatch = displayTime.match(/(本周|这周|下周)\s*([一二三四五六日天])/)
    const dayMap = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '日': 0, '天': 0 }
    if (prefixedWeekdayMatch) {
      const prefix = prefixedWeekdayMatch[1]
      const weekday = dayMap[prefixedWeekdayMatch[2]]
      const currentDay = now.getDay()
      const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay
      const currentWeekMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset)
      const baseMonday = new Date(currentWeekMonday)
      if (prefix === '下周') {
        baseMonday.setDate(baseMonday.getDate() + 7)
      }
      const targetOffset = weekday === 0 ? 6 : weekday - 1
      targetDate = new Date(baseMonday)
      targetDate.setDate(baseMonday.getDate() + targetOffset)
      targetDate.setHours(hour, minute, 0, 0)
    }
  } else if (/(周[一二三四五六日天]|星期[一二三四五六日天])/.test(displayTime)) {
    const weekdayMap = { 
      '周一': 1, '周二': 2, '周三': 3, '周四': 4, '周五': 5, '周六': 6, '周日': 0,
      '周天': 0, '周日': 0
    }
    let matchedWeekday = null
    for (const [key, val] of Object.entries(weekdayMap)) {
      if (displayTime.includes(key)) {
        matchedWeekday = val
        break
      }
    }
    if (matchedWeekday !== null) {
      const currentDay = now.getDay()
      let diff = matchedWeekday - currentDay
      if (diff <= 0) diff += 7
      targetDate.setDate(targetDate.getDate() + diff)
    }
  }

  return targetDate.getTime()
}

export function extractDateLabel(displayTime) {
  if (!displayTime) return ''
  return displayTime.replace(/\s*\d{1,2}:\d{2}\s*$/, '').trim()
}

export function sortTodos(list, userType, currentTab) {
  const sortedList = [...list]
  const getOfficeRank = (category) => {
    if (category === 'schedule') return 0
    if (category === 'shopping') return 1
    return 2
  }

  if (currentTab === 'completed') {
    return sortedList.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  }

  if (userType === '上班族') {
    return sortedList.sort((a, b) => {
      if (currentTab === 'all') {
        const rankDiff = getOfficeRank(a.category) - getOfficeRank(b.category)
        if (rankDiff !== 0) return rankDiff
      }

      if (a.category === 'schedule' && b.category === 'schedule') {
        const tsA = getTimestamp(a.displayTime)
        const tsB = getTimestamp(b.displayTime)
        return tsA - tsB
      }
      if (a.category === 'schedule') return -1
      if (b.category === 'schedule') return 1
      return new Date(b.createdAt) - new Date(a.createdAt)
    })
  } else {
    // 宝妈
    return sortedList.sort((a, b) => {
      if (a.category === 'shopping' && b.category !== 'shopping') return -1
      if (b.category === 'shopping' && a.category !== 'shopping') return 1
      if (a.category === 'schedule' && b.category === 'schedule') {
        const tsA = getTimestamp(a.displayTime)
        const tsB = getTimestamp(b.displayTime)
        return tsA - tsB
      }
      if (a.category === 'schedule' && b.category === 'other') return -1
      if (a.category === 'other' && b.category === 'schedule') return 1
      return new Date(b.createdAt) - new Date(a.createdAt)
    })
  }
}

export const categoryMap = {
  shopping: '购物',
  schedule: '日程',
  other: '其他'
}

export const categoryOptions = [
  { label: '购物', value: 'shopping' },
  { label: '日程', value: 'schedule' },
  { label: '其他', value: 'other' }
]

export default {
  getTimestamp,
  extractDateLabel,
  sortTodos,
  categoryMap,
  categoryOptions
}

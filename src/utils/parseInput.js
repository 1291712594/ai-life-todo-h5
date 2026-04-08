export function parseInput(text) {
  let time = null
  let displayTime = null
  let category = 'other'

  const chineseNumMap = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10, '两': 2, '廿': 20, '零': 0 }
  const chineseTimeRegex = /(上午|下午|晚上|早上|中午)?\s*([零一二三四五六七八九十两廿]+)\s*[点时：:]\s*(半|一刻|三刻|(?:[零一二三四五六七八九十两廿十]+)(?:分|钟)?)?/
  const prefixedWeekDayRegex = /(下周|本周|这周)\s*([一二三四五六日天])/
  const weekDayRegex = /(周[一二三四五六日天1-7]|星期[一二三四五六日天])/

  function parseChineseNumber(str) {
    if (!str) return 0
    if (str === '十') return 10
    if (str === '两') return 2
    if (str === '廿') return 20
    if (str === '零') return 0
    if (str.length === 1) return chineseNumMap[str] || parseInt(str) || 0
    if (str.includes('十')) {
      const parts = str.split('十')
      if (parts[0] === '' && parts[1]) return 10 + (chineseNumMap[parts[1]] || 0)
      if (parts[0] === '') return 10
      if (parts[1] === '') return (chineseNumMap[parts[0]] || 1) * 10
      return (chineseNumMap[parts[0]] || 1) * 10 + (chineseNumMap[parts[1]] || 0)
    }
    return chineseNumMap[str] || parseInt(str) || 0
  }

  function parseChineseMinute(str) {
    if (!str) return 0
    if (str === '半') return 30
    if (str === '一刻') return 15
    if (str === '三刻') return 45
    const cleaned = str.replace(/[分钟]/g, '')
    return parseChineseNumber(cleaned)
  }

  function getWeekdayText(weekday) {
    const map = {
      '周一': '周一', '周1': '周一', '星期一': '周一',
      '周二': '周二', '周2': '周二', '星期二': '周二',
      '周三': '周三', '周3': '周三', '星期三': '周三',
      '周四': '周四', '周4': '周四', '星期四': '周四',
      '周五': '周五', '周5': '周五', '星期五': '周五',
      '周六': '周六', '周6': '周六', '星期六': '周六',
      '周日': '周日', '周7': '周日', '星期日': '周日', '周天': '周日', '星期天': '周日'
    }
    return map[weekday] || null
  }

  let processedText = text
  let hasTime = false
  let hasDateKeyword = false
  let timePart = ''
  let timeError = null
  let isNextDayMidnight = false
  let weekdayMatch = text.match(weekDayRegex)
  let prefixedWeekdayMatch = text.match(prefixedWeekDayRegex)
  let weekdayText = null
  let weekdayDisplay = null
  let weekdayMatchedText = ''

  if (prefixedWeekdayMatch) {
    const normalizedWeekday = getWeekdayText(`周${prefixedWeekdayMatch[2]}`)
    if (normalizedWeekday) {
      weekdayText = normalizedWeekday
      weekdayDisplay = `${prefixedWeekdayMatch[1]}${prefixedWeekdayMatch[2]}`
      weekdayMatchedText = prefixedWeekdayMatch[0]
    }
  } else if (weekdayMatch) {
    const normalizedWeekday = getWeekdayText(weekdayMatch[1])
    if (normalizedWeekday) {
      weekdayText = normalizedWeekday
      weekdayDisplay = normalizedWeekday
      weekdayMatchedText = weekdayMatch[0]
    }
  }

  const dateKeywords = ['明天', '后天', '今天', '上午', '下午', '晚上', '早上', '中午']
  dateKeywords.forEach(kw => {
    if (text.includes(kw)) hasDateKeyword = true
  })

  const timeMatch = text.match(/(\d{1,2})[点:：](\d{0,2})/)
  const chineseTimeMatch = text.match(chineseTimeRegex)

  if (chineseTimeMatch) {
    let hour = parseChineseNumber(chineseTimeMatch[2])
    const minute = parseChineseMinute(chineseTimeMatch[3])
    const period = chineseTimeMatch[1]
    isNextDayMidnight = false

    if (period === '下午' || period === '晚上') {
      if (hour < 12) hour += 12
      else if (hour === 12) { hour = 0; isNextDayMidnight = true }
    } else if (period === '上午' || period === '早上') {
      if (hour === 12) hour = 0
    } else if (period === '中午') {
      if (hour >= 9) { }
      else { hour += 12 }
    } else if (!period && !text.includes('上午') && !text.includes('早上') && !text.includes('凌晨') && !text.includes('今天') && !text.includes('明天') && !text.includes('后天')) {
      if (hour >= 1 && hour <= 11) hour += 12
      else if (hour === 12) { hour = 0; isNextDayMidnight = true }
    }

    if (/半夜|午夜/.test(text) && hour === 12) { hour = 0; isNextDayMidnight = true }
    if (/凌晨/.test(text) && hour === 12) { hour = 0; isNextDayMidnight = false }

    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      hasTime = true
      timePart = String(hour).padStart(2, '0') + ':' + String(minute).padStart(2, '0')
      processedText = processedText.replace(chineseTimeMatch[0], '').trim()
    } else {
      timeError = '时间格式错误'
    }
  } else if (timeMatch) {
    let hour = parseInt(timeMatch[1])
    const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0

    if (text.includes('下午') || text.includes('晚上')) {
      if (hour < 12) hour += 12
      else if (hour === 12) { hour = 0; isNextDayMidnight = true }
    } else if (text.includes('上午') || text.includes('早上')) {
      if (hour === 12) hour = 0
    }

    if (/半夜|午夜/.test(text) && hour === 12) { hour = 0; isNextDayMidnight = true }
    if (/凌晨/.test(text) && hour === 12) { hour = 0; isNextDayMidnight = false }

    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      hasTime = true
      timePart = String(hour).padStart(2, '0') + ':' + String(minute).padStart(2, '0')
      processedText = processedText.replace(timeMatch[0], '').trim()
    } else {
      timeError = '时间格式错误'
    }
  }

  if (weekdayText) {
    category = 'schedule'
    if (hasTime) {
      displayTime = weekdayDisplay + ' ' + timePart
    } else {
      displayTime = weekdayDisplay
    }
    processedText = processedText.replace(weekdayMatchedText, '').trim()
  } else if (text.includes('明天') || text.includes('后天')) {
    category = 'schedule'
    if (hasTime) {
      displayTime = (text.includes('明天') ? '明天 ' : '后天 ') + timePart
    } else {
      displayTime = text.includes('明天') ? '明天' : '后天'
    }
    processedText = processedText.replace(/明天|后天/g, '').trim()
  } else if (hasTime) {
    category = 'schedule'
    if (text.includes('下午') || text.includes('晚上')) {
      processedText = processedText.replace(/下午|晚上/g, '').trim()
    } else if (text.includes('上午') || text.includes('早上')) {
      processedText = processedText.replace(/上午|早上/g, '').trim()
    }
    const datePrefix = isNextDayMidnight ? '明天 ' : '今天 '
    displayTime = datePrefix + timePart
  } else if (hasDateKeyword) {
    category = 'schedule'
    processedText = processedText.replace(/上午|下午|晚上|早上/g, '').trim()
    displayTime = '今天'
  }

  const timeInText = text.match(/(\d{1,2})[点:：](\d{0,2})/)
  if (timeInText) {
    processedText = processedText.replace(timeInText[0], '').trim()
  }
  const chineseTimeInText = text.match(chineseTimeRegex)
  if (chineseTimeInText) {
    processedText = processedText.replace(chineseTimeInText[0], '').trim()
  }
  const dateWords = ['明天', '后天', '今天', '上午', '下午', '晚上', '早上', '中午']
  dateWords.forEach(w => {
    processedText = processedText.replace(new RegExp(w, 'g'), '')
  })
  if (weekdayMatchedText) {
    processedText = processedText.replace(weekdayMatchedText, '')
  }
  processedText = processedText.replace(/\s+/g, ' ').trim()

  if (!hasTime && !hasDateKeyword && !weekdayText) {
    const shoppingKeywords = ['买', '购', '囤', '下单', '超市', '快递', '食材', '用品', '奶粉', '尿布', '玩具', '辅食', '童装']
    for (const kw of shoppingKeywords) {
      if (text.includes(kw)) {
        category = 'shopping'
        break
      }
    }
  }

  return {
    content: processedText || text,
    category,
    time: hasTime ? timePart : null,
    displayTime: hasTime || hasDateKeyword || weekdayText ? displayTime : null,
    timeError
  }
}

export default parseInput

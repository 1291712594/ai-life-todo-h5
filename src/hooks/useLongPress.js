import { useCallback, useRef, useEffect } from 'react'

export function useLongPress(callback, options = {}) {
  const { delay = 500 } = options
  const timerRef = useRef(null)
  const isLongPressRef = useRef(false)
  const startPosRef = useRef({ x: 0, y: 0 })

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const onTouchStart = useCallback((e) => {
    const touch = e.touches?.[0] || e
    startPosRef.current = { x: touch.clientX, y: touch.clientY }
    isLongPressRef.current = false
    
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true
      callback(e)
    }, delay)
  }, [callback, delay])

  const onTouchMove = useCallback((e) => {
    if (!timerRef.current) return
    
    const touch = e.touches?.[0]
    if (!touch) return
    
    const moveThreshold = 10
    const deltaX = Math.abs(touch.clientX - startPosRef.current.x)
    const deltaY = Math.abs(touch.clientY - startPosRef.current.y)
    
    if (deltaX > moveThreshold || deltaY > moveThreshold) {
      clearTimer()
    }
  }, [clearTimer])

  const onTouchEnd = useCallback((e) => {
    clearTimer()
    if (isLongPressRef.current) {
      e.preventDefault()
      e.stopPropagation()
    }
  }, [clearTimer])

  const onContextMenu = useCallback((e) => {
    e.preventDefault()
  }, [])

  useEffect(() => {
    return () => {
      clearTimer()
    }
  }, [clearTimer])

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onContextMenu,
    onMouseDown: onTouchStart,
    onMouseUp: onTouchEnd,
    onMouseLeave: onTouchEnd
  }
}

export default useLongPress

import { useRef } from 'react'

export default function SwipeBack({ onSwipe, children }) {
  const startX = useRef(0)
  const isNearEdge = useRef(false)

  const handleTouchStart = (e) => {
    if (e.touches[0].clientX < 30) {
      isNearEdge.current = true
      startX.current = e.touches[0].clientX
    }
  }

  const handleTouchEnd = (e) => {
    if (isNearEdge.current && e.changedTouches[0].clientX - startX.current > 80) {
      onSwipe()
    }
    isNearEdge.current = false
  }

  return (
    <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {children}
    </div>
  )
}

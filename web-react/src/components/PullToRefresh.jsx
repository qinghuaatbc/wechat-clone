import { useState, useRef } from 'react'
import { Loader2, ArrowDown } from 'lucide-react'

export function PullToRefresh({ onRefresh, children }) {
  const [pulling, setPulling] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef(0)
  const currentY = useRef(0)

  const handleTouchStart = (e) => {
    startY.current = e.touches[0].clientY
  }

  const handleTouchMove = (e) => {
    const diff = e.touches[0].clientY - startY.current
    if (diff > 0 && window.scrollY === 0) {
      setPulling(true)
      currentY.current = diff
    }
  }

  const handleTouchEnd = async () => {
    if (currentY.current > 80) {
      setRefreshing(true)
      await onRefresh()
    }
    setPulling(false)
    setRefreshing(false)
    currentY.current = 0
  }

  return (
    <div onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      {pulling && !refreshing && (
        <div className="flex justify-center py-2 text-wechat-gray animate-slide-up">
          <ArrowDown size={18} className="mr-1" /> 下拉刷新
        </div>
      )}
      {refreshing && (
        <div className="flex justify-center py-2 text-wechat-gray">
          <Loader2 size={18} className="animate-spin mr-2" /> 刷新中...
        </div>
      )}
      {children}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, Download, BookOpen, FileText, Eye, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import PreviewModal from '../components/PreviewModal'

export default function Library() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [activeCat, setActiveCat] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [previewItem, setPreviewItem] = useState(null)
  const pageSize = 20

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/library/categories')
      const data = await res.json()
      setCategories(data.categories || [])
    } catch {}
  }

  const loadItems = async (pageNum = 1, append = false) => {
    if (append) setLoadingMore(true)
    else setLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeCat) params.set('category', activeCat)
      if (search.trim()) params.set('search', search.trim())
      params.set('page', pageNum)
      params.set('page_size', pageSize)
      const res = await fetch(`/api/library?${params}`)
      const data = await res.json()
      if (append) {
        setItems(prev => [...prev, ...(data.items || [])])
      } else {
        setItems(data.items || [])
      }
      setTotal(data.total || 0)
      setPage(pageNum)
    } catch (e) { toast.error('加载失败') }
    if (append) setLoadingMore(false)
    else setLoading(false)
  }

  useEffect(() => { loadCategories() }, [])
  useEffect(() => {
    setItems([])
    setPage(1)
    loadItems(1)
  }, [activeCat])

  const handleSearch = () => {
    setItems([])
    setPage(1)
    loadItems(1)
  }

  const handleLoadMore = () => {
    if (loadingMore || items.length >= total) return
    loadItems(page + 1, true)
  }

  const handleDownload = async (item) => {
    window.open(`/api/library/${item.id}/download`, '_blank')
    item.downloads++
    toast.success('开始下载')
  }

  const previewUrl = (item) => `/api/library/${item.id}/download?preview=1`

  const formatSize = (bytes) => {
    if (!bytes) return ''
    if (bytes < 1024) return bytes + 'B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB'
    return (bytes / (1024 * 1024)).toFixed(1) + 'MB'
  }

  const hasMore = items.length < total

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-gray-50">
      <header className="flex items-center gap-3 px-4 py-3 bg-white border-b z-10">
        <button onClick={() => navigate('/')} className="p-1"><ArrowLeft size={24} /></button>
        <h2 className="font-semibold flex-1">图书馆</h2>
      </header>

      <div className="px-4 py-3 bg-white border-b">
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
          <Search size={16} className="text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="搜索书名或描述..."
            className="flex-1 bg-transparent text-sm focus:outline-none"
          />
        </div>
      </div>

      <div className="flex gap-2 px-4 py-2.5 bg-white border-b overflow-x-auto">
        <button
          onClick={() => setActiveCat('')}
          className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${!activeCat ? 'bg-wechat-green text-white' : 'bg-gray-100 text-gray-600'}`}
        >全部</button>
        {categories.map(c => (
          <button
            key={c.category}
            onClick={() => setActiveCat(c.category)}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${activeCat === c.category ? 'bg-wechat-green text-white' : 'bg-gray-100 text-gray-600'}`}
          >{c.category} ({c.count})</button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pb-4">
        {loading ? (
          <div className="text-center py-20 text-gray-400 text-sm">加载中...</div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-gray-400">
            <BookOpen size={48} />
            <p className="mt-2 text-sm">暂无资源</p>
          </div>
        ) : (
          <>
            {items.map(item => (
              <div key={item.id} className="flex items-start px-4 py-3 bg-white border-b active:bg-gray-50 transition">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5 cursor-pointer" onClick={() => setPreviewItem(item)}>
                  <FileText size={20} className="text-orange-500" />
                </div>
                <div className="ml-3 flex-1 min-w-0 cursor-pointer" onClick={() => setPreviewItem(item)}>
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{item.description || '暂无描述'}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{item.category}</span>
                    <span className="text-xs text-gray-400">{formatSize(item.file_size)}</span>
                    <span className="text-xs text-gray-400">{item.downloads} 次下载</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                  <button onClick={() => setPreviewItem(item)} className="p-1.5 hover:bg-gray-100 rounded" title="预览">
                    <Eye size={16} className="text-gray-500" />
                  </button>
                  <button onClick={() => handleDownload(item)} className="p-1.5 hover:bg-gray-100 rounded" title="下载">
                    <Download size={16} className="text-wechat-green" />
                  </button>
                </div>
              </div>
            ))}
            {hasMore && (
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="w-full py-3 flex items-center justify-center gap-2 text-sm text-gray-500 hover:bg-gray-50 transition"
              >
                {loadingMore ? (
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ChevronDown size={18} />
                )}
                {loadingMore ? '加载中...' : `加载更多 (${items.length}/${total})`}
              </button>
            )}
          </>
        )}
      </div>

      <PreviewModal
        open={!!previewItem}
        file={previewItem ? {
          name: previewItem.title,
          url: previewUrl(previewItem),
          category: previewItem.category,
          size: formatSize(previewItem.file_size),
        } : null}
        onClose={() => setPreviewItem(null)}
        onDownload={() => handleDownload(previewItem)}
      />
    </div>
  )
}

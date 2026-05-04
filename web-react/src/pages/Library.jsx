import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, Download, BookOpen, FileText, X, Eye, Music, FileType } from 'lucide-react'
import { toast } from 'sonner'

export default function Library() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [activeCat, setActiveCat] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [previewItem, setPreviewItem] = useState(null)

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/library/categories')
      const data = await res.json()
      setCategories(data.categories || [])
    } catch {}
  }

  const loadItems = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeCat) params.set('category', activeCat)
      if (search.trim()) params.set('search', search.trim())
      const res = await fetch(`/api/library?${params}`)
      const data = await res.json()
      setItems(data.items || [])
    } catch (e) { toast.error('加载失败') }
    setLoading(false)
  }

  useEffect(() => { loadCategories() }, [])
  useEffect(() => { loadItems() }, [activeCat])

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
            onKeyDown={e => e.key === 'Enter' && loadItems()}
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
          items.map(item => (
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
          ))
        )}
      </div>

      {previewItem && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col" onClick={() => setPreviewItem(null)}>
          <header className="flex items-center justify-between px-4 py-3 bg-black/80 text-white" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Eye size={18} className="flex-shrink-0" />
              <span className="text-sm font-medium truncate">{previewItem.title}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => handleDownload(previewItem)} className="p-1.5 hover:bg-white/10 rounded flex items-center gap-1 text-sm">
                <Download size={16} /> 下载
              </button>
              <button onClick={() => setPreviewItem(null)} className="p-1 hover:bg-white/10 rounded"><X size={22} /></button>
            </div>
          </header>
          <div className="flex-1 flex items-center justify-center bg-black p-4" onClick={e => e.stopPropagation()}>
            {(() => {
              const ext = previewItem.file_path?.split('.').pop()?.toLowerCase()
              const isImage = ['jpg','jpeg','png','gif','webp','bmp','svg'].includes(ext)
              const isVideo = ['mp4','webm','avi','mov','mkv'].includes(ext)
              const isAudio = ['mp3','wav','ogg','flac','aac'].includes(ext)
              const is3D = ['glb','gltf'].includes(ext)
              const isPDF = ext === 'pdf'
              const url = previewUrl(previewItem)

              if (isImage) {
                return <img src={url} alt={previewItem.title} className="max-w-full max-h-full object-contain rounded-lg" />
              }
              if (isVideo) {
                return <video src={url} controls className="max-w-full max-h-full rounded-lg" autoPlay />
              }
              if (isAudio) {
                return (
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-wechat-green/20 flex items-center justify-center mx-auto mb-6">
                      <Music size={48} className="text-wechat-green" />
                    </div>
                    <p className="text-white text-sm mb-4">{previewItem.title}</p>
                    <audio src={url} controls className="w-80 max-w-full" autoPlay />
                  </div>
                )
              }
              if (is3D) {
                return <model-viewer src={url} camera-controls auto-rotate rotation-per-second="60"
                  interaction-prompt="none" style={{ width: '100%', height: '100%' }}
                  className="w-full h-full" />
              }
              if (isPDF) {
                return <iframe src={url} className="w-full h-full rounded-lg" title={previewItem.title} />
              }
              return (
                <div className="text-center text-gray-400">
                  <FileType size={64} className="mx-auto mb-4 opacity-50" />
                  <p className="text-sm mb-4">该类型暂不支持预览</p>
                  <button onClick={() => handleDownload(previewItem)}
                    className="px-6 py-2.5 bg-wechat-green text-white rounded-lg text-sm inline-flex items-center gap-2">
                    <Download size={16} /> 下载文件
                  </button>
                </div>
              )
            })()}
          </div>
          <div className="flex items-center justify-between px-4 py-3 bg-black/80 text-white text-sm" onClick={e => e.stopPropagation()}>
            <span className="text-gray-400">{previewItem.category}</span>
            <span className="text-gray-400">{formatSize(previewItem.file_size)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

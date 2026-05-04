import { useState, useEffect, useRef } from 'react'
import { X, Download, FileType, Music } from 'lucide-react'

export default function PreviewModal({ open, file, onClose, onDownload }) {
  const [loading, setLoading] = useState(true)
  const [pdfError, setPdfError] = useState(false)
  const iframeRef = useRef(null)
  const pdfTimerRef = useRef(null)
  const modelRef = useRef(null)

  const ext = file?.name?.split('.').pop()?.toLowerCase()
  const isImage = ['jpg','jpeg','png','gif','webp','bmp','svg'].includes(ext)
  const isVideo = ['mp4','webm','avi','mov','mkv'].includes(ext)
  const isAudio = ['mp3','wav','ogg','flac','aac'].includes(ext)
  const is3D = ['glb','gltf'].includes(ext)
  const isPDF = ext === 'pdf'

  useEffect(() => {
    if (!open) {
      setLoading(true)
      setPdfError(false)
      return
    }
    setLoading(true)
    setPdfError(false)
  }, [open, file?.url])

  useEffect(() => {
    if (!open) return
    return () => {
      if (pdfTimerRef.current) clearTimeout(pdfTimerRef.current)
    }
  }, [open])

  useEffect(() => {
    if (!isPDF || !open) return
    pdfTimerRef.current = setTimeout(() => {
      setPdfError(true)
      setLoading(false)
    }, 10000)
    return () => { if (pdfTimerRef.current) clearTimeout(pdfTimerRef.current) }
  }, [isPDF, open])

  useEffect(() => {
    if (!is3D || !modelRef.current || !open) return
    const el = modelRef.current
    const onLoad = () => setLoading(false)
    el.addEventListener('load', onLoad)
    return () => el.removeEventListener('load', onLoad)
  }, [is3D, open])

  if (!open || !file) return null

  const handleIframeLoad = () => {
    setLoading(false)
    try {
      const doc = iframeRef.current?.contentDocument || iframeRef.current?.contentWindow?.document
      if (!doc || doc.body?.innerHTML === '' || doc.body?.children?.length === 0) {
        setPdfError(true)
      }
    } catch {}
  }

  const renderContent = () => {
    if (isImage) {
      return <img src={file.url} alt={file.name} onLoad={() => setLoading(false)} onError={() => setLoading(false)} className="max-w-full max-h-full object-contain rounded-lg" />
    }
    if (isVideo) {
      return <video src={file.url} controls onCanPlay={() => setLoading(false)} onError={() => setLoading(false)} className="max-w-full max-h-full rounded-lg" autoPlay />
    }
    if (isAudio) {
      return (
        <div className="text-center">
          <div className="w-24 h-24 rounded-full bg-wechat-green/20 flex items-center justify-center mx-auto mb-6">
            <Music size={48} className="text-wechat-green" />
          </div>
          <p className="text-white text-sm mb-4">{file.name}</p>
          <audio src={file.url} controls onCanPlay={() => setLoading(false)} onError={() => setLoading(false)} className="w-80 max-w-full" autoPlay />
        </div>
      )
    }
    if (is3D) {
      return (
        <model-viewer ref={modelRef} src={file.url} camera-controls auto-rotate rotation-per-second="60"
          interaction-prompt="none" style={{ width: '100%', height: '100%' }}
          className="w-full h-full" />
      )
    }
    if (isPDF) {
      if (pdfError) {
        return (
          <div className="text-center text-gray-400">
            <FileType size={64} className="mx-auto mb-4 opacity-50" />
            <p className="text-sm mb-2">PDF 加载较慢或浏览器不支持内嵌预览</p>
            <p className="text-xs text-gray-500 mb-4">请尝试下载后查看</p>
            {onDownload && (
              <button onClick={onDownload}
                className="px-6 py-2.5 bg-wechat-green text-white rounded-lg text-sm inline-flex items-center gap-2">
                <Download size={16} /> 下载文件
              </button>
            )}
          </div>
        )
      }
      return (
        <iframe ref={iframeRef} src={file.url} onLoad={handleIframeLoad}
          className="w-full h-full rounded-lg" title={file.name} />
      )
    }
    return (
      <div className="text-center text-gray-400">
        <FileType size={64} className="mx-auto mb-4 opacity-50" />
        <p className="text-sm mb-4">该类型暂不支持预览</p>
        {onDownload && (
          <button onClick={onDownload}
            className="px-6 py-2.5 bg-wechat-green text-white rounded-lg text-sm inline-flex items-center gap-2">
            <Download size={16} /> 下载文件
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col" onClick={onClose}>
      <header className="flex items-center justify-between px-4 py-3 bg-black/80 text-white" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-sm font-medium truncate">{file.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {onDownload && (
            <button onClick={onDownload} className="p-1.5 hover:bg-white/10 rounded flex items-center gap-1 text-sm">
              <Download size={16} /> 下载
            </button>
          )}
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded"><X size={22} /></button>
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center bg-black p-4 relative" onClick={e => e.stopPropagation()}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-wechat-green border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-400 text-sm">加载中...</span>
            </div>
          </div>
        )}
        {renderContent()}
      </div>
      {(file.type || file.category || file.size) && (
        <footer className="flex items-center justify-between px-4 py-3 bg-black/80 text-white text-sm" onClick={e => e.stopPropagation()}>
          <span className="text-gray-400">{file.category || file.type || ''}</span>
          {file.size && <span className="text-gray-400">{file.size}</span>}
        </footer>
      )}
    </div>
  )
}

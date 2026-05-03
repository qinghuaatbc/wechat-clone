import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Play, Tv, Monitor, Film, Youtube, Newspaper, Music, Globe, AlertCircle, RefreshCw } from 'lucide-react'

const CATEGORIES = [
  { id: 'tv', label: '电视台', icon: Tv, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'movie', label: '电影', icon: Film, color: 'text-red-500', bg: 'bg-red-50' },
  { id: 'sport', label: '体育', icon: Monitor, color: 'text-green-500', bg: 'bg-green-50' },
  { id: 'news', label: '新闻', icon: Newspaper, color: 'text-yellow-500', bg: 'bg-yellow-50' },
  { id: 'music', label: '音乐', icon: Music, color: 'text-pink-500', bg: 'bg-pink-50' },
  { id: 'test', label: '测试', icon: Youtube, color: 'text-purple-500', bg: 'bg-purple-50' },
  { id: 'custom', label: '自定义', icon: Globe, color: 'text-cyan-500', bg: 'bg-cyan-50' },
]

export default function TV() {
  const navigate = useNavigate()
  const [activeCat, setActiveCat] = useState(null)
  const [playing, setPlaying] = useState(null)
  const [error, setError] = useState(null)
  const [channels, setChannels] = useState([])
  const [loading, setLoading] = useState(true)
  const [customUrl, setCustomUrl] = useState('')
  const [customChannels, setCustomChannels] = useState(
    JSON.parse(localStorage.getItem('tv_custom') || '[]')
  )
  const videoRef = useRef(null)
  const hlsRef = useRef(null)

  useEffect(() => {
    fetch('/api/hls/channels')
      .then(r => r.json())
      .then(d => setChannels(d.channels || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!playing || !videoRef.current) return
    setError(null)
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null }

    import('hls.js').then(mod => {
      const Hls = mod.default
      if (Hls.isSupported()) {
        const hls = new Hls()
        hls.loadSource(playing.url)
        hls.attachMedia(videoRef.current)
        hls.on(Hls.Events.ERROR, (e, data) => {
          if (data.fatal) setError('播放失败: ' + (data.type === 'networkError' ? '网络错误，请尝试其他频道' : '格式错误'))
        })
        hlsRef.current = hls
        videoRef.current.play().catch(() => {})
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = playing.url
        videoRef.current.play().catch(() => {})
      } else {
        setError('浏览器不支持HLS播放，请使用Safari或Chrome')
      }
    }).catch(() => setError('无法加载播放器'))

    return () => { if (hlsRef.current) hlsRef.current.destroy() }
  }, [playing])

  const addCustom = () => {
    if (!customUrl.trim()) return
    const name = prompt('请输入频道名称:') || customUrl
    const list = [...customChannels, { name, url: customUrl }]
    setCustomChannels(list)
    localStorage.setItem('tv_custom', JSON.stringify(list))
    setCustomUrl('')
  }

  const removeCustom = (idx) => {
    const list = customChannels.filter((_, i) => i !== idx)
    setCustomChannels(list)
    localStorage.setItem('tv_custom', JSON.stringify(list))
  }

  const getCatChannels = (catId) => {
    if (catId === 'custom') return customChannels
    const grouped = {}
    channels.forEach(ch => {
      const cat = ch.category || 'other'
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push(ch)
    })
    return grouped[catId] || []
  }

  const allChannels = activeCat ? getCatChannels(activeCat) : []

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-black">
      <header className="flex items-center justify-between px-4 py-3 bg-gray-900 z-10">
        <button onClick={() => { setPlaying(null); navigate(-1) }} className="text-white p-1"><ArrowLeft size={24} /></button>
        <h2 className="text-white font-semibold">{playing ? playing.name : '电视直播'}</h2>
        <div className="w-8" />
      </header>

      {playing ? (
        <div className="flex-1 relative bg-black flex flex-col items-center justify-center">
          <video ref={videoRef} controls autoPlay className="w-full h-full object-contain" playsInline />
          <button onClick={() => setPlaying(null)} className="absolute top-2 right-2 bg-black/60 text-white px-3 py-1 rounded text-sm z-10">退出</button>
          {error && (
            <div className="absolute bottom-16 left-4 right-4 bg-red-900/80 text-white text-sm p-3 rounded-lg flex items-center gap-2">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {!error && (
            <div className="absolute bottom-4 left-4 right-4 bg-black/60 text-white text-xs p-2 rounded text-center">
              如果无法播放请尝试其他频道
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto bg-gray-900 pb-4">
          <div className="p-4 border-b border-gray-800">
            <p className="text-gray-400 text-xs mb-2">输入M3U8直播源地址:</p>
            <div className="flex gap-2">
              <input value={customUrl} onChange={e => setCustomUrl(e.target.value)} placeholder="https://example.com/playlist.m3u8" className="flex-1 px-3 py-2 bg-gray-800 text-white rounded text-sm focus:outline-none" />
              <button onClick={addCustom} className="px-4 py-2 bg-wechat-green text-white rounded text-sm font-medium">添加</button>
            </div>
          </div>

          {!activeCat ? (
            <div className="grid grid-cols-4 gap-3 p-4">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon
                const cnt = cat.id === 'custom' ? customChannels.length : channels.filter(c => (c.category || 'other') === cat.id).length
                return (
                  <button key={cat.id} onClick={() => { setActiveCat(cat.id); setLoading(false) }}
                    className={`${cat.bg} rounded-xl p-3 flex flex-col items-center gap-1.5 active:scale-95 transition`}>
                    <Icon size={24} className={cat.color} />
                    <span className="text-xs text-gray-700 font-medium">{cat.label}</span>
                    <span className="text-[10px] text-gray-400">{cnt}个</span>
                  </button>
                )
              })}
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between px-4 py-2 bg-gray-800">
                <span className="text-white text-sm font-medium">{CATEGORIES.find(c => c.id === activeCat)?.label || '频道'}</span>
                <button onClick={() => setActiveCat(null)} className="text-wechat-green text-sm">返回</button>
              </div>
              {loading ? (
                <div className="flex justify-center py-8"><RefreshCw size={24} className="animate-spin text-gray-500" /></div>
              ) : allChannels.length === 0 ? (
                <p className="text-center text-gray-500 py-8">暂无频道</p>
              ) : (
                allChannels.map((ch, i) => (
                  <div key={ch.id || i} onClick={() => setPlaying(ch)}
                    className="flex items-center justify-between px-4 py-3 border-b border-gray-800 active:bg-gray-800 transition cursor-pointer">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center flex-shrink-0">
                        <Play size={14} className="text-wechat-green" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-white text-sm block truncate">{ch.name}</span>
                        <span className="text-gray-500 text-xs block truncate">{ch.url}</span>
                      </div>
                    </div>
                    {activeCat === 'custom' && (
                      <button onClick={e => { e.stopPropagation(); removeCustom(i) }} className="text-red-400 text-xs flex-shrink-0 ml-2">删除</button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

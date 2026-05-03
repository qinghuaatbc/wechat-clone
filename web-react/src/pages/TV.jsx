import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Play, Tv, Monitor, Film, Youtube, Newspaper, Music, Globe, AlertCircle } from 'lucide-react'

const CATEGORIES = [
  { id: 'test', label: '测试频道', icon: Tv, color: 'text-green-500', bg: 'bg-green-50' },
  { id: 'movie', label: '电影', icon: Film, color: 'text-red-500', bg: 'bg-red-50' },
  { id: 'tv', label: '电视剧', icon: Tv, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'variety', label: '综艺', icon: Youtube, color: 'text-purple-500', bg: 'bg-purple-50' },
  { id: 'sport', label: '体育', icon: Monitor, color: 'text-orange-500', bg: 'bg-orange-50' },
  { id: 'news', label: '新闻', icon: Newspaper, color: 'text-yellow-500', bg: 'bg-yellow-50' },
  { id: 'music', label: '音乐', icon: Music, color: 'text-pink-500', bg: 'bg-pink-50' },
  { id: 'global', label: '国际', icon: Globe, color: 'text-cyan-500', bg: 'bg-cyan-50' },
]

const PRESET_CHANNELS = {
  test: [
    { name: 'Apple HLS (bipbop)', url: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8' },
    { name: 'Big Buck Bunny', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
    { name: 'Apple Keynote', url: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8' },
  ],
  movie: [
    { name: '4K HDR Test', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
  ],
  tv: [
    { name: 'Test Stream 1', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
    { name: 'Test Stream 2', url: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8' },
  ],
  news: [
    { name: 'Test News', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
  ],
  music: [
    { name: 'Test Music', url: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8' },
  ],
}

export default function TV() {
  const navigate = useNavigate()
  const [activeCat, setActiveCat] = useState(null)
  const [playing, setPlaying] = useState(null)
  const [error, setError] = useState(null)
  const [customUrl, setCustomUrl] = useState('')
  const [customChannels, setCustomChannels] = useState(
    JSON.parse(localStorage.getItem('tv_custom') || '[]')
  )
  const videoRef = useRef(null)
  const hlsRef = useRef(null)

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
          if (data.fatal) {
            setError('播放失败: ' + (data.type === 'networkError' ? '网络错误' : '格式错误'))
          }
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

  const allChannels = activeCat
    ? [...(PRESET_CHANNELS[activeCat] || []), ...(activeCat === 'custom' ? customChannels : [])]
    : []

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
          <button onClick={() => setPlaying(null)} className="absolute top-2 right-2 bg-black/60 text-white px-3 py-1 rounded text-sm z-10">
            退出
          </button>
          {error && (
            <div className="absolute bottom-16 left-4 right-4 bg-red-900/80 text-white text-sm p-3 rounded-lg flex items-center gap-2">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {!error && (
            <div className="absolute bottom-4 left-4 right-4 bg-black/60 text-white text-xs p-2 rounded text-center">
              提示: 如果无法播放，请尝试输入其他直播源地址
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto bg-gray-900 pb-4">
          <div className="p-4 border-b border-gray-800">
            <p className="text-gray-400 text-xs mb-2">输入M3U8直播源地址: (例如央视/卫视直播源)</p>
            <div className="flex gap-2">
              <input value={customUrl} onChange={e => setCustomUrl(e.target.value)} placeholder="https://example.com/playlist.m3u8" className="flex-1 px-3 py-2 bg-gray-800 text-white rounded text-sm focus:outline-none" />
              <button onClick={addCustom} className="px-4 py-2 bg-wechat-green text-white rounded text-sm font-medium">添加</button>
            </div>
          </div>

          {!activeCat ? (
            <div className="grid grid-cols-4 gap-3 p-4">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon
                const count = (PRESET_CHANNELS[cat.id]?.length || 0)
                return (
                  <button key={cat.id} onClick={() => setActiveCat(cat.id)}
                    className={`${cat.bg} rounded-xl p-3 flex flex-col items-center gap-1.5 active:scale-95 transition`}>
                    <Icon size={24} className={cat.color} />
                    <span className="text-xs text-gray-700 font-medium">{cat.label}</span>
                    <span className="text-[10px] text-gray-400">{count}个</span>
                  </button>
                )
              })}
              {customChannels.length > 0 && (
                <button onClick={() => setActiveCat('custom')}
                  className="bg-purple-50 rounded-xl p-3 flex flex-col items-center gap-1.5 active:scale-95 transition">
                  <Play size={24} className="text-purple-500" />
                  <span className="text-xs text-gray-700 font-medium">自定义</span>
                  <span className="text-[10px] text-gray-400">{customChannels.length}个</span>
                </button>
              )}
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between px-4 py-2 bg-gray-800">
                <span className="text-white text-sm font-medium">{CATEGORIES.find(c => c.id === activeCat)?.label || '自定义频道'}</span>
                <button onClick={() => setActiveCat(null)} className="text-wechat-green text-sm">返回</button>
              </div>
              <div className="px-4 py-2 bg-gray-850 text-gray-500 text-xs">
                点击频道开始播放，如果无法播放请切换其他频道或添加自定义直播源
              </div>
              {allChannels.map((ch, i) => (
                <div key={i} onClick={() => setPlaying(ch)}
                  className="flex items-center justify-between px-4 py-3 border-b border-gray-800 active:bg-gray-800 transition cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center">
                      <Play size={14} className="text-wechat-green" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-white text-sm block truncate max-w-[200px]">{ch.name}</span>
                      <span className="text-gray-500 text-xs block truncate max-w-[200px]">{ch.url}</span>
                    </div>
                  </div>
                  {activeCat === 'custom' && (
                    <button onClick={e => { e.stopPropagation(); removeCustom(i) }}
                      className="text-red-400 text-xs flex-shrink-0">删除</button>
                  )}
                </div>
              ))}
              {allChannels.length === 0 && (
                <p className="text-center text-gray-500 py-8">暂无频道</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

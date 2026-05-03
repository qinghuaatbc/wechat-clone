import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Play, Tv, Monitor, Film, Youtube, Newspaper, Music, Globe } from 'lucide-react'

const CATEGORIES = [
  { id: 'movie', label: '电影', icon: Film, color: 'text-red-500', bg: 'bg-red-50' },
  { id: 'tv', label: '电视剧', icon: Tv, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'variety', label: '综艺', icon: Youtube, color: 'text-purple-500', bg: 'bg-purple-50' },
  { id: 'sport', label: '体育', icon: Monitor, color: 'text-green-500', bg: 'bg-green-50' },
  { id: 'news', label: '新闻', icon: Newspaper, color: 'text-orange-500', bg: 'bg-orange-50' },
  { id: 'music', label: '音乐', icon: Music, color: 'text-pink-500', bg: 'bg-pink-50' },
  { id: 'global', label: '国际', icon: Globe, color: 'text-cyan-500', bg: 'bg-cyan-50' },
  { id: 'kids', label: '少儿', icon: Monitor, color: 'text-yellow-500', bg: 'bg-yellow-50' },
]

const PRESET_CHANNELS = {
  movie: [
    { name: 'CCTV-6 电影', url: 'https://cctv.v.anystream.com/cctv6/playlist.m3u8' },
    { name: 'CHC 动作电影', url: 'https://chc.v.anystream.com/action/playlist.m3u8' },
  ],
  tv: [
    { name: 'CCTV-1 综合', url: 'https://cctv.v.anystream.com/cctv1/playlist.m3u8' },
    { name: 'CCTV-8 电视剧', url: 'https://cctv.v.anystream.com/cctv8/playlist.m3u8' },
    { name: '湖南卫视', url: 'https://hunan.v.anystream.com/hunan/playlist.m3u8' },
    { name: '浙江卫视', url: 'https://zhejiang.v.anystream.com/zhejiang/playlist.m3u8' },
    { name: '江苏卫视', url: 'https://jiangsu.v.anystream.com/jiangsu/playlist.m3u8' },
    { name: '东方卫视', url: 'https://dongfang.v.anystream.com/dongfang/playlist.m3u8' },
  ],
  variety: [
    { name: 'CCTV-3 综艺', url: 'https://cctv.v.anystream.com/cctv3/playlist.m3u8' },
  ],
  sport: [
    { name: 'CCTV-5 体育', url: 'https://cctv.v.anystream.com/cctv5/playlist.m3u8' },
    { name: 'CCTV-5+ 赛事', url: 'https://cctv.v.anystream.com/cctv5plus/playlist.m3u8' },
  ],
  news: [
    { name: 'CCTV-13 新闻', url: 'https://cctv.v.anystream.com/cctv13/playlist.m3u8' },
    { name: 'CCTV-4 中文国际', url: 'https://cctv.v.anystream.com/cctv4/playlist.m3u8' },
  ],
  music: [
    { name: 'CCTV-15 音乐', url: 'https://cctv.v.anystream.com/cctv15/playlist.m3u8' },
  ],
  global: [
    { name: 'CGTN 新闻', url: 'https://cgtn.v.anystream.com/cgtn/playlist.m3u8' },
  ],
  kids: [
    { name: 'CCTV-14 少儿', url: 'https://cctv.v.anystream.com/cctv14/playlist.m3u8' },
  ],
}

export default function TV() {
  const navigate = useNavigate()
  const [activeCat, setActiveCat] = useState(null)
  const [playing, setPlaying] = useState(null)
  const [customUrl, setCustomUrl] = useState('')
  const [customChannels, setCustomChannels] = useState(
    JSON.parse(localStorage.getItem('tv_custom') || '[]')
  )
  const videoRef = useRef(null)
  const hlsRef = useRef(null)

  useEffect(() => {
    if (!playing || !videoRef.current) return
    let Hls
    import('hls.js').then(mod => {
      Hls = mod.default
      if (Hls.isSupported()) {
        if (hlsRef.current) hlsRef.current.destroy()
        const hls = new Hls()
        hls.loadSource(playing.url)
        hls.attachMedia(videoRef.current)
        hlsRef.current = hls
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = playing.url
      }
    })
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
        <button onClick={() => navigate(-1)} className="text-white p-1"><ArrowLeft size={24} /></button>
        <h2 className="text-white font-semibold">{playing ? playing.name : '电视直播'}</h2>
        <div className="w-8" />
      </header>

      {playing ? (
        <div className="flex-1 relative bg-black">
          <video ref={videoRef} controls autoPlay className="w-full h-full object-contain" />
          <button onClick={() => setPlaying(null)} className="absolute top-2 right-2 bg-black/60 text-white px-3 py-1 rounded text-sm">
            退出
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto bg-gray-900 pb-4">
          {/* Custom URL */}
          <div className="p-4 border-b border-gray-800">
            <div className="flex gap-2">
              <input value={customUrl} onChange={e => setCustomUrl(e.target.value)} placeholder="输入M3U8/HLS直播地址..." className="flex-1 px-3 py-2 bg-gray-800 text-white rounded text-sm focus:outline-none" />
              <button onClick={addCustom} className="px-4 py-2 bg-wechat-green text-white rounded text-sm font-medium">添加</button>
            </div>
          </div>

          {/* Channel Grid */}
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
                    <span className="text-[10px] text-gray-400">{count}个频道</span>
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
              {allChannels.map((ch, i) => (
                <div key={i} onClick={() => setPlaying(ch)}
                  className="flex items-center justify-between px-4 py-3 border-b border-gray-800 active:bg-gray-800 transition cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center">
                      <Play size={14} className="text-wechat-green" />
                    </div>
                    <span className="text-white text-sm">{ch.name}</span>
                  </div>
                  {activeCat === 'custom' && (
                    <button onClick={e => { e.stopPropagation(); removeCustom(i) }}
                      className="text-red-400 text-xs">删除</button>
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

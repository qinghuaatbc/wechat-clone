import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Play, Disc3, Radio, Headphones, ListMusic, Trash2, Music as MusicIcon, Pause } from 'lucide-react'

const CATEGORIES = [
  { id: 'pop', label: '流行', icon: Headphones, color: 'text-pink-500', bg: 'bg-pink-50' },
  { id: 'classical', label: '古典', icon: Disc3, color: 'text-purple-500', bg: 'bg-purple-50' },
  { id: 'jazz', label: '爵士', icon: Radio, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'china', label: '国内电台', icon: Radio, color: 'text-red-500', bg: 'bg-red-50' },
  { id: 'custom', label: '自定义', icon: ListMusic, color: 'text-green-500', bg: 'bg-green-50' },
]

const SONGS = {
  pop: [
    { name: 'SoundHelix 1', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { name: 'SoundHelix 2', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  ],
  classical: [
    { name: 'SoundHelix Piano', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
    { name: 'SoundHelix Strings', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
  ],
  jazz: [
    { name: 'SoundHelix Jazz', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
    { name: 'SoundHelix Blues', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' },
  ],
  china: [
    { name: '中国之声', url: 'http://ngcdn001.cnr.cn/live/zgzs/index.m3u8' },
    { name: '音乐之声', url: 'http://ngcdn001.cnr.cn/live/yyzs/index.m3u8' },
    { name: '经济之声', url: 'http://ngcdn001.cnr.cn/live/jjzs/index.m3u8' },
  ],
}

export default function Music() {
  const navigate = useNavigate()
  const [activeCat, setActiveCat] = useState(null)
  const [current, setCurrent] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [customList, setCustomList] = useState(
    JSON.parse(localStorage.getItem('music_custom') || '[]')
  )
  const [customUrl, setCustomUrl] = useState('')
  const [customName, setCustomName] = useState('')
  const audioRef = useRef(null)
  const hlsRef = useRef(null)

  useEffect(() => {
    return () => { if (hlsRef.current) hlsRef.current.destroy() }
  }, [])

  const allSongs = activeCat
    ? (activeCat === 'custom' ? customList : SONGS[activeCat] || [])
    : []

  const play = (song) => {
    setCurrent(song)
    setPlaying(true)
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null }
    const audio = audioRef.current
    if (!audio) return

    if (song.url.endsWith('.m3u8')) {
      import('hls.js').then(mod => {
        const Hls = mod.default
        if (Hls.isSupported()) {
          const hls = new Hls()
          hls.loadSource(song.url)
          hls.attachMedia(audio)
          audio.play().catch(() => setPlaying(false))
          hlsRef.current = hls
        } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
          audio.src = song.url
          audio.play().catch(() => setPlaying(false))
        }
      })
    } else {
      audio.src = song.url
      audio.load()
      audio.play().catch(() => setPlaying(false))
    }
  }

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio || !current) return
    if (audio.paused) {
      audio.play().catch(() => {})
      setPlaying(true)
    } else {
      audio.pause()
      setPlaying(false)
    }
  }

  const stop = () => {
    const audio = audioRef.current
    if (audio) { audio.pause(); audio.src = '' }
    setCurrent(null)
    setPlaying(false)
  }

  const addCustom = () => {
    if (!customUrl.trim() || !customName.trim()) return
    const list = [...customList, { name: customName, url: customUrl }]
    setCustomList(list)
    localStorage.setItem('music_custom', JSON.stringify(list))
    setCustomUrl('')
    setCustomName('')
  }

  const removeCustom = (idx) => {
    const list = customList.filter((_, i) => i !== idx)
    setCustomList(list)
    localStorage.setItem('music_custom', JSON.stringify(list))
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-gradient-to-b from-gray-900 to-gray-950">
      <header className="flex items-center justify-between px-4 py-3">
        <button onClick={() => { stop(); navigate('/', { state: { tab: 'discover' } }) }}
          className="text-white p-1"><ArrowLeft size={24} /></button>
        <h2 className="text-white font-semibold">音乐</h2>
        {current && (
          <button onClick={stop} className="text-gray-400 text-sm hover:text-white transition">停止</button>
        )}
        {!current && <div className="w-10" />}
      </header>

      <audio ref={audioRef} className="hidden" />

      {current && (
        <div className="flex items-center gap-4 px-5 py-4 mx-3 mt-1 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
          <button onClick={togglePlay}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-wechat-green to-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 active:scale-95 transition flex-shrink-0">
            {playing
              ? <Pause size={22} className="text-white ml-0.5" />
              : <Play size={22} className="text-white ml-0.5" />}
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-white font-medium text-sm truncate">{current.name}</p>
            <p className="text-gray-400 text-xs mt-0.5">{playing ? '正在播放' : '已暂停'}</p>
          </div>
          <div className="flex gap-1 items-center">
            <div className="flex gap-0.5">{playing && [1,2,3].map(i => (
              <div key={i} className="w-0.5 bg-wechat-green rounded-full animate-bounce"
                style={{ height: 8 + i*4, animationDelay: `${i*0.15}s` }} />
            ))}</div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pb-4">
        {!activeCat ? (
          <div className="grid grid-cols-2 gap-3 p-4">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon
              const cnt = cat.id === 'custom' ? customList.length : (SONGS[cat.id]?.length || 0)
              return (
                <button key={cat.id} onClick={() => setActiveCat(cat.id)}
                  className={`${cat.bg} rounded-2xl p-5 flex flex-col items-center gap-2 active:scale-95 transition shadow-sm`}>
                  <Icon size={28} className={cat.color} />
                  <span className="text-sm font-medium text-gray-800">{cat.label}</span>
                  <span className="text-xs text-gray-400">{cnt} 首</span>
                </button>
              )
            })}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-white text-sm font-medium">
                {CATEGORIES.find(c => c.id === activeCat)?.label}
              </span>
              <button onClick={() => setActiveCat(null)}
                className="text-wechat-green text-sm">返回</button>
            </div>

            {activeCat === 'custom' && (
              <div className="px-4 pb-3">
                <div className="bg-gray-800 rounded-xl p-3 space-y-2">
                  <input value={customName} onChange={e => setCustomName(e.target.value)}
                    placeholder="歌曲名称"
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg text-sm focus:outline-none" />
                  <div className="flex gap-2">
                    <input value={customUrl} onChange={e => setCustomUrl(e.target.value)}
                      placeholder="音频URL"
                      className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg text-sm focus:outline-none" />
                    <button onClick={addCustom}
                      className="px-4 py-2 bg-wechat-green text-white rounded-lg text-sm whitespace-nowrap">添加</button>
                  </div>
                </div>
              </div>
            )}

            {allSongs.length === 0 ? (
              <p className="text-center text-gray-500 py-8 text-sm">暂无歌曲</p>
            ) : (
              allSongs.map((song, i) => (
                <div key={i} onClick={() => play(song)}
                  className={`flex items-center justify-between px-4 py-3.5 border-b border-gray-800 cursor-pointer transition ${
                    current?.url === song.url ? 'bg-gray-800' : 'hover:bg-gray-800/50'
                  }`}>
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      current?.url === song.url ? 'bg-wechat-green' : 'bg-gray-700'
                    }`}>
                      {current?.url === song.url
                        ? <Headphones size={14} className="text-white" />
                        : <Play size={14} className="text-gray-300" />}
                    </div>
                    <div className="min-w-0">
                      <span className={`text-sm block truncate ${
                        current?.url === song.url ? 'text-wechat-green' : 'text-white'
                      }`}>{song.name}</span>
                      <span className="text-gray-500 text-xs block truncate mt-0.5">{song.url}</span>
                    </div>
                  </div>
                  {activeCat === 'custom' && (
                    <button onClick={e => { e.stopPropagation(); removeCustom(i) }}
                      className="text-red-400 p-1.5 hover:bg-red-400/10 rounded-lg flex-shrink-0 ml-2">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

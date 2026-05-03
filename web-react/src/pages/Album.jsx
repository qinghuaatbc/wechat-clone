import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, Image, Trash2, Share2, X, User, Download, Camera, Heart, Clock, Plus } from 'lucide-react'
import { useStore } from '../store'
import { toast } from 'sonner'

const api = (token) => async (url, opts = {}) => {
  const headers = {}
  if (!(opts.body instanceof FormData)) headers['Content-Type'] = 'application/json'
  headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(url, { ...opts, headers })
  if (res.status === 204) return null
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error || 'error')
  return data
}

function PhotoCard({ item, isShared, onPreview, onShare, onDelete }) {
  return (
    <div className="group relative break-inside-avoid mb-3">
      <div className="relative bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5">
        <div className="relative">
          <img src={item.path || item.photo_path} alt={item.name || ''}
            className="w-full h-48 object-cover cursor-pointer"
            onClick={() => onPreview(item)} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0">
            {!isShared && (
              <>
                <button onClick={() => onShare(item)}
                  className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition">
                  <Share2 size={14} className="text-indigo-500" />
                </button>
                <button onClick={() => onDelete(item.id)}
                  className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition">
                  <Trash2 size={14} className="text-red-500" />
                </button>
              </>
            )}
          </div>
          {isShared && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
              <User size={10} />
              <span>{item.owner_name}</span>
            </div>
          )}
        </div>
        {item.name && (
          <div className="px-3 py-2 flex items-center justify-between">
            <p className="text-xs text-gray-600 truncate">{item.name}</p>
            <a href={item.path || item.photo_path} download={item.name}
              className="text-indigo-400 hover:text-indigo-600 flex-shrink-0 ml-2" title="下载">
              <Download size={14} />
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Album() {
  const navigate = useNavigate()
  const token = useStore(s => s.token)
  const request = useCallback((url, opts) => api(token)(url, opts), [token])
  const [photos, setPhotos] = useState([])
  const [shared, setShared] = useState([])
  const [tab, setTab] = useState('my')
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(null)
  const [showShare, setShowShare] = useState(null)
  const [friends, setFriends] = useState([])
  const fileRef = useRef(null)

  const loadPhotos = async () => {
    try { const d = await request('/api/album'); setPhotos(d.photos || []) }
    catch (e) { toast.error(e.message) }
  }
  const loadShared = async () => {
    try { const d = await request('/api/album/shared'); setShared(d.photos || []) }
    catch (e) { toast.error(e.message) }
  }

  useEffect(() => { if (tab === 'my') loadPhotos(); else loadShared() }, [tab])

  const uploadPhoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      await request('/api/album/upload', { method: 'POST', body: fd })
      toast.success('上传成功')
      loadPhotos()
    } catch (e) { toast.error(e.message) }
    setUploading(false)
    e.target.value = ''
  }

  const deletePhoto = async (id) => {
    if (!confirm('确定删除这张照片?')) return
    await request(`/api/album/${id}`, { method: 'DELETE' })
    setPhotos(photos.filter(p => p.id !== id))
    toast.success('已删除')
  }

  const openShare = async (photo) => {
    try { const d = await request('/api/friends/all'); setFriends(d.users || []); setShowShare(photo) }
    catch { toast.error('获取好友列表失败') }
  }

  const sharePhoto = async (photoId, userId) => {
    try {
      await request('/api/album/share', { method: 'POST', body: JSON.stringify({ photo_id: photoId, user_id: userId }) })
      toast.success('已分享')
    } catch (e) { toast.error(e.message) }
  }

  const currentList = tab === 'my' ? photos : shared

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-gradient-to-b from-indigo-50 via-white to-indigo-50/30">
      <header className="relative px-5 pt-4 pb-6 bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-white rounded-full blur-3xl" />
          <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-purple-300 rounded-full blur-3xl" />
        </div>
        <div className="relative flex items-center justify-between">
          <button onClick={() => navigate('/', { state: { tab: 'discover' } })}
            className="text-white/90 hover:text-white p-1"><ArrowLeft size={24} /></button>
          <div className="flex items-center gap-2">
            <Camera size={20} className="text-white/80" />
            <h2 className="text-white font-bold text-lg">相册</h2>
          </div>
          <button onClick={() => fileRef.current?.click()}
            className="bg-white/20 backdrop-blur-sm text-white rounded-xl px-3 py-1.5 text-sm flex items-center gap-1 hover:bg-white/30 transition">
            <Plus size={16} /> 上传
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadPhoto} />
        </div>
        <div className="relative flex mt-4 bg-white/15 backdrop-blur-sm rounded-xl p-1">
          {['my', 'shared'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                tab === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-white/70 hover:text-white'
              }`}>
              {t === 'my' ? '我的照片' : '分享给我'}
            </button>
          ))}
        </div>
      </header>

      {uploading && (
        <div className="mx-4 mt-3 px-4 py-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-sm text-indigo-600 flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          上传中...
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {currentList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-5 shadow-inner">
              <Camera size={40} className="text-indigo-300" />
            </div>
            <p className="text-gray-500 font-medium">{tab === 'my' ? '还没有照片' : '还没有分享'}</p>
            <p className="text-gray-400 text-sm mt-1">
              {tab === 'my' ? '点击右上角上传你的第一张照片' : '好友分享的照片会出现在这里'}
            </p>
          </div>
        ) : (
          <div className="p-4 columns-2 gap-3">
            {currentList.map((item, i) => (
              <PhotoCard key={item.share_id || item.id || i}
                item={item} isShared={tab === 'shared'}
                onPreview={setPreview} onShare={openShare} onDelete={deletePhoto} />
            ))}
          </div>
        )}
      </div>

      {preview && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col" onClick={() => setPreview(null)}>
          <header className="flex items-center justify-between px-4 py-3 bg-black/60 backdrop-blur-sm border-b border-white/5" onClick={e => e.stopPropagation()}>
            <span className="text-sm text-white/80 truncate">{preview.name || ''}</span>
            <div className="flex items-center gap-3">
              <a href={preview.path || preview.photo_path} download={preview.name}
                className="text-white/60 hover:text-white transition p-1" title="下载">
                <Download size={20} />
              </a>
              <button onClick={() => setPreview(null)} className="text-white/60 hover:text-white transition p-1">
                <X size={22} />
              </button>
            </div>
          </header>
          <div className="flex-1 flex items-center justify-center p-4" onClick={e => e.stopPropagation()}>
            <img src={preview.path || preview.photo_path}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={() => window.open(preview.path || preview.photo_path, '_blank')}
              style={{ cursor: 'zoom-in' }} />
          </div>
          <div className="flex items-center justify-center gap-6 px-4 py-4 bg-black/40 backdrop-blur-sm" onClick={e => e.stopPropagation()}>
            <a href={preview.path || preview.photo_path} download={preview.name}
              className="flex items-center gap-2 px-6 py-2.5 bg-white text-gray-900 rounded-full text-sm font-medium hover:bg-gray-100 transition shadow-lg">
              <Download size={16} /> 下载
            </a>
          </div>
        </div>
      )}

      {showShare && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowShare(null)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-sm max-h-[70vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}
            style={{ animation: 'slideUp 0.2s ease-out' }}>
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-5 sm:hidden" />
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Share2 size={18} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">分享照片</h3>
                <p className="text-xs text-gray-500">选择要分享的好友</p>
              </div>
            </div>
            <div className="space-y-1">
              {friends.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <User size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">暂无好友可分享</p>
                </div>
              ) : (
                friends.map(f => (
                  <button key={f.id} onClick={() => { sharePhoto(showShare.id, f.id); setShowShare(null) }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-50 text-sm transition group">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                      {(f.nickname || '?')[0]}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-gray-800 font-medium">{f.nickname || f.wxid}</p>
                      <p className="text-xs text-gray-400">{f.wxid}</p>
                    </div>
                    <div className="p-2 rounded-full bg-indigo-50 text-indigo-400 opacity-0 group-hover:opacity-100 transition">
                      <Share2 size={14} />
                    </div>
                  </button>
                ))
              )}
            </div>
            <button onClick={() => setShowShare(null)}
              className="w-full mt-4 py-3 bg-gray-100 rounded-xl text-sm text-gray-600 font-medium hover:bg-gray-200 transition">取消</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

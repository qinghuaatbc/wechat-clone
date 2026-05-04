import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Loader2, ChevronUp, Smile, Image, Video, FileText, File } from 'lucide-react'
import { useStore } from '../store'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import EmojiPicker from '../components/EmojiPicker'
import AttachMenu from '../components/AttachMenu'
import ContextMenu from '../components/ContextMenu'
import MessageBubble from '../components/MessageBubble'
import SwipeBack from '../components/SwipeBack'
import { TimeSeparator, RecalledMessage, getDateForCompare, getTimeDiffMinutes } from '../components/MessageUtils'

const compressImage = (file, maxWidth = 1024, quality = 0.8) => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width, height = img.height
        if (width > maxWidth) { height = (height * maxWidth) / width; width = maxWidth }
        canvas.width = width; canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

export default function ChatWindow() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = useStore(s => s.user)
  const isFileHelper = id === 'file-helper'
  const rawMessages = useStore(s => isFileHelper ? (s.messages[user?.id] || []) : (s.messages[id] || []))
  const messages = useMemo(() => [...rawMessages].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)), [rawMessages])
  const loadMessages = useStore(s => s.loadMessages)
  const clearUnread = useStore(s => s.clearUnread)
  const previewImage = useStore(s => s.previewImage)
  const setPreviewImage = useStore(s => s.setPreviewImage)
  const loading = useStore(s => s.loading)
  const token = useStore(s => s.token)
  const friends = useStore(s => s.friends)

  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const [contextMenu, setContextMenu] = useState(null)
  const [quote, setQuote] = useState(null)
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [longPressTimer, setLongPressTimer] = useState(null)
  const videoRef = useRef(null); const fileRef = useRef(null); const imgRef = useRef(null); const modelRef = useRef(null)

  const friend = isFileHelper ? { nickname: '文件传输助手' } : (friends.find(f => f.id === id) || { nickname: '未知用户' })
  const convId = isFileHelper ? user?.id : id

  useEffect(() => {
    if (!user?.id) return
    loadMessages(convId)
    if (!isFileHelper) clearUnread(id)
  }, [convId])

  const sendTextMessage = async () => {
    if (!input.trim() && !quote || sending) return
    setSending(true)
    const msg = { id: `temp-${Date.now()}`, sender_id: user.id, receiver_id: isFileHelper ? user.id : id, content: input.trim(), type: 1, quote_content: quote, created_at: new Date().toISOString(), is_recalled: false }
    useStore.getState().addMessage(msg)
    setInput(''); setQuote(null)
    try {
      await fetch('/api/messages/send', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ receiver_id: isFileHelper ? user.id : id, content: msg.content, type: 1, quote_content: msg.quote_content }) })
    } catch { toast.error('消息发送失败') }
    setSending(false)
  }

  const uploadAndSend = async (file, receiverId, type) => {
    if (file.size > 100 * 1024 * 1024) { toast.error('文件大小不能超过100MB'); return }
    setUploading(true)
    const fd = new FormData(); fd.append('file', file)
    try {
      const res = await fetch('/api/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd })
      const data = await res.json()
      useStore.getState().addMessage({ id: `${type}-${Date.now()}`, sender_id: user.id, receiver_id: receiverId, content: data.url, file_name: data.filename, file_size: data.size, type, created_at: new Date().toISOString() })
      await fetch('/api/messages/send', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ receiver_id: receiverId, content: data.url, type, file_name: data.filename, file_size: data.size }) })
    } catch { toast.error('上传失败') }
    setUploading(false)
  }

  const handleUpload = (ref, type) => (e) => {
    const file = e.target.files?.[0]; if (!file) return
    setShowAttachMenu(false)
    uploadAndSend(file, isFileHelper ? user.id : id, type)
    e.target.value = ''
  }

  const handleAttachSelect = (type) => {
    const map = { video: videoRef, image: imgRef, file: fileRef, model: modelRef }
    map[type]?.current?.click()
  }

  // Context menu handlers
  const handleCopy = async (text) => { await navigator.clipboard.writeText(text); setContextMenu(null); toast.success('已复制') }
  const handleRecall = async (msgId) => {
    await fetch('/api/messages/recall', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ msg_id: msgId }) })
    useStore.getState().addMessage({ id: msgId, is_recalled: true })
    setContextMenu(null); toast.info('消息已撤回')
  }
  const handleDelete = async (msgId) => {
    await fetch(`/api/messages/${msgId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    useStore.getState().deleteMessage(convId, msgId)
    setContextMenu(null); toast.success('消息已删除')
  }

  return (
    <SwipeBack onSwipe={() => navigate(-1)}>
      <div className="flex flex-col h-screen max-w-md mx-auto bg-[#F5F5F5] dark:bg-wechat-dark">
        <header className="flex items-center justify-between px-4 py-3 bg-wechat-bar dark:bg-wechat-dark border-b border-wechat-border z-10">
          <button onClick={() => navigate(-1)} className="p-1 active:bg-wechat-bg rounded transition"><ArrowLeft size={24} /></button>
          <h2 className="font-semibold text-lg">{friend.nickname}</h2>
          <div className="w-8" />
        </header>

        <div className="flex-1 overflow-y-auto pb-4">
          {loading && messages.length === 0 ? (
            <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-wechat-green w-8 h-8" /></div>
          ) : (
            messages.map((m, i) => {
              const showTime = m.created_at && (i === 0 || getDateForCompare(m.created_at) !== getDateForCompare(messages[i-1]?.created_at) || getTimeDiffMinutes(m.created_at, messages[i-1]?.created_at) > 5)
              const isMine = m.sender_id === user?.id
              return (
                <div key={m.id}>
                  {showTime && <TimeSeparator date={m.created_at} />}
                  {m.is_recalled ? <RecalledMessage isMine={isMine} /> : (
                    <MessageBubble msg={m} isMine={isMine} user={user} friend={friend}
                      onImageClick={(url) => setPreviewImage(url)}
                      onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, msg: m }) }}
                      onTouchStart={() => { const t = setTimeout(() => setContextMenu({ x: 0, y: 0, msg: m }), 500); setLongPressTimer(t) }}
                      onTouchEnd={() => { if (longPressTimer) clearTimeout(longPressTimer) }}
                      onTouchMove={() => { if (longPressTimer) clearTimeout(longPressTimer) }} />
                  )}
                </div>
              )
            })
          )}
        </div>

        {showEmoji && <EmojiPicker onSelect={(e) => setInput(p => p + e)} />}

        {quote && (
          <div className="flex items-center justify-between px-4 py-2 bg-wechat-bg text-sm">
            <span className="truncate mr-2">引用: {quote}</span>
            <button onClick={() => setQuote(null)} className="text-wechat-gray">X</button>
          </div>
        )}

        <div className="flex items-center gap-2 p-3 bg-wechat-bar dark:bg-wechat-dark border-t border-wechat-border pb-6 sm:pb-3">
          <button onClick={() => setShowEmoji(!showEmoji)} className="p-2 active:bg-wechat-bg rounded transition"><Smile size={26} className="text-wechat-gray" /></button>
          <div className="relative">
            <button onClick={() => setShowAttachMenu(!showAttachMenu)} className="p-2 active:bg-wechat-bg rounded transition">
              <ChevronUp size={26} className={`text-wechat-gray transition ${showAttachMenu ? 'rotate-180' : ''}`} />
            </button>
            {showAttachMenu && <AttachMenu onClose={() => setShowAttachMenu(false)} onSelect={handleAttachSelect} />}
          </div>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendTextMessage()}
            placeholder="输入消息..." className="flex-1 px-4 py-2.5 bg-white dark:bg-wechat-dark rounded-lg text-base focus:outline-none" />
          <button onClick={sendTextMessage} disabled={sending}
            className="p-2.5 bg-wechat-green text-white rounded-lg hover:opacity-90 transition disabled:opacity-50">
            {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>

        {uploading && (
          <div className="px-4 py-2 bg-wechat-bg dark:bg-gray-800 border-t border-wechat-border">
            <div className="flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-wechat-green" />
              <span className="text-sm text-wechat-gray">上传中...</span>
            </div>
          </div>
        )}

        <ContextMenu menu={contextMenu} userId={user?.id}
          onClose={() => setContextMenu(null)}
          onCopy={handleCopy}
          onQuote={(text) => { setQuote(text); setContextMenu(null) }}
          onRecall={handleRecall}
          onDelete={handleDelete} />

        <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={handleUpload(videoRef, 4)} />
        <input ref={fileRef} type="file" className="hidden" onChange={handleUpload(fileRef, 5)} />
        <input ref={modelRef} type="file" accept=".glb,.gltf,.obj,.stl,.fbx" className="hidden" onChange={handleUpload(modelRef, 6)} />
        <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={handleUpload(imgRef, 3)} />

        <AnimatePresence>
          {previewImage && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center" onClick={() => setPreviewImage(null)}>
              <button onClick={() => setPreviewImage(null)} className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/60 text-white rounded-full flex items-center justify-center text-xl hover:bg-black/80 transition">✕</button>
              {previewImage.endsWith('.glb') || previewImage.endsWith('.gltf') ? (
                <model-viewer src={previewImage} camera-controls auto-rotate rotation-per-second="120"
                  style={{ width: '90vw', height: '80vh' }} className="rounded-lg" onClick={e => e.stopPropagation()}></model-viewer>
              ) : (
                <motion.img initial={{ scale: 0.8 }} animate={{ scale: 1 }} src={previewImage} alt="Preview"
                  className="max-w-full max-h-full object-contain" onClick={e => e.stopPropagation()} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SwipeBack>
  )
}

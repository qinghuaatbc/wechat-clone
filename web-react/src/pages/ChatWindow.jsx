import { useState, useEffect, useRef, useCallback, Fragment, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Image, Loader2, ChevronUp, Check, CheckCheck, Copy, CornerDownRight, RotateCcw, Smile, Video, FileText, Play, Download, File, X, Trash2 } from 'lucide-react'
import { useStore } from '../store'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

const EMOJIS = ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖']

const isValidDate = (dateStr) => {
  if (!dateStr) return false
  const d = new Date(dateStr)
  return d instanceof Date && !isNaN(d) && d.getFullYear() > 2000
}

const formatTime = (dateStr) => {
  if (!isValidDate(dateStr)) return ''
  const d = new Date(dateStr)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const formatDate = (dateStr) => {
  if (!isValidDate(dateStr)) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return '今天 ' + formatTime(dateStr)
  if (diffDays === 1) return '昨天 ' + formatTime(dateStr)
  if (diffDays < 7) return ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][d.getDay()] + ' ' + formatTime(dateStr)
  return d.toLocaleDateString() + ' ' + formatTime(dateStr)
}

const getDateForCompare = (dateStr) => {
  if (!isValidDate(dateStr)) return ''
  return new Date(dateStr).toDateString()
}

const getTimeDiffMinutes = (dateStr1, dateStr2) => {
  if (!isValidDate(dateStr1) || !isValidDate(dateStr2)) return 0
  return Math.abs(new Date(dateStr1) - new Date(dateStr2)) / (1000 * 60)
}

// 2. 图片压缩辅助函数
const compressImage = (file, maxWidth = 1024, quality = 0.8) => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        canvas.width = width
        canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

// 侧滑返回包装器
const SwipeBack = ({ onSwipe, children }) => {
  const startX = useRef(0)
  const isNearEdge = useRef(false)

  const handleTouchStart = (e) => {
    if (e.touches[0].clientX < 30) {
      isNearEdge.current = true
      startX.current = e.touches[0].clientX
    }
  }

  const handleTouchEnd = (e) => {
    if (isNearEdge.current && e.changedTouches[0].clientX - startX.current > 80) {
      onSwipe()
    }
    isNearEdge.current = false
  }

  return (
    <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {children}
    </div>
  )
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
  const [uploadProgress, setUploadProgress] = useState(null)
  const [longPressTimer, setLongPressTimer] = useState(null)
  const videoInputRef = useRef(null)
  const fileInputRef = useRef(null)
  const imageInputRef = useRef(null)
  const model3dRef = useRef(null)

  const friend = isFileHelper ? { nickname: '文件传输助手' } : (friends.find(f => f.id === id) || { nickname: '未知用户' })

  const convId = isFileHelper ? user?.id : id

  useEffect(() => {
    if (!user?.id) return
    loadMessages(convId)
    if (!isFileHelper) clearUnread(id)
  }, [convId, loadMessages, clearUnread, isFileHelper, user?.id])

  const sendTextMessage = async () => {
    if (!input.trim() && !quote) return
    if (sending) return
    setSending(true)

    const msg = {
      id: `temp-${Date.now()}`,
      sender_id: user.id,
      receiver_id: isFileHelper ? user.id : id,
      content: input.trim(),
      type: 1,
      quote_content: quote,
      created_at: new Date().toISOString(),
      is_recalled: false
    }

    useStore.getState().addMessage(msg)
    setInput('')
    setQuote(null)

    try {
      await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ receiver_id: isFileHelper ? user.id : id, content: msg.content, type: 1, quote_content: msg.quote_content })
      })
    } catch (e) {
      toast.error('消息发送失败')
    } finally {
      setSending(false)
    }
  }

  const handleCopy = async (text) => {
    await navigator.clipboard.writeText(text)
    setContextMenu(null)
    toast.success('已复制')
  }

  const handleRecall = async (msgId) => {
    await fetch('/api/messages/recall', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ msg_id: msgId })
    })
    // Update local state
    const updatedMessages = messages.map(m => m.id === msgId ? { ...m, is_recalled: true } : m)
    useStore.getState().addMessage({ id: msgId, is_recalled: true })
    setContextMenu(null)
    toast.info('消息已撤回')
  }

  const handleDelete = async (msgId) => {
    try {
      await fetch(`/api/messages/${msgId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      useStore.getState().deleteMessage(convId, msgId)
      setContextMenu(null)
      toast.success('消息已删除')
    } catch (e) {
      toast.error('删除失败')
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setShowAttachMenu(false)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '上传失败')
      useStore.getState().addMessage({ id: `img-${Date.now()}`, sender_id: user.id, receiver_id: isFileHelper ? user.id : id, content: data.url, type: 3, created_at: new Date().toISOString() })
      await fetch('/api/messages/send', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ receiver_id: isFileHelper ? user.id : id, content: data.url, type: 3 }) })
    } catch (err) {
      toast.error('图片上传失败')
    }
    e.target.value = ''
  }

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setShowAttachMenu(false)
    await uploadAndSend(file, isFileHelper ? user.id : id, 4)
    e.target.value = ''
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setShowAttachMenu(false)
    await uploadAndSend(file, isFileHelper ? user.id : id, 5)
    e.target.value = ''
  }

  const handle3DModelUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setShowAttachMenu(false)
    await uploadAndSend(file, isFileHelper ? user.id : id, 6)
    e.target.value = ''
  }

  const uploadAndSend = async (file, receiverId, type) => {
    if (file.size > 100 * 1024 * 1024) {
      toast.error('文件大小不能超过100MB')
      return
    }
    setUploading(true)
    setUploadProgress(0)
    setShowAttachMenu(false)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData })
      const data = await res.json()
      
      const tempId = `${type === 4 ? 'vid' : 'file'}-${Date.now()}`
      const msg = {
        id: tempId,
        sender_id: user.id,
        receiver_id: receiverId,
        content: data.url,
        file_name: data.filename,
        file_size: data.size,
        type: type,
        created_at: new Date().toISOString()
      }
      useStore.getState().addMessage(msg)
      
      await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ receiver_id: receiverId, content: data.url, type: type, file_name: data.filename, file_size: data.size })
      })
    } catch (e) {
      toast.error('上传失败')
    } finally {
      setUploading(false)
      setUploadProgress(null)
    }
  }

  const openFilePicker = (ref) => {
    ref.current?.click()
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return ''
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const handleRecalledMessage = (msg) => {
    const isMine = msg.sender_id === user.id
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs text-wechat-gray italic">
          {isMine ? '你撤回了一条消息' : '对方撤回了一条消息'}
        </span>
      </div>
    )
  }

  const renderMessage = (msg) => {
    if (msg.is_recalled) return handleRecalledMessage(msg)

    const isMine = msg.sender_id === user?.id
          const handleTouchStart = (e) => {
            const timer = setTimeout(() => {
              setContextMenu({ x: e.touches[0].clientX, y: e.touches[0].clientY, msg })
            }, 500)
            setLongPressTimer(timer)
          }

          const handleTouchEnd = () => {
            if (longPressTimer) clearTimeout(longPressTimer)
          }
          
          return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-3 px-4`}>
              <div className="flex items-end gap-2 max-w-[80%]">
                {!isMine && (
                  <div className="w-8 h-8 rounded-lg bg-wechat-green/20 flex items-center justify-center text-wechat-green text-sm font-bold flex-shrink-0">
                    {friend.nickname?.[0] || '?'}
                  </div>
                )}
                
                <div className={`px-3.5 py-2 rounded-2xl text-[15px] relative ${isMine ? 'bg-wechat-green text-white rounded-tr-sm' : 'bg-white text-wechat-dark rounded-tl-sm shadow-sm'}`}
                  onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, msg }) }}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                  onTouchMove={handleTouchEnd}
                >
            {msg.quote_content && (
              <div className={`mb-1.5 pl-2 py-1 border-l-2 text-xs rounded ${isMine ? 'border-white/50 bg-white/20' : 'border-wechat-green/50 bg-wechat-bg'}`}>
                <CornerDownRight size={12} className="inline mr-1 mb-0.5" />
                {msg.quote_content.length > 20 ? msg.quote_content.slice(0, 20) + '...' : msg.quote_content}
              </div>
            )}
            
            {msg.type === 3 ? (
              <img src={msg.content} alt="" className="max-w-[200px] rounded-lg cursor-pointer" onClick={() => setPreviewImage(msg.content)} />
            ) : msg.type === 4 ? (
              <div className="relative">
                <video src={msg.content} className="max-w-[200px] rounded-lg" preload="metadata" controls />
              </div>
            ) : msg.type === 5 ? (
              <div className="flex items-center gap-3 min-w-[180px]">
                <div className="w-10 h-10 rounded-lg bg-wechat-bg dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <FileText size={20} className="text-wechat-green" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate dark:text-white">{msg.file_name || '文件'}</p>
                  <p className="text-xs text-wechat-gray">{formatFileSize(msg.file_size)}</p>
                </div>
                <a href={msg.content} download={msg.file_name} className="p-1.5 rounded-full hover:bg-wechat-bg dark:hover:bg-gray-700 transition" title="下载">
                  <Download size={18} className="text-wechat-green" />
                </a>
              </div>
            ) : msg.type === 6 ? (
              <div 
                className="relative cursor-pointer" 
                onClick={() => setPreviewImage(msg.content)}
              >
                <model-viewer 
                  src={msg.content} 
                  camera-controls 
                  auto-rotate 
                  style={{ width: '200px', height: '200px', background: '#1a1a2e' }}
                  className="rounded-lg pointer-events-none"
                ></model-viewer>
                <a href={msg.content} download={msg.file_name} className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition" title="下载" onClick={e => e.stopPropagation()}>
                  <Download size={16} />
                </a>
              </div>
            ) : msg.type === 2 ? (
              <audio controls src={msg.content} className="w-48 h-8" preload="none" />
            ) : (
              <span className="whitespace-pre-wrap break-words">{msg.content}</span>
            )}
             
            {isMine && (
              <div className="absolute -right-6 top-1/2 -translate-y-1/2">
                {msg.status === 2 ? <CheckCheck size={14} className="text-blue-500" /> : <Check size={14} className="text-wechat-gray" />}
              </div>
            )}
          </div>
        </motion.div>
    )
  }
      <div className="flex flex-col h-screen max-w-md mx-auto bg-[#F5F5F5] dark:bg-wechat-dark">
        {/* 全局字体大小控制 */}
        <header className="flex items-center justify-between px-4 py-3 bg-wechat-bar dark:bg-wechat-dark border-b border-wechat-border z-10">
          <button onClick={() => navigate(-1)} className="p-1 active:bg-wechat-bg rounded transition"><ArrowLeft size={24} /></button>
          <h2 className="font-semibold text-lg">{friend.nickname}</h2>
          <div className="w-8" />
        </header>

        <div className="flex-1 overflow-y-auto pb-4" onWheel={(e) => { if (e.target.scrollTop < 10) {/* Load more */ } }}>
          {loading && messages.length === 0 ? (
            <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-wechat-green w-8 h-8" /></div>
          ) : (
            <>
              {messages.map((m, i) => {
                const showTime = isValidDate(m.created_at) && (
                  i === 0 || 
                  getDateForCompare(m.created_at) !== getDateForCompare(messages[i - 1]?.created_at) ||
                  getTimeDiffMinutes(m.created_at, messages[i - 1]?.created_at) > 5
                )

                return (
                <Fragment key={m.id}>
                  {showTime && (
                    <div className="flex justify-center my-3">
                      <span className="text-xs text-wechat-gray bg-wechat-bg px-2 py-1 rounded">{formatDate(m.created_at)}</span>
                    </div>
                  )}
                  {renderMessage(m)}
                </Fragment>
              )
              })}
            </>
          )}
        </div>

        {/* Emoji Picker */}
        {showEmoji && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="bg-wechat-bar border-t border-wechat-border overflow-hidden">
            <div className="grid grid-cols-8 gap-2 p-4 h-48 overflow-y-auto">
              {EMOJIS.map((e, i) => (
                <button key={i} onClick={() => setInput(prev => prev + e)} className="text-2xl hover:bg-wechat-bg rounded p-1">{e}</button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Quote Bar */}
        {quote && (
          <div className="flex items-center justify-between px-4 py-2 bg-wechat-bg text-sm">
            <span className="truncate mr-2">引用: {quote}</span>
            <button onClick={() => setQuote(null)} className="text-wechat-gray">X</button>
          </div>
        )}

        {/* Input bar */}
        <div className="flex items-center gap-2 p-3 bg-wechat-bar dark:bg-wechat-dark border-t border-wechat-border pb-6 sm:pb-3">
          <button onClick={() => setShowEmoji(!showEmoji)} className="p-2 active:bg-wechat-bg rounded transition"><Smile size={26} className="text-wechat-gray" /></button>
          
          <div className="relative">
            <button onClick={() => setShowAttachMenu(!showAttachMenu)} className="p-2 active:bg-wechat-bg rounded transition"><ChevronUp size={26} className={`text-wechat-gray transition ${showAttachMenu ? 'rotate-180' : ''}`} /></button>
            
            {showAttachMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowAttachMenu(false)} />
                <div className="absolute bottom-12 left-0 bg-white dark:bg-wechat-dark rounded-xl shadow-xl py-2 min-w-40 z-40">
                  <button onClick={() => openFilePicker(videoInputRef)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-wechat-bg dark:hover:bg-gray-800 transition">
                    <Video size={18} className="text-wechat-green" />
                    <span className="text-sm dark:text-wechat-darkText">视频</span>
                  </button>
                  <button onClick={() => openFilePicker(fileInputRef)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-wechat-bg dark:hover:bg-gray-800 transition">
                    <FileText size={18} className="text-wechat-blue" />
                    <span className="text-sm dark:text-wechat-darkText">文件</span>
                  </button>
                  <button onClick={() => openFilePicker(model3dRef)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-wechat-bg dark:hover:bg-gray-800 transition">
                    <File size={18} className="text-purple-500" />
                    <span className="text-sm dark:text-wechat-darkText">3D模型</span>
                  </button>
                  <button onClick={() => openFilePicker(imageInputRef)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-wechat-bg dark:hover:bg-gray-800 transition">
                    <Image size={18} className="text-wechat-green" />
                    <span className="text-sm dark:text-wechat-darkText">图片</span>
                  </button>
                </div>
              </>
            )}
          </div>
          
          <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendTextMessage()} placeholder="输入消息..." className="flex-1 px-4 py-2.5 bg-white dark:bg-wechat-dark rounded-lg text-base focus:outline-none" />
          
          <button onClick={sendTextMessage} disabled={sending} className="p-2.5 bg-wechat-green text-white rounded-lg hover:opacity-90 transition disabled:opacity-50">
            {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="px-4 py-2 bg-wechat-bg dark:bg-gray-800 border-t border-wechat-border">
            <div className="flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-wechat-green" />
              <span className="text-sm text-wechat-gray">上传中...</span>
            </div>
          </div>
        )}

        {/* Context Menu */}
        <AnimatePresence>
          {contextMenu && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed z-50 bg-white rounded-xl shadow-xl py-2 w-40" style={{ left: contextMenu.x - 160, top: contextMenu.y - 40 }}>
                {contextMenu.msg.type === 1 && (
                  <button onClick={() => handleCopy(contextMenu.msg.content)} className="w-full px-4 py-2.5 text-left text-sm hover:bg-wechat-bg flex items-center gap-2"><Copy size={16} /> 复制</button>
                )}
                <button onClick={() => { setQuote(contextMenu.msg.content); setContextMenu(null) }} className="w-full px-4 py-2.5 text-left text-sm hover:bg-wechat-bg flex items-center gap-2"><CornerDownRight size={16} /> 引用</button>
                {contextMenu.msg.sender_id === user.id && !contextMenu.msg.is_recalled && (
                  <button onClick={() => handleRecall(contextMenu.msg.id)} className="w-full px-4 py-2.5 text-left text-sm hover:bg-wechat-bg flex items-center gap-2"><RotateCcw size={16} /> 撤回</button>
                )}
                <button onClick={() => handleDelete(contextMenu.msg.id)} className="w-full px-4 py-2.5 text-left text-sm hover:bg-wechat-bg text-red-500 flex items-center gap-2"><Trash2 size={16} /> 删除</button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Hidden file inputs */}
        <input ref={videoInputRef} type="file" accept="video/*" className="absolute top-[-9999px] left-[-9999px] opacity-0 pointer-events-none" onChange={handleVideoUpload} />
        <input ref={fileInputRef} type="file" className="absolute top-[-9999px] left-[-9999px] opacity-0 pointer-events-none" onChange={handleFileUpload} />
        <input ref={model3dRef} type="file" accept=".glb,.gltf,.obj,.stl,.fbx" className="absolute top-[-9999px] left-[-9999px] opacity-0 pointer-events-none" onChange={handle3DModelUpload} />
        <input ref={imageInputRef} type="file" accept="image/*" className="absolute top-[-9999px] left-[-9999px] opacity-0 pointer-events-none" onChange={handleImageUpload} />

        {/* Image/3D Preview */}
        <AnimatePresence>
          {useStore.getState().previewImage && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center" onClick={() => setPreviewImage(null)}>
              {useStore.getState().previewImage.endsWith('.glb') || useStore.getState().previewImage.endsWith('.gltf') ? (
                <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} onClick={e => e.stopPropagation()}>
                  <model-viewer 
                    src={useStore.getState().previewImage} 
                    camera-controls 
                    auto-rotate 
                    style={{ width: '90vw', height: '80vh' }}
                    className="rounded-lg"
                  ></model-viewer>
                </motion.div>
              ) : (
                <motion.img initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} src={useStore.getState().previewImage} alt="Preview" className="max-w-full max-h-full object-contain" />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SwipeBack>
  )
}

import { Fragment } from 'react'
import { Check, CheckCheck, CornerDownRight, FileText, Download, X } from 'lucide-react'

const isValidDate = (dateStr) => {
  if (!dateStr) return false
  const d = new Date(dateStr)
  return d instanceof Date && !isNaN(d) && d.getFullYear() > 2000
}

export const formatTime = (dateStr) => {
  if (!isValidDate(dateStr)) return ''
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export const formatDate = (dateStr) => {
  if (!isValidDate(dateStr)) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return '今天 ' + formatTime(dateStr)
  if (diffDays === 1) return '昨天 ' + formatTime(dateStr)
  if (diffDays < 7) return ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'][d.getDay()] + ' ' + formatTime(dateStr)
  return d.toLocaleDateString() + ' ' + formatTime(dateStr)
}

export const getDateForCompare = (dateStr) => {
  if (!isValidDate(dateStr)) return ''
  return new Date(dateStr).toDateString()
}

export const getTimeDiffMinutes = (dateStr1, dateStr2) => {
  if (!isValidDate(dateStr1) || !isValidDate(dateStr2)) return 0
  return Math.abs(new Date(dateStr1) - new Date(dateStr2)) / (1000 * 60)
}

export const formatFileSize = (bytes) => {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export function TimeSeparator({ date }) {
  return (
    <div className="flex justify-center my-3">
      <span className="text-xs text-wechat-gray bg-wechat-bg px-2 py-1 rounded">{formatDate(date)}</span>
    </div>
  )
}

export function RecalledMessage({ isMine }) {
  return (
    <div className="flex justify-center my-2">
      <span className="text-xs text-wechat-gray italic">
        {isMine ? '你撤回了一条消息' : '对方撤回了一条消息'}
      </span>
    </div>
  )
}

export function AvatarDisplay({ src, name, is3D }) {
  return (
    <div className="w-8 h-8 rounded-full bg-wechat-green/20 flex items-center justify-center text-wechat-green text-sm font-bold flex-shrink-0 overflow-hidden">
      {src && is3D ? (
        <model-viewer src={src} camera-controls auto-rotate rotation-per-second="120" interaction-prompt="none" style={{width:'100%',height:'100%'}}></model-viewer>
      ) : src ? (
        <img src={src} className="w-full h-full object-cover" />
      ) : (
        (name?.[0] || '?')
      )}
    </div>
  )
}

export function QuoteBlock({ content, isMine }) {
  return (
    <div className={`mb-1.5 pl-2 py-1 border-l-2 text-xs rounded ${isMine ? 'border-white/50 bg-white/20' : 'border-wechat-green/50 bg-wechat-bg'}`}>
      <CornerDownRight size={12} className="inline mr-1 mb-0.5" />
      {content?.length > 20 ? content.slice(0, 20) + '...' : content}
    </div>
  )
}

export function FileMessage({ msg, onDownload }) {
  return (
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
  )
}

import { Video, FileText, File, Image } from 'lucide-react'

export default function AttachMenu({ onClose, onSelect }) {
  const items = [
    { id: 'video', label: '视频', icon: Video, color: 'text-wechat-green' },
    { id: 'file', label: '文件', icon: FileText, color: 'text-wechat-blue' },
    { id: 'model', label: '3D模型', icon: File, color: 'text-purple-500' },
    { id: 'image', label: '图片', icon: Image, color: 'text-wechat-green' },
  ]
  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div className="absolute bottom-12 left-0 bg-white dark:bg-wechat-dark rounded-xl shadow-xl py-2 min-w-40 z-40">
        {items.map(item => (
          <button key={item.id} onClick={() => { onSelect(item.id); onClose() }}
            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-wechat-bg dark:hover:bg-gray-800 transition">
            <item.icon size={18} className={item.color} />
            <span className="text-sm dark:text-wechat-darkText">{item.label}</span>
          </button>
        ))}
      </div>
    </>
  )
}

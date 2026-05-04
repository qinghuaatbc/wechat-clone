import { motion, AnimatePresence } from 'framer-motion'
import { Copy, CornerDownRight, RotateCcw, Trash2 } from 'lucide-react'

export default function ContextMenu({ menu, userId, onClose, onCopy, onQuote, onRecall, onDelete }) {
  if (!menu) return null
  const { msg, x, y } = menu
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-40" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
        className="fixed z-50 bg-white rounded-xl shadow-xl py-2 w-40"
        style={{ left: x - 160, top: y - 40 }}>
        {msg.type === 1 && (
          <button onClick={() => { onCopy(msg.content); onClose() }}
            className="w-full px-4 py-2.5 text-left text-sm hover:bg-wechat-bg flex items-center gap-2">
            <Copy size={16} /> 复制
          </button>
        )}
        <button onClick={() => { onQuote(msg.content); onClose() }}
          className="w-full px-4 py-2.5 text-left text-sm hover:bg-wechat-bg flex items-center gap-2">
          <CornerDownRight size={16} /> 引用
        </button>
        {msg.sender_id === userId && !msg.is_recalled && (
          <button onClick={() => { onRecall(msg.id); onClose() }}
            className="w-full px-4 py-2.5 text-left text-sm hover:bg-wechat-bg flex items-center gap-2">
            <RotateCcw size={16} /> 撤回
          </button>
        )}
        <button onClick={() => { onDelete(msg.id); onClose() }}
          className="w-full px-4 py-2.5 text-left text-sm hover:bg-wechat-bg text-red-500 flex items-center gap-2">
          <Trash2 size={16} /> 删除
        </button>
      </motion.div>
    </AnimatePresence>
  )
}

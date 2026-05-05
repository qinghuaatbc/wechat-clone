import { motion } from 'framer-motion'
import { AvatarDisplay, QuoteBlock, FileMessage } from './MessageUtils'

export default function MessageBubble({ msg, isMine, user, friend, onContextMenu, onTouchStart, onTouchEnd, onTouchMove, onImageClick }) {
  const is3DAvatar = (url) => url && (url.endsWith('.glb') || url.endsWith('.gltf'))
  const avatarSrc = isMine ? user?.avatar : friend?.avatar
  const avatarName = isMine ? user?.nickname : friend?.nickname

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-3 px-4 items-start`}>
      <div className={`flex items-start gap-2 max-w-[80%] ${isMine ? 'flex-row-reverse' : ''}`}>
        <AvatarDisplay src={avatarSrc} name={avatarName} is3D={is3DAvatar(avatarSrc)} />
        <div className={`px-3.5 py-2 rounded-2xl text-[15px] relative ${isMine ? 'bg-wechat-green text-white rounded-tr-sm' : 'bg-white text-wechat-dark rounded-tl-sm shadow-sm'}`}
          onContextMenu={onContextMenu}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onTouchMove={onTouchMove}>
          {msg.quote_content && <QuoteBlock content={msg.quote_content} isMine={isMine} />}
          {msg.type === 3 ? (
            <img src={msg.content} alt="" className="max-w-[200px] rounded-lg cursor-pointer" onClick={() => onImageClick(msg.content)} />
          ) : msg.type === 4 ? (
            <div className="relative">
              <video src={msg.content} className="max-w-[200px] rounded-lg" preload="metadata" controls playsInline webkit-playsinline="true" />
            </div>
          ) : msg.type === 5 ? (
            <FileMessage msg={msg} />
          ) : msg.type === 6 ? (
            <div className="relative cursor-pointer" onClick={() => onImageClick(msg.content)}>
              <model-viewer src={msg.content} camera-controls auto-rotate rotation-per-second="120"
                style={{ width: '200px', height: '200px', background: '#1a1a2e' }} className="rounded-lg"></model-viewer>
              <a href={msg.content} download={msg.file_name}
                className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition"
                title="下载" onClick={e => e.stopPropagation()}>
                <Download size={16} />
              </a>
            </div>
          ) : (
            <span className="whitespace-pre-wrap break-words">{msg.content}</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

import { Download } from 'lucide-react'

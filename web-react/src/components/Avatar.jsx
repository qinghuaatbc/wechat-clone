import { Suspense, useState } from 'react'

const is3DAvatar = (url) => url && (url.endsWith('.glb') || url.endsWith('.gltf'))

export default function Avatar({ src, name, size = 10, className = '' }) {
  const [failed, setFailed] = useState(false)
  const sizeClass = `w-${size} h-${size}`

  if (src && is3DAvatar(src) && !failed) {
    return (
      <div className={`${sizeClass} rounded-lg overflow-hidden ${className}`} style={{ minWidth: size * 4, minHeight: size * 4 }}>
        <model-viewer
          src={src}
          camera-controls
          auto-rotate
          interaction-prompt="none"
          style={{ width: '100%', height: '100%', background: 'transparent' }}
          onError={() => setFailed(true)}
        ></model-viewer>
      </div>
    )
  }

  return (
    <div className={`${sizeClass} rounded-lg bg-wechat-green/20 flex items-center justify-center text-wechat-green text-xl font-bold flex-shrink-0 ${className}`}
      style={src && !is3DAvatar(src) ? { backgroundImage: `url(${src})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
      {(!src || is3DAvatar(src) || failed) && (name?.[0] || '?')}
    </div>
  )
}

import { useStore } from '../store'
import { useState, useRef } from 'react'
import { LogOut, ChevronRight, User, Settings, QrCode, Moon, Sun, Type, Image, X, Download } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'

export default function Profile() {
  const user = useStore(s => s.user)
  const logout = useStore(s => s.logout)
  const isDark = useStore(s => s.isDark)
  const toggleDark = useStore(s => s.toggleDark)
  const fontSize = useStore(s => s.fontSize)
  const setFontSize = useStore(s => s.setFontSize)
  const updateProfile = useStore(s => s.updateProfile)
  
  const [showQR, setShowQR] = useState(false)
  const fileInput = useRef(null)

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (file) {
      await updateProfile({ avatarFile: file })
    }
  }

  const handleDownloadQR = () => {
    const svg = document.getElementById('qr-code-svg')
    if (!svg) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, img.width, img.height)
      ctx.drawImage(img, 0, 0)
      const link = document.createElement('a')
      link.download = `wechat-qr-${user?.wxid}.png`
      link.href = canvas.toDataURL()
      link.click()
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }

  const menuItems = [
    { icon: User, label: '修改昵称', action: () => {
      const newName = prompt('输入新昵称', user?.nickname)
      if (newName) updateProfile({ nickname: newName })
    }},
    { icon: Image, label: '更换头像', action: () => fileInput.current.click() },
    { icon: isDark ? Sun : Moon, label: isDark ? '浅色模式' : '深色模式', action: toggleDark },
    { icon: Type, label: '字体大小', desc: `${fontSize}px` },
    { icon: QrCode, label: '我的二维码', action: () => setShowQR(true) },
  ]

  return (
    <div className="pb-16 bg-wechat-bg dark:bg-wechat-dark min-h-screen">
      <div className="bg-white dark:bg-wechat-dark p-6 mb-2">
        <div className="flex items-center gap-4">
          <div className="relative group cursor-pointer" onClick={() => fileInput.current.click()}>
            <div className="w-16 h-16 rounded-xl bg-wechat-green/20 flex items-center justify-center text-wechat-green text-2xl font-bold overflow-hidden">
              {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : (user?.nickname?.[0] || '?')}
            </div>
            <div className="absolute inset-0 bg-black/30 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><Image size={20} className="text-white" /></div>
          </div>
          <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          
          <div className="flex-1" onClick={() => {
            const newName = prompt('输入新昵称', user?.nickname)
            if (newName) updateProfile({ nickname: newName })
          }}>
            <h2 className="text-xl font-bold text-wechat-dark dark:text-wechat-darkText">{user?.nickname}</h2>
            <p className="text-sm text-wechat-gray mt-1">微信号: {user?.wxid}</p>
          </div>
          <ChevronRight className="text-wechat-gray" size={20} />
        </div>
      </div>

      <div className="bg-white dark:bg-wechat-dark divide-y divide-wechat-border">
        {menuItems.map((item, i) => (
          <div key={i} onClick={item.action} className="flex items-center justify-between p-4 active:bg-wechat-bg dark:active:bg-gray-800 transition cursor-pointer">
            <div className="flex items-center gap-3">
              <item.icon size={22} className="text-wechat-gray" />
              <span className="font-medium dark:text-wechat-darkText">{item.label}</span>
            </div>
            <div className="flex items-center gap-2 text-wechat-gray">
              {item.desc && <span className="text-sm">{item.desc}</span>}
              <ChevronRight size={18} />
            </div>
          </div>
        ))}

        {/* Font Size Slider */}
        {fontSize && (
          <div className="p-4 bg-white dark:bg-wechat-dark border-t border-wechat-border">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm">字体大小: {fontSize}px</span>
              <span className="text-sm">A</span>
            </div>
            <input type="range" min="12" max="24" value={fontSize} onChange={e => setFontSize(parseInt(e.target.value))} className="w-full h-2 bg-wechat-bg rounded-lg appearance-none cursor-pointer" />
          </div>
        )}
      </div>

      <div className="p-4 mt-4">
        <button onClick={logout} className="w-full py-3 bg-white dark:bg-wechat-dark text-red-500 rounded-lg font-medium hover:bg-red-50 dark:hover:bg-gray-800 transition">
          <LogOut size={20} className="inline mr-2" /> 退出登录
        </button>

      </div>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6"
            onClick={() => setShowQR(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white dark:bg-wechat-dark rounded-2xl p-8 w-full max-w-sm text-center"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold dark:text-white">我的二维码</h3>
                <button onClick={() => setShowQR(false)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                  <X size={20} className="text-wechat-gray" />
                </button>
              </div>

              <div className="bg-white p-4 rounded-xl inline-block shadow-inner mb-4">
                <QRCodeSVG
                  id="qr-code-svg"
                  value={`wechat://user/${user?.wxid}`}
                  size={200}
                  level="H"
                  includeMargin
                />
              </div>

              <p className="text-wechat-gray text-sm mb-2">微信号: {user?.wxid}</p>
              <p className="text-wechat-gray text-xs mb-4">扫描二维码添加我为好友</p>

              <button
                onClick={handleDownloadQR}
                className="flex items-center justify-center gap-2 mx-auto px-6 py-2.5 bg-wechat-green text-white rounded-full text-sm font-medium hover:opacity-90 transition"
              >
                <Download size={16} /> 保存到手机
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

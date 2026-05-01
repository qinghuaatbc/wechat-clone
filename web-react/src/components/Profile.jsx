import { useStore } from '../store'
import { useState, useRef } from 'react'
import { LogOut, ChevronRight, User, Settings, QrCode, Moon, Sun, Type, Image } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Profile() {
  const user = useStore(s => s.user)
  const logout = useStore(s => s.logout)
  const isDark = useStore(s => s.isDark)
  const toggleDark = useStore(s => s.toggleDark)
  const fontSize = useStore(s => s.fontSize)
  const setFontSize = useStore(s => s.setFontSize)
  const updateProfile = useStore(s => s.updateProfile)
  
  const [editing, setEditing] = useState(false)
  const fileInput = useRef(null)

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (file) {
      await updateProfile({ avatarFile: file })
    }
  }

  const menuItems = [
    { icon: User, label: '修改昵称', action: () => {
      const newName = prompt('输入新昵称', user?.nickname)
      if (newName) updateProfile({ nickname: newName })
    }},
    { icon: Image, label: '更换头像', action: () => fileInput.current.click() },
    { icon: isDark ? Sun : Moon, label: isDark ? '浅色模式' : '深色模式', action: toggleDark },
    { icon: Type, label: '字体大小', desc: `${fontSize}px` },
    { icon: QrCode, label: '我的二维码' },
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
    </div>
  )
}

import { useState, useEffect } from 'react'
import { MessageSquare, Users, Compass, User, Scan, Plus, X } from 'lucide-react'
import ChatList from '../components/ChatList'
import Contacts from '../components/Contacts'
import Discover from '../components/Discover'
import Profile from '../components/Profile'
import GroupList from '../components/GroupList'
import QRCode from '../components/QRCode'
import QRScanner from '../components/QRScanner'
import { useStore } from '../store'

const TABS = [
  { id: 'chat', icon: MessageSquare, label: '微信' },
  { id: 'contacts', icon: Users, label: '通讯录' },
  { id: 'discover', icon: Compass, label: '发现' },
  { id: 'profile', icon: User, label: '我' },
]

export default function MainLayout() {
  const [activeTab, setActiveTab] = useState('chat')
  const [showGroups, setShowGroups] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [showPlusMenu, setShowPlusMenu] = useState(false)
  const fetchFriends = useStore(s => s.fetchFriends)

  useEffect(() => {
    fetchFriends()
  }, [fetchFriends])

  const renderContent = () => {
    switch (activeTab) {
      case 'chat': return <ChatList />
      case 'contacts': return <Contacts />
      case 'discover': return <Discover onGroupClick={() => setShowGroups(true)} />
      case 'profile': return <Profile />
      default: return <ChatList />
    }
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white shadow-xl overflow-hidden relative">
      <header className="px-4 py-3 bg-wechat-bar border-b border-wechat-border sticky top-0 z-10 flex justify-between items-center">
        <h1 className="text-lg font-semibold text-center flex-1">
          {TABS.find(t => t.id === activeTab)?.label}
        </h1>
        {(activeTab === 'chat' || activeTab === 'contacts') && (
          <div className="relative">
            <button className="text-wechat-dark font-bold text-xl" onClick={() => setShowPlusMenu(!showPlusMenu)}>+</button>
            {showPlusMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowPlusMenu(false)} />
                <div className="absolute right-0 top-10 bg-wechat-bar dark:bg-wechat-dark rounded-lg shadow-xl py-2 min-w-32 z-50">
                  {activeTab === 'chat' && (
                    <button
                      onClick={() => { setShowPlusMenu(false); setShowGroups(true) }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-wechat-bg dark:hover:bg-gray-800 transition dark:text-wechat-darkText"
                    >
                      群聊
                    </button>
                  )}
                  <button
                    onClick={() => { setShowPlusMenu(false); setShowScanner(true) }}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-wechat-bg dark:hover:bg-gray-800 transition flex items-center gap-2 dark:text-wechat-darkText"
                  >
                    <Scan size={16} /> 扫一扫
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </header>

      <main className="flex-1 overflow-y-auto bg-wechat-bg pb-16">
        {renderContent()}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-wechat-bar border-t border-wechat-border px-2 py-2 flex justify-around z-20">
        {TABS.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors ${isActive ? 'text-wechat-green' : 'text-wechat-gray'}`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-xs mt-0.5">{tab.label}</span>
            </button>
          )
        })}
      </nav>

      {/* 群聊弹窗 */}
      {showGroups && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white dark:bg-wechat-dark w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl max-h-[80vh] overflow-y-auto p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium dark:text-white">群聊</h3>
              <button onClick={() => setShowGroups(false)} className="text-wechat-gray"><X size={20} /></button>
            </div>
            <GroupList onSelect={() => setShowGroups(false)} />
          </div>
        </div>
      )}

      {/* 二维码弹窗 */}
      {showQR && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white w-full sm:max-w-sm p-6 rounded-2xl text-center">
            <QRCode />
            <button onClick={() => setShowQR(false)} className="mt-4 w-full py-2 bg-wechat-green text-white rounded-lg">关闭</button>
          </div>
        </div>
      )}

      {/* 扫一扫 */}
      {showScanner && (
        <QRScanner onClose={() => setShowScanner(false)} />
      )}
    </div>
  )
}

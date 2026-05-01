import { useState, useEffect } from 'react'
import { MessageSquare, Users, Compass, User } from 'lucide-react'
import ChatList from '../components/ChatList'
import Contacts from '../components/Contacts'
import Discover from '../components/Discover'
import Profile from '../components/Profile'
import GroupList from '../components/GroupList'
import QRCode from '../components/QRCode'
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
  const fetchFriends = useStore(s => s.fetchFriends)

  useEffect(() => {
    fetchFriends()
  }, [fetchFriends])

  const renderContent = () => {
    switch (activeTab) {
      case 'chat': return <ChatList />
      case 'contacts': return <Contacts />
      case 'discover': return <Discover onGroupClick={() => setShowGroups(true)} />
      case 'profile': return <Profile onQRClick={() => setShowQR(true)} />
      default: return <ChatList />
    }
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white shadow-xl overflow-hidden relative">
      <header className="px-4 py-3 bg-wechat-bar border-b border-wechat-border sticky top-0 z-10 flex justify-between items-center">
        <h1 className="text-lg font-semibold text-center flex-1">
          {TABS.find(t => t.id === activeTab)?.label}
        </h1>
        {activeTab === 'chat' && (
          <button className="text-wechat-dark font-bold" onClick={() => setShowGroups(true)}>+</button>
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

      {/* 6. 群聊弹窗 */}
      {showGroups && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl max-h-[80vh] overflow-y-auto p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">群聊</h3>
              <button onClick={() => setShowGroups(false)} className="text-wechat-gray">X</button>
            </div>
            <GroupList onSelect={() => setShowGroups(false)} />
          </div>
        </div>
      )}

      {/* 14. 二维码弹窗 */}
      {showQR && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white w-full sm:max-w-sm p-6 rounded-2xl text-center">
            <QRCode />
            <button onClick={() => setShowQR(false)} className="mt-4 w-full py-2 bg-wechat-green text-white rounded-lg">关闭</button>
          </div>
        </div>
      )}
    </div>
  )
}

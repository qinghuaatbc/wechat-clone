import { useStore } from '../store'
import { useState, useEffect } from 'react'
import { Search, UserPlus, Bell, Check, X, Clock, UserCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Contacts() {
  const friends = useStore(s => s.friends)
  const searchUser = useStore(s => s.searchUser)
  const addFriend = useStore(s => s.addFriend)
  const fetchFriends = useStore(s => s.fetchFriends)
  const incomingRequests = useStore(s => s.incomingRequests)
  const pendingRequestCount = useStore(s => s.pendingRequestCount)
  const acceptRequest = useStore(s => s.acceptRequest)
  const rejectRequest = useStore(s => s.rejectRequest)
  const fetchFriendRequests = useStore(s => s.fetchFriendRequests)
  const recommendUsers = useStore(s => s.recommendUsers)
  const fetchRecommend = useStore(s => s.fetchRecommend)
  const currentUser = useStore(s => s.user)

  const [keyword, setKeyword] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showRequests, setShowRequests] = useState(false)
  const [showAddModal, setShowAddModal] = useState(null)
  const [addMessage, setAddMessage] = useState('')

  useEffect(() => {
    fetchFriendRequests()
    fetchRecommend()
  }, [])

  const handleSearch = async () => {
    if (!keyword.trim()) return
    const results = await searchUser(keyword)
    setSearchResults(results)
  }

  const handleAddClick = (user) => {
    setShowAddModal(user)
    setAddMessage('你好，我想加你为好友')
  }

  const handleSendRequest = async () => {
    await addFriend(showAddModal.id, addMessage)
    setShowAddModal(null)
    fetchFriendRequests()
    fetchRecommend()
  }

  const groupedFriends = friends.reduce((acc, f) => {
    const letter = f.nickname?.[0]?.toUpperCase() || '#'
    if (!acc[letter]) acc[letter] = []
    acc[letter].push(f)
    return acc
  }, {})

  const sortedLetters = Object.keys(groupedFriends).sort()

  return (
    <div className="pb-16">
      <div className="sticky top-0 bg-wechat-bg px-4 py-2 z-10">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-wechat-gray" size={18} />
            <input
              type="text"
              placeholder="搜索微信号/昵称/手机号"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 bg-white rounded-lg border-none focus:outline-none focus:ring-2 focus:ring-wechat-green/50"
            />
          </div>
          <button 
            onClick={handleSearch}
            className="px-4 py-2 bg-wechat-green text-white rounded-lg font-medium active:scale-95 transition"
          >
            搜索
          </button>
        </div>

        {pendingRequestCount > 0 && (
          <button 
            onClick={() => setShowRequests(!showRequests)}
            className="mt-2 w-full flex items-center justify-between p-3 bg-white rounded-lg active:bg-wechat-bg transition"
          >
            <div className="flex items-center gap-2">
              <div className="relative">
                <Bell size={18} className="text-wechat-green" />
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] rounded-full min-w-4 h-4 flex items-center justify-center">
                  {pendingRequestCount}
                </span>
              </div>
              <span className="text-sm font-medium">新的朋友</span>
            </div>
            <span className="text-xs text-wechat-gray">点击查看</span>
          </button>
        )}
      </div>

      <AnimatePresence>
        {showRequests && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-white mt-2"
          >
            {incomingRequests.map(req => (
              <div key={req.id} className="flex items-center p-3 border-b border-wechat-border">
                <div className="w-10 h-10 rounded-lg bg-wechat-green/20 flex items-center justify-center text-wechat-green font-bold flex-shrink-0">
                  {req.from_avatar ? <img src={req.from_avatar} className="w-full h-full rounded-lg object-cover" /> : (req.from_name?.[0] || '?')}
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{req.from_name}</p>
                  <p className="text-xs text-wechat-gray truncate">{req.message}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => acceptRequest(req.id)} className="p-1.5 bg-wechat-green text-white rounded-full hover:opacity-90">
                    <Check size={14} />
                  </button>
                  <button onClick={() => rejectRequest(req.id)} className="p-1.5 bg-wechat-gray text-white rounded-full hover:opacity-90">
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
            {incomingRequests.length === 0 && <p className="p-4 text-center text-sm text-wechat-gray">暂无新的好友请求</p>}
          </motion.div>
        )}
      </AnimatePresence>

      {searchResults.length > 0 && (
        <div className="bg-white mt-2 divide-y divide-wechat-border">
          {searchResults.map(u => (
            <div key={u.id} className="flex items-center p-4 justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-wechat-green/20 flex items-center justify-center text-wechat-green font-bold flex-shrink-0 overflow-hidden">
                  {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : (u.nickname?.[0] || '?')}
                </div>
                <div>
                  <p className="font-medium">{u.nickname}</p>
                  <p className="text-sm text-wechat-gray">微信号: {u.wxid}</p>
                </div>
              </div>
              {u.is_friend ? (
                <span className="px-3 py-1 bg-wechat-bg text-wechat-gray rounded-full text-xs flex items-center gap-1">
                  <UserCheck size={12} /> 已是好友
                </span>
              ) : u.request_status === 1 ? (
                <span className="px-3 py-1 bg-blue-50 text-blue-500 rounded-full text-xs flex items-center gap-1">
                  <Clock size={12} /> 等待对方确认
                </span>
              ) : (
                <button
                  onClick={() => handleAddClick(u)}
                  className="px-4 py-1.5 bg-wechat-green text-white rounded-full text-sm hover:opacity-90 flex items-center gap-1"
                >
                  <UserPlus size={14} /> 添加
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {keyword && searchResults.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-wechat-gray">
          <p className="text-lg">未找到用户</p>
          <p className="text-sm">请检查微信号、昵称或手机号是否正确</p>
        </div>
      )}

      {recommendUsers.length > 0 && !keyword && (
        <div className="mt-2">
          <div className="px-4 py-2 text-sm text-wechat-gray bg-wechat-bg">
            可能认识的人
          </div>
          <div className="bg-white divide-y divide-wechat-border">
            {recommendUsers.map(u => (
              <div key={u.id} className="flex items-center p-4 justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-wechat-green/20 flex items-center justify-center text-wechat-green font-bold flex-shrink-0 overflow-hidden">
                    {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : (u.nickname?.[0] || '?')}
                  </div>
                  <div>
                    <p className="font-medium">{u.nickname}</p>
                    <p className="text-sm text-wechat-gray">微信号: {u.wxid}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleAddClick(u)}
                  className="px-4 py-1.5 bg-wechat-green text-white rounded-full text-sm hover:opacity-90 flex items-center gap-1"
                >
                  <UserPlus size={14} /> 添加
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-2">
        <div className="px-4 py-2 text-sm text-wechat-gray bg-wechat-bg">
          我的好友
        </div>
        {sortedLetters.map(letter => (
          <div key={letter}>
            <div className="px-4 py-2 text-sm text-wechat-gray bg-wechat-bg sticky top-[73px] z-10">
              {letter}
            </div>
            <div className="bg-white divide-y divide-wechat-border">
              {groupedFriends[letter].map(f => (
                <div key={f.id} className="flex items-center p-4 active:bg-wechat-bg transition">
                  <div className="w-10 h-10 rounded-lg bg-wechat-green/20 flex items-center justify-center text-wechat-green font-bold flex-shrink-0 overflow-hidden">
                    {f.avatar ? <img src={f.avatar} className="w-full h-full object-cover" /> : (f.nickname?.[0] || '?')}
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-wechat-dark">{f.nickname}</p>
                    {f.online && <span className="text-xs text-wechat-green">在线</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {friends.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-wechat-gray">
            <p className="text-lg mb-2">暂无好友</p>
            <p className="text-sm">搜索上方添加好友</p>
          </div>
        )}
      </div>

      {/* Add Friend Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
            onClick={() => setShowAddModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-sm p-6"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-4">添加好友</h3>
              <div className="flex items-center gap-3 mb-4 p-3 bg-wechat-bg rounded-lg">
                <div className="w-10 h-10 rounded-lg bg-wechat-green/20 flex items-center justify-center text-wechat-green font-bold">
                  {showAddModal.avatar ? <img src={showAddModal.avatar} className="w-full h-full rounded-lg object-cover" /> : (showAddModal.nickname?.[0] || '?')}
                </div>
                <div>
                  <p className="font-medium">{showAddModal.nickname}</p>
                  <p className="text-sm text-wechat-gray">{showAddModal.wxid}</p>
                </div>
              </div>

              <label className="text-sm text-wechat-gray mb-1 block">验证消息</label>
              <textarea
                value={addMessage}
                onChange={e => setAddMessage(e.target.value)}
                className="w-full p-3 bg-wechat-bg rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wechat-green/50 resize-none"
                rows={3}
                maxLength={50}
              />
              <p className="text-xs text-wechat-gray mt-1">{addMessage.length}/50</p>

              <div className="flex gap-2 mt-4">
                <button onClick={() => setShowAddModal(null)} className="flex-1 py-2.5 bg-wechat-bg rounded-lg font-medium text-wechat-dark active:scale-95 transition">
                  取消
                </button>
                <button onClick={handleSendRequest} className="flex-1 py-2.5 bg-wechat-green text-white rounded-lg font-medium active:scale-95 transition">
                  发送
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

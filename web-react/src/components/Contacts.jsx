import { useStore } from '../store'
import { useState, useEffect } from 'react'
import { Search, UserPlus, Bell, Check, X, Clock, UserCheck, MessageSquare, Users, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

export default function Contacts() {
  const friends = useStore(s => s.friends)
  const groups = useStore(s => s.groups)
  const allUsers = useStore(s => s.allUsers || [])
  const searchUser = useStore(s => s.searchUser)
  const addFriend = useStore(s => s.addFriend)
  const fetchFriends = useStore(s => s.fetchFriends)
  const fetchGroups = useStore(s => s.fetchGroups)
  const fetchAllUsers = useStore(s => s.fetchAllUsers)
  const incomingRequests = useStore(s => s.incomingRequests)
  const pendingRequestCount = useStore(s => s.pendingRequestCount)
  const acceptRequest = useStore(s => s.acceptRequest)
  const rejectRequest = useStore(s => s.rejectRequest)
  const fetchFriendRequests = useStore(s => s.fetchFriendRequests)
  const recommendUsers = useStore(s => s.recommendUsers)
  const fetchRecommend = useStore(s => s.fetchRecommend)
  const createGroup = useStore(s => s.createGroup)
  const currentUser = useStore(s => s.user)

  const [activeTab, setActiveTab] = useState('friends')
  const [keyword, setKeyword] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showRequests, setShowRequests] = useState(false)
  const [showAddModal, setShowAddModal] = useState(null)
  const [addMessage, setAddMessage] = useState('')
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [selectedMembers, setSelectedMembers] = useState([])
  const [showGroupMembers, setShowGroupMembers] = useState(null)
  const [groupMemberList, setGroupMemberList] = useState([])

  useEffect(() => {
    fetchFriends()
    fetchGroups()
    fetchAllUsers()
    fetchFriendRequests()
    fetchRecommend()
  }, [])

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error('请输入群名称')
      return
    }
    await createGroup(groupName.trim(), selectedMembers)
    setShowCreateGroup(false)
    setGroupName('')
    setSelectedMembers([])
    toast.success('群聊已创建')
  }

  const toggleMember = (userId) => {
    setSelectedMembers(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    )
  }

  const handleGroupClick = async (g) => {
    try {
      const res = await fetch(`/api/groups/${g.id}/members`, {
        headers: { Authorization: `Bearer ${useStore.getState().token}` }
      })
      const data = await res.json()
      setGroupMemberList(data.members || [])
      setShowGroupMembers(g)
    } catch (e) { toast.error('加载失败') }
  }

  const handleSearch = () => {
    if (!keyword.trim()) { setSearchResults([]); return }
    const kw = keyword.toLowerCase()
    if (activeTab === 'friends') {
      setSearchResults(friends.filter(f => f.nickname?.toLowerCase().includes(kw) || f.wxid?.toLowerCase().includes(kw)))
    } else if (activeTab === 'groups') {
      setSearchResults(groups.filter(g => g.name?.toLowerCase().includes(kw)))
    } else {
      searchUser(kw).then(setSearchResults)
    }
  }

  useEffect(() => {
    const timer = setTimeout(handleSearch, 200)
    return () => clearTimeout(timer)
  }, [keyword, activeTab])

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
              placeholder={activeTab === 'friends' ? "搜索好友" : "搜索群聊"}
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

        {activeTab === 'friends' && pendingRequestCount > 0 && (
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

      {/* Tab切换 */}
      <div className="flex bg-white border-b border-wechat-border">
        <button
          onClick={() => setActiveTab('friends')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'friends' ? 'text-wechat-green border-b-2 border-wechat-green' : 'text-wechat-gray'}`}
        >
          <Users size={16} className="inline mr-1" />好友
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'groups' ? 'text-wechat-green border-b-2 border-wechat-green' : 'text-wechat-gray'}`}
        >
          <MessageSquare size={16} className="inline mr-1" />群聊
        </button>
        <button
          onClick={() => setActiveTab('all-users')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'all-users' ? 'text-wechat-green border-b-2 border-wechat-green' : 'text-wechat-gray'}`}
        >
          <UserPlus size={16} className="inline mr-1" />所有用户
        </button>
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
                  {(()=>{const a=req.from_avatar;if(a&&(a.endsWith(".glb")||a.endsWith(".gltf")))return <model-viewer src={a} camera-controls auto-rotate rotation-per-second="120" interaction-prompt="none" style={{width:"100%",height:"100%"}}></model-viewer>;return a?<img src={a} className="w-full h-full rounded-lg object-cover"/>:(req.from_name?.[0]||"?")})()}
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
                {activeTab === 'groups' ? (
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {(u.name || '群')[0]}
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-wechat-green/20 flex items-center justify-center text-wechat-green font-bold flex-shrink-0 overflow-hidden">
                    {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : ((u.nickname || u.name)?.[0] || '?')}
                  </div>
                )}
                <div>
                  <p className="font-medium">{u.nickname || u.name}</p>
                  <p className="text-sm text-wechat-gray">{activeTab === 'groups' ? '' : '微信号: ' + u.wxid}</p>
                </div>
              </div>
              {activeTab !== 'groups' && (u.is_friend ? (
                <span className="px-3 py-1 bg-wechat-bg text-wechat-gray rounded-full text-xs flex items-center gap-1">
                  <UserCheck size={12} /> 已是好友
                </span>
              ) : u.request_status === 1 ? (
                <span className="px-3 py-1 bg-blue-50 text-blue-500 rounded-full text-xs flex items-center gap-1">
                  <Clock size={12} /> 等待对方确认
                </span>
              ) : (
                <button onClick={() => handleAddClick(u)} className="px-4 py-1.5 bg-wechat-green text-white rounded-full text-sm hover:opacity-90 flex items-center gap-1">
                  <UserPlus size={14} /> 添加
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {keyword && searchResults.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-wechat-gray">
          <p className="text-lg">未找到{activeTab === 'friends' ? '好友' : activeTab === 'groups' ? '群聊' : '用户'}</p>
          <p className="text-sm">{activeTab === 'all-users' ? '请检查微信号或昵称是否正确' : '请检查名称是否正确'}</p>
        </div>
      )}

      {recommendUsers.length > 0 && !keyword && activeTab === 'friends' && (
        <div className="mt-2">
          <div className="px-4 py-2 text-sm text-wechat-gray bg-wechat-bg">
            可能认识的人
          </div>
          <div className="bg-white divide-y divide-wechat-border">
            {recommendUsers.map(u => (
              <div key={u.id} className="flex items-center p-4 justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-wechat-green/20 flex items-center justify-center text-wechat-green font-bold flex-shrink-0 overflow-hidden">
                    {(()=>{const a=u.avatar;if(a&&(a.endsWith(".glb")||a.endsWith(".gltf")))return <model-viewer src={a} camera-controls auto-rotate rotation-per-second="120" interaction-prompt="none" style={{width:"100%",height:"100%"}}></model-viewer>;return a?<img src={a} className="w-full h-full object-cover"/>:(u.nickname?.[0]||"?")})()}
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

      {/* 好友列表 */}
      {activeTab === 'friends' && !keyword && (
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
                      {(()=>{const a=f.avatar;if(a&&(a.endsWith(".glb")||a.endsWith(".gltf")))return <model-viewer src={a} camera-controls auto-rotate rotation-per-second="120" interaction-prompt="none" style={{width:"100%",height:"100%"}}></model-viewer>;return a?<img src={a} className="w-full h-full object-cover"/>:(f.nickname?.[0]||"?")})()}
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
      )}

      {/* 群聊列表 */}
      {activeTab === 'groups' && !keyword && (
        <div className="mt-2">
          <div className="px-4 py-2 text-sm text-wechat-gray bg-wechat-bg flex justify-between items-center">
            <span>我的群聊</span>
            <button onClick={() => setShowCreateGroup(true)} className="text-wechat-green text-xs font-medium">
              + 新建群聊
            </button>
          </div>
          {groups.length > 0 ? (
            groups.map(g => (
              <div key={g.id} onClick={() => handleGroupClick(g)} className="flex items-center p-4 bg-white border-b border-wechat-border active:bg-wechat-bg transition cursor-pointer">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {(g.name || '群')[0]}
                </div>
                <div className="ml-3 flex-1">
                  <p className="font-medium text-wechat-dark">{g.name}</p>
                  <p className="text-xs text-wechat-gray">
                    {g.owner_id === currentUser?.id ? '群主' : '成员'}
                  </p>
                </div>
                <ChevronRight size={18} className="text-gray-300" />
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-wechat-gray">
              <p className="text-lg mb-2">暂无群聊</p>
              <p className="text-sm">点击上方+新建群聊</p>
            </div>
          )}
        </div>
      )}

      {/* 所有用户列表 */}
      {activeTab === 'all-users' && !keyword && (
        <div className="mt-2">
          <div className="px-4 py-2 text-sm text-wechat-gray bg-wechat-bg">
            所有用户 ({allUsers.length})
          </div>
          {allUsers.map(u => (
            <div key={u.id} className="flex items-center p-4 bg-white border-b border-wechat-border">
              <div className="w-10 h-10 rounded-lg bg-wechat-green/20 flex items-center justify-center text-wechat-green font-bold flex-shrink-0 overflow-hidden">
                {(()=>{const a=u.avatar;if(a&&(a.endsWith(".glb")||a.endsWith(".gltf")))return <model-viewer src={a} camera-controls auto-rotate rotation-per-second="120" interaction-prompt="none" style={{width:"100%",height:"100%"}}></model-viewer>;return a?<img src={a} className="w-full h-full object-cover"/>:(u.nickname?.[0]||"?")})()}
              </div>
              <div className="ml-3 flex-1">
                <p className="font-medium text-wechat-dark">{u.nickname}</p>
                <p className="text-xs text-wechat-gray">微信号: {u.wxid}</p>
              </div>
              {u.is_friend ? (
                <span className="px-3 py-1 bg-wechat-bg text-wechat-gray rounded-full text-xs">
                  已是好友
                </span>
              ) : (
                <button
                  onClick={() => handleAddClick(u)}
                  className="px-4 py-1.5 bg-wechat-green text-white rounded-full text-sm hover:opacity-90"
                >
                  加好友
                </button>
              )}
            </div>
          ))}
        </div>
      )}

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
                  {(()=>{const a=showAddModal.avatar;if(a&&(a.endsWith(".glb")||a.endsWith(".gltf")))return <model-viewer src={a} camera-controls auto-rotate rotation-per-second="120" interaction-prompt="none" style={{width:"100%",height:"100%"}}></model-viewer>;return a?<img src={a} className="w-full h-full rounded-lg object-cover"/>:(showAddModal.nickname?.[0]||"?")})()}
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

      {/* Create Group Modal */}
      <AnimatePresence>
        {showCreateGroup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
            onClick={() => setShowCreateGroup(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-sm p-6 max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-4">新建群聊</h3>
              
              <label className="text-sm text-wechat-gray mb-1 block">群名称</label>
              <input
                type="text"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                placeholder="请输入群名称"
                className="w-full p-3 bg-wechat-bg rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wechat-green/50 mb-4"
              />

              <p className="text-sm text-wechat-gray mb-2">选择好友（{selectedMembers.length}人）</p>
              <div className="space-y-2 mb-4">
                {friends.filter(f => f.id !== currentUser?.id).map(u => (
                  <div 
                    key={u.id} 
                    onClick={() => toggleMember(u.id)}
                    className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${selectedMembers.includes(u.id) ? 'bg-wechat-green/10' : 'bg-wechat-bg'}`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-wechat-green/20 flex items-center justify-center text-wechat-green font-bold text-sm mr-3">
                      {u.avatar ? <img src={u.avatar} className="w-full h-full rounded-lg object-cover" /> : (u.nickname?.[0] || '?')}
                    </div>
                    <span className="flex-1 text-sm">{u.nickname}</span>
                    {selectedMembers.includes(u.id) && (
                      <div className="w-5 h-5 rounded-full bg-wechat-green flex items-center justify-center">
                        <Check size={12} className="text-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button onClick={() => { setShowCreateGroup(false); setSelectedMembers([]); setGroupName('') }} className="flex-1 py-2.5 bg-wechat-bg rounded-lg font-medium text-wechat-dark active:scale-95 transition">
                  取消
                </button>
                <button onClick={handleCreateGroup} className="flex-1 py-2.5 bg-wechat-green text-white rounded-lg font-medium active:scale-95 transition">
                  创建（{selectedMembers.length}人）
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Group Members Modal */}
      <AnimatePresence>
        {showGroupMembers && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowGroupMembers(null)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl max-h-[70vh] overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-bold">{showGroupMembers.name} ({groupMemberList.length}人)</h3>
                <div className="flex items-center gap-2">
                  {showGroupMembers.owner_id === currentUser?.id && (
                    <button onClick={async (e) => { e.stopPropagation(); if(confirm('确定删除群聊?')) { await fetch('/api/groups/'+showGroupMembers.id, {method:'DELETE',headers:{Authorization:'Bearer '+useStore.getState().token}}); setShowGroupMembers(null); fetchGroups(); toast.success('群聊已删除') } }} className="text-red-400 text-xs px-2 py-1 rounded hover:bg-red-50">删除群聊</button>
                  )}
                  <button onClick={() => setShowGroupMembers(null)} className="text-gray-400"><X size={20} /></button>
                </div>
              </div>
              <div className="overflow-y-auto max-h-[55vh] p-4">
                {groupMemberList.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">暂无成员</p>
                ) : (
                  <div className="grid grid-cols-4 gap-4">
                    {groupMemberList.map(m => (
                      <div key={m.id} className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-lg bg-wechat-green/20 flex items-center justify-center text-wechat-green font-bold">
                          {m.nickname?.[0] || '?'}
                        </div>
                        <span className="text-xs mt-1 truncate w-full text-center">{m.nickname || '未知'}</span>
                        {m.role === 1 && <span className="text-[10px] text-wechat-green">群主</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

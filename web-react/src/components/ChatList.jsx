import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store'
import { PullToRefresh } from './PullToRefresh'
import FileHelperEntry from './FileHelperEntry'
import { MessageSquare } from 'lucide-react'
import { useTranslation } from '../hooks/useTranslation'

const msgPreview = (msg) => {
  if (!msg) return ''
  if (msg.is_recalled) return '已撤回'
  switch (msg.type) {
    case 3: return '[图片]'
    case 4: return '[视频]'
    case 5: return '[文件] ' + (msg.file_name || '')
    case 6: return '[3D模型]'
    case 7: return '[语音]'
    default: return msg.content || ''
  }
}

const msgTime = (msg) => {
  if (!msg?.created_at) return ''
  const d = new Date(msg.created_at)
  if (isNaN(d)) return ''
  const now = new Date()
  const diff = now - d
  if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diff < 172800000) return '昨天'
  if (diff < 604800000) return ['周日','周一','周二','周三','周四','周五','周六'][d.getDay()]
  return d.toLocaleDateString()
}

const Skeleton = () => (
  <div className="flex items-center p-4 animate-pulse">
    <div className="w-12 h-12 bg-wechat-border rounded-lg" />
    <div className="ml-3 flex-1 space-y-2">
      <div className="h-4 bg-wechat-border rounded w-1/3" />
      <div className="h-3 bg-wechat-border rounded w-2/3" />
    </div>
  </div>
)

export default function ChatList() {
  const { t } = useTranslation()
  const user = useStore(s => s.user)
  const friends = useStore(s => s.friends)
  const groups = useStore(s => s.groups)
  const messages = useStore(s => s.messages)
  const unread = useStore(s => s.unread)
  const fetchFriends = useStore(s => s.fetchFriends)
  const fetchGroups = useStore(s => s.fetchGroups)
  const loading = useStore(s => s.loading)

  useEffect(() => { fetchGroups() }, [])

  const items = useMemo(() => {
    const convs = []
    groups.forEach(g => {
      const msgs = messages[g.id] || []
      const last = msgs.length > 0 ? msgs[msgs.length - 1] : null
      convs.push({ ...g, isGroup: true, lastMsg: last, convId: g.id })
    })
    friends.forEach(f => {
      const msgs = messages[f.id] || []
      const last = msgs.length > 0 ? msgs[msgs.length - 1] : null
      convs.push({ ...f, isGroup: false, lastMsg: last, convId: f.id })
    })
    convs.sort((a, b) => {
      const ta = a.lastMsg?.created_at || ''
      const tb = b.lastMsg?.created_at || ''
      return tb.localeCompare(ta)
    })
    return convs
  }, [groups, friends, messages])

  return (
    <PullToRefresh onRefresh={fetchFriends}>
      <FileHelperEntry />
      <div className="divide-y divide-wechat-border">
        {loading && items.length === 0 ? (
          <>
            <Skeleton />
            <Skeleton />
            <Skeleton />
          </>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-wechat-gray animate-fade-in">
            <p className="text-lg mb-2">{t('noChats')}</p>
            <p className="text-sm">{t('addFriendStart')}</p>
          </div>
        ) : (
          items.map(item => {
            const linkTo = item.isGroup ? `/chat/group/${item.id}` : `/chat/${item.id}`
            return (
              <Link key={(item.isGroup ? 'g' : '') + item.id} to={linkTo} className="flex items-center p-4 bg-white active:bg-wechat-bg transition-colors relative">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold flex-shrink-0 overflow-hidden ${item.isGroup ? 'bg-gray-500 text-white' : 'bg-wechat-green/20 text-wechat-green'}`}>
                  {item.isGroup ? (
                    <MessageSquare size={22} />
                  ) : item.avatar ? (
                    item.avatar.endsWith('.glb') || item.avatar.endsWith('.gltf') ? (
                      <model-viewer src={item.avatar} camera-controls auto-rotate rotation-per-second="120" interaction-prompt="none" style={{ width: '100%', height: '100%' }}></model-viewer>
                    ) : (
                      <img src={item.avatar} className="w-full h-full object-cover" />
                    )
                  ) : (item.nickname?.[0] || '?')}
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-wechat-dark truncate">{item.nickname || item.name || '?'}</h3>
                    <span className="text-xs text-wechat-gray flex-shrink-0 ml-2">{msgTime(item.lastMsg)}</span>
                  </div>
                  <p className="text-sm text-wechat-gray mt-0.5 truncate">{msgPreview(item.lastMsg) || (item.isGroup ? '群聊' : (item.remark || t('startChat')))}</p>
                </div>
                {unread[item.convId] > 0 && (
                  <span className="absolute top-3 left-12 bg-red-500 text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center border-2 border-white">
                    {unread[item.convId] > 99 ? '99+' : unread[item.convId]}
                  </span>
                )}
              </Link>
            )
          })
        )}
      </div>
    </PullToRefresh>
  )
}

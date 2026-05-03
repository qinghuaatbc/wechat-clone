import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store'
import { PullToRefresh } from './PullToRefresh'
import FileHelperEntry from './FileHelperEntry'
import { MessageSquare } from 'lucide-react'
import { useTranslation } from '../hooks/useTranslation'

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
  const friends = useStore(s => s.friends)
  const groups = useStore(s => s.groups)
  const unread = useStore(s => s.unread)
  const fetchFriends = useStore(s => s.fetchFriends)
  const fetchGroups = useStore(s => s.fetchGroups)
  const loading = useStore(s => s.loading)

  useEffect(() => { fetchGroups() }, [])

  const items = [
    ...groups.map(g => ({ ...g, isGroup: true })),
    ...friends.map(f => ({ ...f, isGroup: false })),
  ]

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
          items.map(item => item.isGroup ? (
            <Link key={'g' + item.id} to={`/chat/group/${item.id}`} className="flex items-center p-4 bg-white active:bg-wechat-bg transition-colors relative">
              <div className="w-12 h-12 rounded-xl bg-gray-500 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                <MessageSquare size={22} />
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-wechat-dark truncate">{item.name || '群聊'}</h3>
                  <span className="text-xs text-wechat-gray">
                    {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                <p className="text-sm text-wechat-gray mt-0.5 truncate">群聊</p>
              </div>
              {unread[item.id] > 0 && (
                <span className="absolute top-3 left-12 bg-red-500 text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center border-2 border-white">
                  {unread[item.id] > 99 ? '99+' : unread[item.id]}
                </span>
              )}
            </Link>
          ) : (
            <Link key={item.id} to={`/chat/${item.id}`} className="flex items-center p-4 bg-white active:bg-wechat-bg transition-colors relative">
              <div className="w-12 h-12 rounded-xl bg-wechat-green/20 flex items-center justify-center text-wechat-green text-xl font-bold flex-shrink-0">
                {item.nickname?.[0] || '?'}
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-wechat-dark truncate">{item.nickname}</h3>
                  <span className="text-xs text-wechat-gray">
                    {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                <p className="text-sm text-wechat-gray mt-0.5 truncate">
                  {item.remark || t('startChat')}
                </p>
              </div>
              {unread[item.id] > 0 && (
                <span className="absolute top-3 left-12 bg-red-500 text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center border-2 border-white">
                  {unread[item.id] > 99 ? '99+' : unread[item.id]}
                </span>
              )}
            </Link>
          ))
        )}
      </div>
    </PullToRefresh>
  )
}

import { Link } from 'react-router-dom'
import { useStore } from '../store'
import { PullToRefresh } from './PullToRefresh'
import FileHelperEntry from './FileHelperEntry'

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
  const friends = useStore(s => s.friends)
  const unread = useStore(s => s.unread)
  const fetchFriends = useStore(s => s.fetchFriends)
  const loading = useStore(s => s.loading)

  return (
    <PullToRefresh onRefresh={fetchFriends}>
      <FileHelperEntry />
      <div className="divide-y divide-wechat-border">
        {loading && friends.length === 0 ? (
          <>
            <Skeleton />
            <Skeleton />
            <Skeleton />
          </>
        ) : friends.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-wechat-gray animate-fade-in">
            <p className="text-lg mb-2">暂无聊天</p>
            <p className="text-sm">添加好友开始聊天吧</p>
          </div>
        ) : (
          friends.map(f => (
            <Link key={f.id} to={`/chat/${f.id}`} className="flex items-center p-4 bg-white active:bg-wechat-bg transition-colors relative">
              <div className="w-12 h-12 rounded-xl bg-wechat-green/20 flex items-center justify-center text-wechat-green text-xl font-bold flex-shrink-0">
                {f.nickname?.[0] || '?'}
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-wechat-dark truncate">{f.nickname}</h3>
                  <span className="text-xs text-wechat-gray">
                    {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                <p className="text-sm text-wechat-gray mt-0.5 truncate">
                  {f.remark || '点击开始聊天'}
                </p>
              </div>
              
              {unread[f.id] > 0 && (
                <span className="absolute top-3 left-12 bg-red-500 text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center border-2 border-white">
                  {unread[f.id] > 99 ? '99+' : unread[f.id]}
                </span>
              )}
            </Link>
          ))
        )}
      </div>
    </PullToRefresh>
  )
}

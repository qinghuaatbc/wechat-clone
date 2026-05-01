import { useState } from 'react'
import { Heart, MessageCircle, Image, Camera, Users } from 'lucide-react'
import { useStore } from '../store'

export default function Discover({ onGroupClick }) {
  const moments = useStore(s => s.moments)
  const fetchMoments = useStore(s => s.fetchMoments)
  const postMoment = useStore(s => s.postMoment)
  const user = useStore(s => s.user)
  const comments = useStore(s => s.comments)
  const fetchComments = useStore(s => s.fetchComments)

  const [showPost, setShowPost] = useState(false)
  const [content, setContent] = useState('')

  const handleLike = async (id) => {
    // Logic to toggle like
    await fetch(`/api/moments/${id}/like`, { method: 'POST', headers: { Authorization: `Bearer ${useStore.getState().token}` } })
    fetchMoments()
  }

  const handlePost = async () => {
    if (!content.trim()) return
    await postMoment(content)
    setContent('')
    setShowPost(false)
  }

  return (
    <div className="pb-16 bg-wechat-bg min-h-screen">
      {/* 13. 朋友圈入口 + 群聊入口 */}
      <div className="bg-white mb-2">
        <div className="flex items-center p-4 hover:bg-wechat-bg cursor-pointer" onClick={onGroupClick}>
          <Users className="text-wechat-green mr-4" size={24} />
          <span className="flex-1">群聊</span>
        </div>
        <div className="flex items-center p-4 hover:bg-wechat-bg cursor-pointer border-t border-wechat-border" onClick={() => setShowPost(true)}>
          <Camera className="text-wechat-green mr-4" size={24} />
          <span className="flex-1">朋友圈</span>
        </div>
      </div>

      {/* Cover */}
      <div className="relative h-48 bg-gradient-to-r from-wechat-green/20 to-blue-500/20 mb-10">
        <div className="absolute -bottom-10 right-4 flex items-end gap-3">
          <span className="text-white font-bold text-lg drop-shadow-md">{user?.nickname}</span>
          <div className="w-16 h-16 rounded-xl bg-wechat-green/20 border-2 border-white flex items-center justify-center text-wechat-green text-2xl font-bold">
            {user?.nickname?.[0] || '?'}
          </div>
        </div>
      </div>

      <div className="space-y-4 px-4">
        {moments.map(m => (
          <div key={m.id} className="bg-white p-4 rounded-xl shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-wechat-green/20 flex items-center justify-center text-wechat-green font-bold flex-shrink-0">
                {m.nickname?.[0] || '?'}
              </div>
              <div className="flex-1">
                <p className="font-medium text-wechat-dark mb-1">{m.nickname}</p>
                <p className="text-wechat-text mb-2 whitespace-pre-wrap">{m.content}</p>
                {m.images && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <Image className="w-24 h-24 rounded-lg bg-wechat-bg" />
                  </div>
                )}
                <div className="flex items-center justify-between text-sm text-wechat-gray mb-2">
                  <span>{new Date(m.created_at).toLocaleString()}</span>
                </div>
                
                {/* 13. 点赞与评论展示 */}
                <div className="bg-wechat-bg p-2 rounded text-sm flex justify-between items-center">
                  <div className="flex gap-4 flex-1">
                    <button onClick={() => handleLike(m.id)} className="hover:text-wechat-green transition">
                      赞 {m.likes}
                    </button>
                    <button onClick={() => fetchComments(m.id)} className="hover:text-wechat-green transition">
                      评论 {m.comments}
                    </button>
                  </div>
                </div>

                {comments[m.id]?.length > 0 && (
                  <div className="mt-2 bg-wechat-bg p-2 rounded text-sm">
                    {comments[m.id].map(c => (
                      <p key={c.id} className="mb-1"><span className="font-medium text-wechat-dark">{c.nickname}:</span> {c.content}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showPost && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl p-4">
            <h3 className="font-medium mb-3">发表动态</h3>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="分享新鲜事..."
              className="w-full p-3 bg-wechat-bg rounded-lg resize-none focus:outline-none min-h-[100px]"
              rows={3}
            />
            <div className="flex gap-3 mt-3">
              <button onClick={() => setShowPost(false)} className="flex-1 py-2 bg-wechat-bg rounded-lg">取消</button>
              <button onClick={handlePost} className="flex-1 py-2 bg-wechat-green text-white rounded-lg">发表</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

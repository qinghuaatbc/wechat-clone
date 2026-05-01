import { useState, useEffect } from 'react'
import { useStore } from '../store'
import { Heart, MessageCircle, Image } from 'lucide-react'

export default function Moments() {
  const moments = useStore(s => s.moments)
  const fetchMoments = useStore(s => s.fetchMoments)
  const postMoment = useStore(s => s.postMoment)
  const user = useStore(s => s.user)

  const [showPost, setShowPost] = useState(false)
  const [content, setContent] = useState('')

  useEffect(() => { fetchMoments() }, [fetchMoments])

  const handlePost = async () => {
    if (!content.trim()) return
    await postMoment(content)
    setContent('')
    setShowPost(false)
  }

  return (
    <div className="pb-16 bg-wechat-bg min-h-screen">
      {/* Cover */}
      <div className="relative h-48 bg-gradient-to-r from-wechat-green/20 to-blue-500/20">
        <div className="absolute -bottom-10 right-4 flex items-end gap-3">
          <span className="text-white font-bold text-lg drop-shadow-md">{user?.nickname}</span>
          <div className="w-16 h-16 rounded-xl bg-wechat-green/20 border-2 border-white flex items-center justify-center text-wechat-green text-2xl font-bold">
            {user?.nickname?.[0] || '?'}
          </div>
        </div>
      </div>

      <div className="mt-12 space-y-4">
        {moments.map(m => (
          <div key={m.id} className="bg-white p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-wechat-green/20 flex items-center justify-center text-wechat-green font-bold flex-shrink-0">
                {m.nickname?.[0] || '?'}
              </div>
              <div className="flex-1">
                <p className="font-medium text-wechat-dark mb-1">{m.nickname}</p>
                <p className="text-wechat-text mb-2">{m.content}</p>
                {m.images && (
                  <div className="flex gap-2 mb-3">
                    <Image size={80} className="rounded-lg bg-wechat-bg" />
                  </div>
                )}
                <div className="flex items-center justify-between text-sm text-wechat-gray">
                  <span>{new Date(m.created_at).toLocaleString()}</span>
                  <div className="flex gap-4">
                    <button className="flex items-center gap-1 hover:text-wechat-green transition">
                      <Heart size={16} fill={m.is_liked ? 'currentColor' : 'none'} />
                      {m.likes}
                    </button>
                    <button className="flex items-center gap-1 hover:text-wechat-green transition">
                      <MessageCircle size={16} />
                      {m.comments}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Post Button */}
      <button
        onClick={() => setShowPost(!showPost)}
        className="fixed bottom-20 right-4 w-12 h-12 bg-wechat-green text-white rounded-full shadow-lg flex items-center justify-center hover:opacity-90 transition z-30"
      >
        <Image size={24} />
      </button>

      {/* Post Modal */}
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
              <button
                onClick={() => setShowPost(false)}
                className="flex-1 py-2 bg-wechat-bg rounded-lg hover:bg-wechat-border transition"
              >
                取消
              </button>
              <button
                onClick={handlePost}
                className="flex-1 py-2 bg-wechat-green text-white rounded-lg hover:opacity-90 transition"
              >
                发表
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

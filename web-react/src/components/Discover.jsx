import { useNavigate } from 'react-router-dom'
import { Tv, HardDrive } from 'lucide-react'

export default function Discover({ onGroupClick }) {
  const navigate = useNavigate()

  return (
    <div className="pb-16 bg-wechat-bg min-h-screen">
      <div className="bg-white divide-y divide-wechat-border">
        <div className="flex items-center p-4 hover:bg-wechat-bg cursor-pointer" onClick={onGroupClick}>
          <div className="w-9 h-9 rounded-lg bg-gray-500 flex items-center justify-center text-white mr-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <span className="flex-1 text-wechat-dark">群聊</span>
        </div>
        <div className="flex items-center p-4 hover:bg-wechat-bg cursor-pointer" onClick={() => navigate('/tv')}>
          <div className="w-9 h-9 rounded-lg bg-green-500 flex items-center justify-center text-white mr-4">
            <Tv size={20} />
          </div>
          <span className="flex-1 text-wechat-dark">电视直播</span>
        </div>
        <div className="flex items-center p-4 hover:bg-wechat-bg cursor-pointer" onClick={() => navigate('/cloud')}>
          <div className="w-9 h-9 rounded-lg bg-blue-500 flex items-center justify-center text-white mr-4">
            <HardDrive size={20} />
          </div>
          <span className="flex-1 text-wechat-dark">我的网盘</span>
        </div>
      </div>
    </div>
  )
}

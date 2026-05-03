import { useNavigate } from 'react-router-dom'
import { Tv, HardDrive, BookOpen, Headphones, Camera, BrainCircuit } from 'lucide-react'

export default function Discover() {
  const navigate = useNavigate()

  return (
    <div className="pb-16 bg-wechat-bg min-h-screen">
      <div className="bg-white divide-y divide-wechat-border">
        <div className="flex items-center p-4 hover:bg-wechat-bg cursor-pointer" onClick={() => navigate('/tv')}>
          <div className="w-9 h-9 rounded-lg bg-green-500 flex items-center justify-center text-white mr-4">
            <Tv size={20} />
          </div>
          <span className="flex-1 text-wechat-dark">电视直播</span>
        </div>
        <div className="flex items-center p-4 hover:bg-wechat-bg cursor-pointer" onClick={() => navigate('/exam')}>
          <div className="w-9 h-9 rounded-lg bg-purple-500 flex items-center justify-center text-white mr-4">
            <BrainCircuit size={20} />
          </div>
          <span className="flex-1 text-wechat-dark">AI考试</span>
        </div>
        <div className="flex items-center p-4 hover:bg-wechat-bg cursor-pointer" onClick={() => navigate('/library')}>
          <div className="w-9 h-9 rounded-lg bg-orange-500 flex items-center justify-center text-white mr-4">
            <BookOpen size={20} />
          </div>
          <span className="flex-1 text-wechat-dark">图书馆</span>
        </div>
        <div className="flex items-center p-4 hover:bg-wechat-bg cursor-pointer" onClick={() => navigate('/music')}>
          <div className="w-9 h-9 rounded-lg bg-pink-500 flex items-center justify-center text-white mr-4">
            <Headphones size={20} />
          </div>
          <span className="flex-1 text-wechat-dark">音乐</span>
        </div>
        <div className="flex items-center p-4 hover:bg-wechat-bg cursor-pointer" onClick={() => navigate('/album')}>
          <div className="w-9 h-9 rounded-lg bg-indigo-500 flex items-center justify-center text-white mr-4">
            <Camera size={20} />
          </div>
          <span className="flex-1 text-wechat-dark">相册</span>
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

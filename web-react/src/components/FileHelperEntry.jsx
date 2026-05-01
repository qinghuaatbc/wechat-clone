import { Link } from 'react-router-dom'
import { FileText } from 'lucide-react'

export default function FileHelperEntry() {
  return (
    <Link
      to="/chat/file-helper"
      className="flex items-center p-4 bg-white active:bg-wechat-bg transition-colors border-b border-wechat-border"
    >
      <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500">
        <FileText size={24} />
      </div>
      <div className="ml-3 flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <h3 className="font-medium text-wechat-dark">文件传输助手</h3>
        </div>
        <p className="text-sm text-wechat-gray mt-0.5 truncate">
          用于电脑和手机之间传输文件
        </p>
      </div>
    </Link>
  )
}

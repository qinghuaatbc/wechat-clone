import { useState } from 'react'
import { Tv, HardDrive, Users, Upload, FolderPlus, File, Folder, Download, Trash2 } from 'lucide-react'
import { useStore } from '../store'

export default function Discover({ onGroupClick }) {
  const user = useStore(s => s.user)
  const token = useStore(s => s.token)
  
  const [activeTab, setActiveTab] = useState('tv')
  const [showUpload, setShowUpload] = useState(false)
  const [uploadFile, setUploadFile] = useState(null)
  const [currentPath, setCurrentPath] = useState('/')
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [folderName, setFolderName] = useState('')
  const [selectedFiles, setSelectedFiles] = useState([])

  // TV channels with HLS M3U8 support
  const tvChannels = [
    { id: 1, name: 'CCTV-1', url: 'https://example.com/tv1.m3u8', logo: '📺', category: '央视' },
    { id: 2, name: 'CCTV-新闻', url: 'https://example.com/tv2.m3u8', logo: '📰', category: '央视' },
    { id: 3, name: '湖南卫视', url: 'https://example.com/tv3.m3u8', logo: '🎬', category: '卫视' },
    { id: 4, name: '浙江卫视', url: 'https://example.com/tv4.m3u8', logo: '📺', category: '卫视' },
    { id: 5, name: '本地新闻', url: 'https://example.com/tv5.m3u8', logo: '🏠', category: '本地' },
  ]

  // Get unique categories
  const categories = [...new Set(tvChannels.map(ch => ch.category))]
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Mock cloud files
  const cloudFiles = [
    { id: 1, name: '工作文档', type: 'folder', size: '', modified: '2026-05-01' },
    { id: 2, name: '照片备份', type: 'folder', size: '', modified: '2026-05-02' },
    { id: 3, name: '报告.pdf', type: 'file', size: '2.5 MB', modified: '2026-05-03' },
    { id: 4, name: '演示文稿.pptx', type: 'file', size: '5.1 MB', modified: '2026-05-03' },
  ]

  const handleFileUpload = async () => {
    if (!uploadFile) return
    // Upload logic here
    toast.success('文件已上传到网盘')
    setUploadFile(null)
    setShowUpload(false)
  }

  const handleNewFolder = () => {
    if (!folderName.trim()) return
    // Create folder logic
    toast.success(`文件夹"${folderName}"已创建`)
    setFolderName('')
    setShowNewFolder(false)
  }

  const toggleFileSelect = (fileId) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]
    )
  }

  const handleShare = () => {
    if (selectedFiles.length === 0) {
      toast.error('请先选择文件')
      return
    }
    // Share logic - share with friends or groups
    toast.success(`已分享${selectedFiles.length}个文件`)
  }

  const handleDelete = () => {
    if (selectedFiles.length === 0) {
      toast.error('请先选择文件')
      return
    }
    // Delete logic
    toast.success(`已删除${selectedFiles.length}个文件`)
    setSelectedFiles([])
  }

  return (
    <div className="pb-16 bg-wechat-bg min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-wechat-green/20 to-blue-500/20 p-6 mb-2">
        <div className="flex items-end gap-3">
          <span className="text-wechat-dark font-bold text-lg drop-shadow-md">{user?.nickname}</span>
          <div className="w-16 h-16 rounded-xl bg-wechat-green/20 border-2 border-white flex items-center justify-center text-wechat-green text-2xl font-bold">
            {user?.nickname?.[0] || '?'}
          </div>
        </div>
      </div>

      {/* Tab切换 */}
      <div className="flex bg-white border-b border-wechat-border">
        <button
          onClick={() => setActiveTab('tv')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'tv' ? 'text-wechat-green border-b-2 border-wechat-green' : 'text-wechat-gray'}`}
        >
          <Tv size={16} className="inline mr-1" />电视
        </button>
        <button
          onClick={() => setActiveTab('cloud')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'cloud' ? 'text-wechat-green border-b-2 border-wechat-green' : 'text-wechat-gray'}`}
        >
          <HardDrive size={16} className="inline mr-1" />网盘
        </button>
      </div>

      {/* 电视功能 */}
      {activeTab === 'tv' && (
        <div className="mt-2">
          {/* 分类筛选 */}
          <div className="px-4 py-2 bg-white border-b border-wechat-border flex gap-2 overflow-x-auto">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-full text-xs ${selectedCategory === 'all' ? 'bg-wechat-green text-white' : 'bg-wechat-bg text-wechat-gray'}`}
            >
              全部
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${selectedCategory === cat ? 'bg-wechat-green text-white' : 'bg-wechat-bg text-wechat-gray'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="px-4 py-2 text-sm text-wechat-gray bg-wechat-bg">
            电视频道 ({tvChannels.filter(ch => selectedCategory === 'all' || ch.category === selectedCategory).length})
          </div>

          {tvChannels
            .filter(ch => selectedCategory === 'all' || ch.category === selectedCategory)
            .map(ch => (
            <div key={ch.id} className="flex items-center p-4 bg-white border-b border-wechat-border active:bg-wechat-bg transition cursor-pointer">
              <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center text-2xl mr-3">
                {ch.logo}
              </div>
              <div className="flex-1">
                <p className="font-medium text-wechat-dark">{ch.name}</p>
                <p className="text-xs text-wechat-gray">{ch.category} · HLS M3U8</p>
              </div>
              <button 
                className="px-3 py-1.5 bg-wechat-green text-white rounded-full text-xs"
                onClick={() => window.open(ch.url, '_blank')}
              >
                播放
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 网盘功能 */}
      {activeTab === 'cloud' && (
        <div className="mt-2">
          {/* 操作栏 */}
          <div className="px-4 py-2 bg-white border-b border-wechat-border flex gap-2 justify-between">
            <div className="flex gap-2">
              <button 
                onClick={() => setShowUpload(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-wechat-green text-white rounded-full text-xs"
              >
                <Upload size={14} /> 上传
              </button>
              <button 
                onClick={() => setShowNewFolder(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-wechat-bg rounded-full text-xs"
              >
                <FolderPlus size={14} /> 新建文件夹
              </button>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleShare}
                className={`px-3 py-1.5 rounded-full text-xs ${selectedFiles.length > 0 ? 'bg-blue-500 text-white' : 'bg-wechat-bg text-wechat-gray'}`}
                disabled={selectedFiles.length === 0}
              >
                分享
              </button>
              <button 
                onClick={handleDelete}
                className={`px-3 py-1.5 rounded-full text-xs ${selectedFiles.length > 0 ? 'bg-red-500 text-white' : 'bg-wechat-bg text-wechat-gray'}`}
                disabled={selectedFiles.length === 0}
              >
                <Trash2 size={14} className="inline" /> 删除
              </button>
            </div>
          </div>

          {/* 路径导航 */}
          <div className="px-4 py-2 text-xs text-wechat-gray bg-wechat-bg">
            当前位置: {currentPath}
          </div>

          {/* 文件列表 */}
          <div className="bg-white">
            {cloudFiles.map(f => (
              <div 
                key={f.id} 
                className={`flex items-center p-4 border-b border-wechat-border hover:bg-wechat-bg transition cursor-pointer ${selectedFiles.includes(f.id) ? 'bg-wechat-green/10' : ''}`}
                onClick={() => toggleFileSelect(f.id)}
              >
                <div className="w-10 h-10 rounded-lg bg-wechat-green/20 flex items-center justify-center mr-3">
                  {f.type === 'folder' ? (
                    <Folder size={20} className="text-wechat-green" />
                  ) : (
                    <File size={20} className="text-blue-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{f.name}</p>
                  <p className="text-xs text-wechat-gray">{f.size || '文件夹'} · {f.modified}</p>
                </div>
                {f.type === 'file' && (
                  <a 
                    href="#" 
                    className="p-1.5 rounded-full hover:bg-wechat-bg"
                    onClick={(e) => { e.stopPropagation(); /* download logic */ }}
                  >
                    <Download size={16} className="text-wechat-green" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 上传文件弹窗 */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={() => setShowUpload(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">上传文件到网盘</h3>
            <input 
              type="file" 
              onChange={(e) => setUploadFile(e.target.files?.[0])}
              className="w-full p-3 bg-wechat-bg rounded-lg mb-4"
            />
            {uploadFile && (
              <p className="text-sm text-wechat-gray mb-4">已选择: {uploadFile.name}</p>
            )}
            <div className="flex gap-2">
              <button onClick={() => { setShowUpload(false); setUploadFile(null) }} className="flex-1 py-2.5 bg-wechat-bg rounded-lg">
                取消
              </button>
              <button onClick={handleFileUpload} className="flex-1 py-2.5 bg-wechat-green text-white rounded-lg">
                上传
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 新建文件夹弹窗 */}
      {showNewFolder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={() => setShowNewFolder(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">新建文件夹</h3>
            <input 
              type="text" 
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="请输入文件夹名称"
              className="w-full p-3 bg-wechat-bg rounded-lg mb-4"
            />
            <div className="flex gap-2">
              <button onClick={() => { setShowNewFolder(false); setFolderName('') }} className="flex-1 py-2.5 bg-wechat-bg rounded-lg">
                取消
              </button>
              <button onClick={handleNewFolder} className="flex-1 py-2.5 bg-wechat-green text-white rounded-lg">
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

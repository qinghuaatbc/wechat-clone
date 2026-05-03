import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, FolderPlus, Folder, File, Download, Trash2, Share2, Globe, Lock, Users, Image, Video, Music, FileText, Archive } from 'lucide-react'
import { useStore } from '../store'
import { toast } from 'sonner'

const TYPE_ICONS = {
  image: { icon: Image, color: 'text-green-500' },
  video: { icon: Video, color: 'text-blue-500' },
  audio: { icon: Music, color: 'text-pink-500' },
  document: { icon: FileText, color: 'text-orange-500' },
  archive: { icon: Archive, color: 'text-purple-500' },
  '3d-model': { icon: File, color: 'text-cyan-500' },
  dir: { icon: Folder, color: 'text-yellow-500' },
}

const PERM_NAMES = { 0: '私密', 1: '好友', 2: '群组', 3: '公开' }
const PERM_ICONS = { 0: Lock, 1: Users, 2: Users, 3: Globe }

export default function CloudDisk() {
  const navigate = useNavigate()
  const token = useStore(s => s.token)
  const [files, setFiles] = useState([])
  const [shared, setShared] = useState([])
  const [currentDir, setCurrentDir] = useState(null)
  const [path, setPath] = useState([])
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [showShare, setShowShare] = useState(null)
  const [tab, setTab] = useState('my')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const api = async (url, opts = {}) => {
    const headers = { ...opts.headers, Authorization: `Bearer ${token}` }
    if (opts.body && typeof opts.body === 'string') headers['Content-Type'] = 'application/json'
    const res = await fetch(url, { ...opts, headers })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || `请求失败 (${res.status})`)
    return data
  }

  const loadFiles = async () => {
    try {
      const params = currentDir ? `?parent_id=${currentDir}` : ''
      const data = await api(`/api/cloud/list${params}`)
      setFiles(data.files || [])
    } catch (e) { toast.error('加载文件失败: ' + e.message) }
  }

  const loadShared = async () => {
    try {
      const data = await api('/api/cloud/shared')
      setShared(data.files || [])
    } catch (e) { toast.error('加载共享失败: ' + e.message) }
  }

  useEffect(() => { if (tab === 'my') loadFiles() }, [currentDir, tab])
  useEffect(() => { if (tab === 'shared') loadShared() }, [tab])

  const createFolder = async () => {
    if (!newFolderName.trim()) return
    try {
      const body = { name: newFolderName }
      if (currentDir) body.parent_id = currentDir
      await api('/api/cloud/mkdir', { method: 'POST', body: JSON.stringify(body) })
      setShowNewFolder(false)
      setNewFolderName('')
      toast.success('目录已创建')
      loadFiles()
    } catch (e) { toast.error('创建目录失败: ' + e.message) }
  }

  const uploadFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      if (currentDir) fd.append('parent_id', currentDir)
      await api('/api/cloud/upload', { method: 'POST', body: fd })
      toast.success('上传成功')
      loadFiles()
    } catch (e) { toast.error('上传失败: ' + e.message) }
    setUploading(false)
    e.target.value = ''
  }

  const deleteFile = async (id) => {
    if (!confirm('确定删除?')) return
    try {
      await api(`/api/cloud/${id}`, { method: 'DELETE' })
      toast.success('已删除')
      loadFiles()
    } catch (e) { toast.error('删除失败: ' + e.message) }
  }

  const shareFile = async (fileId, permission) => {
    try {
      await api('/api/cloud/share', { method: 'POST', body: JSON.stringify({ file_id: fileId, permission }) })
      setShowShare(null)
      toast.success(PERM_NAMES[permission] + '已更新')
      loadFiles()
    } catch (e) { toast.error('分享失败: ' + e.message) }
  }

  const enterDir = (dir) => {
    setCurrentDir(dir.id)
    setPath(prev => [...prev, { id: dir.id, name: dir.name }])
  }

  const getIcon = (f) => {
    if (f.is_dir) return TYPE_ICONS.dir
    return TYPE_ICONS[f.type] || { icon: File, color: 'text-gray-500' }
  }

  const formatSize = (bytes) => {
    if (!bytes) return ''
    if (bytes < 1024) return bytes + 'B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB'
    return (bytes / (1024 * 1024)).toFixed(1) + 'MB'
  }

  const handleDownload = (f) => {
    if (f.is_dir) return
    const a = document.createElement('a')
    a.href = f.path
    a.download = f.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-gray-50">
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b z-10">
        <button onClick={() => navigate(-1)} className="p-1"><ArrowLeft size={24} /></button>
        <h2 className="font-semibold">我的网盘</h2>
        <button onClick={() => fileInputRef.current?.click()} className="p-1.5 bg-wechat-green text-white rounded-lg text-sm flex items-center gap-1">
          <Upload size={16} /> 上传
        </button>
        <input ref={fileInputRef} type="file" className="hidden" onChange={uploadFile} />
      </header>

      <div className="flex bg-white border-b">
        <button onClick={() => setTab('my')} className={`flex-1 py-2.5 text-sm font-medium ${tab === 'my' ? 'text-wechat-green border-b-2 border-wechat-green' : 'text-gray-500'}`}>我的文件</button>
        <button onClick={() => setTab('shared')} className={`flex-1 py-2.5 text-sm font-medium ${tab === 'shared' ? 'text-wechat-green border-b-2 border-wechat-green' : 'text-gray-500'}`}>共享给我</button>
      </div>

      {tab === 'my' && (
        <div className="flex items-center gap-1 px-4 py-2 bg-white border-b text-sm overflow-x-auto">
          <button onClick={() => { setCurrentDir(null); setPath([]) }} className="text-wechat-green whitespace-nowrap">全部</button>
          {path.map((p, i) => (
            <span key={p.id} className="flex items-center gap-1 whitespace-nowrap">
              <span className="text-gray-300">/</span>
              <button onClick={() => { setCurrentDir(p.id); setPath(path.slice(0, i + 1)) }} className="text-wechat-green">{p.name}</button>
            </span>
          ))}
        </div>
      )}

      {uploading && <div className="px-4 py-2 bg-wechat-green/10 text-sm text-wechat-green text-center">上传中...</div>}

      <div className="flex-1 overflow-y-auto pb-4">
        {tab === 'my' && (
          <div className="flex gap-2 p-3 bg-white border-b">
            <button onClick={() => setShowNewFolder(true)} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-lg text-sm">
              <FolderPlus size={16} /> 新建目录
            </button>
          </div>
        )}

        {tab === 'my' ? (
          files.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-gray-400">
              <Folder size={48} />
              <p className="mt-2 text-sm">暂无文件</p>
            </div>
          ) : (
            files.map(f => {
              const Icon = getIcon(f)
              return (
                <div key={f.id} className="flex items-center px-4 py-3 bg-white border-b active:bg-gray-50 transition">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 cursor-pointer" onClick={() => f.is_dir && enterDir(f)}>
                    <Icon.icon size={22} className={Icon.color} />
                  </div>
                  <div className="ml-3 flex-1 min-w-0 cursor-pointer" onClick={() => f.is_dir && enterDir(f)}>
                    <p className="text-sm font-medium truncate">{f.name}</p>
                    <p className="text-xs text-gray-400">{f.is_dir ? '' : formatSize(f.size)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {!f.is_dir && (
                      <button onClick={() => handleDownload(f)} className="p-1.5 hover:bg-gray-100 rounded" title="下载">
                        <Download size={16} className="text-gray-500" />
                      </button>
                    )}
                    <button onClick={() => setShowShare(f)} className="p-1.5 hover:bg-gray-100 rounded" title="分享">
                      <Share2 size={16} className="text-gray-500" />
                    </button>
                    <button onClick={() => deleteFile(f.id)} className="p-1.5 hover:bg-gray-100 rounded" title="删除">
                      <Trash2 size={16} className="text-red-400" />
                    </button>
                  </div>
                </div>
              )
            })
          )
        ) : (
          shared.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-gray-400">
              <Globe size={48} />
              <p className="mt-2 text-sm">暂无共享文件</p>
            </div>
          ) : (
            shared.map(f => (
              <div key={f.id} className="flex items-center px-4 py-3 bg-white border-b">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  {f.is_dir ? <Folder size={22} className="text-yellow-500" /> : <File size={22} className="text-blue-500" />}
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{f.name}</p>
                  <p className="text-xs text-gray-400">{f.owner_name} · {formatSize(f.size)}</p>
                </div>
                {!f.is_dir && (
                  <button onClick={() => handleDownload(f)} className="p-1.5 hover:bg-gray-100 rounded">
                    <Download size={16} className="text-gray-500" />
                  </button>
                )}
              </div>
            ))
          )
        )}
      </div>

      {showNewFolder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={() => setShowNewFolder(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold mb-4">新建目录</h3>
            <input autoFocus value={newFolderName} onChange={e => setNewFolderName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createFolder()} placeholder="目录名称" className="w-full p-3 bg-gray-100 rounded-lg text-sm focus:outline-none mb-4" />
            <div className="flex gap-2">
              <button onClick={() => setShowNewFolder(false)} className="flex-1 py-2.5 bg-gray-100 rounded-lg text-sm">取消</button>
              <button onClick={createFolder} className="flex-1 py-2.5 bg-wechat-green text-white rounded-lg text-sm">创建</button>
            </div>
          </div>
        </div>
      )}

      {showShare && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={() => setShowShare(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold mb-1">分享设置</h3>
            <p className="text-sm text-gray-500 mb-4">{showShare.name}</p>
            {[0, 1, 3].map(perm => {
              const PIc = PERM_ICONS[perm]
              return (
                <button key={perm} onClick={() => shareFile(showShare.id, perm)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg mb-2 text-sm transition ${showShare.permission === perm ? 'bg-wechat-green/10 text-wechat-green' : 'bg-gray-50 hover:bg-gray-100'}`}>
                  <PIc size={18} />
                  <span>{PERM_NAMES[perm]}</span>
                  {showShare.permission === perm && <span className="ml-auto text-wechat-green">✓</span>}
                </button>
              )
            })}
            <button onClick={() => setShowShare(null)} className="w-full mt-2 py-2.5 bg-gray-100 rounded-lg text-sm">关闭</button>
          </div>
        </div>
      )}
    </div>
  )
}

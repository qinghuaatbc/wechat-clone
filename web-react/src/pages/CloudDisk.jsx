import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, FolderPlus, Folder, File, Download, Trash2, Share2, Globe, Lock, Users, Image, Video, Music, FileText, Archive } from 'lucide-react'
import { useStore } from '../store'
import { toast } from 'sonner'

const api = (token) => async (url, opts = {}) => {
  const headers = {}
  if (!(opts.body instanceof FormData)) headers['Content-Type'] = 'application/json'
  headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(url, { ...opts, headers })
  if (res.status === 204) return null
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error || `请求失败 (${res.status})`)
  return data
}

export default function CloudDisk() {
  const navigate = useNavigate()
  const token = useStore(s => s.token)
  const fetch = useCallback(api(token), [token])

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

  const loadFiles = useCallback(async () => {
    try {
      const params = currentDir ? `?parent_id=${currentDir}` : ''
      const data = await fetch(`/api/cloud/list${params}`)
      setFiles(data.files || [])
    } catch (e) { toast.error(e.message) }
  }, [currentDir, fetch])

  useEffect(() => { if (tab === 'my') loadFiles() }, [loadFiles, tab])
  useEffect(() => {
    if (tab !== 'shared') return
    fetch('/api/cloud/shared').then(d => setShared(d.files || [])).catch(e => toast.error(e.message))
  }, [tab, fetch])

  const createFolder = async () => {
    if (!newFolderName.trim()) { toast.error('请输入目录名称'); return }
    try {
      const body = { name: newFolderName.trim() }
      if (currentDir) body.parent_id = currentDir
      await fetch('/api/cloud/mkdir', { method: 'POST', body: JSON.stringify(body) })
      setShowNewFolder(false)
      setNewFolderName('')
      toast.success('目录已创建')
      loadFiles()
    } catch (e) { toast.error(e.message) }
  }

  const uploadFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      if (currentDir) fd.append('parent_id', currentDir)
      await fetch('/api/cloud/upload', { method: 'POST', body: fd })
      toast.success(`"${file.name}" 上传成功`)
      loadFiles()
    } catch (e) { toast.error(e.message) }
    setUploading(false)
    e.target.value = ''
  }

  const deleteFile = async (id) => {
    if (!confirm('确定删除?')) return
    try {
      await fetch(`/api/cloud/${id}`, { method: 'DELETE' })
      toast.success('已删除')
      loadFiles()
    } catch (e) { toast.error(e.message) }
  }

  const shareFile = async (fileId, permission) => {
    try {
      await fetch('/api/cloud/share', { method: 'POST', body: JSON.stringify({ file_id: fileId, permission }) })
      setShowShare(null)
      toast.success('分享已更新')
      loadFiles()
    } catch (e) { toast.error(e.message) }
  }

  const enterDir = (dir) => {
    setCurrentDir(dir.id)
    setPath(prev => [...prev, { id: dir.id, name: dir.name }])
  }

  const handleDownload = (f) => {
    if (f.is_dir) return
    window.open(f.path, '_blank')
  }

  const formatSize = (bytes) => {
    if (!bytes) return ''
    if (bytes < 1024) return bytes + 'B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB'
    return (bytes / (1024 * 1024)).toFixed(1) + 'MB'
  }

  const getIcon = (f) => {
    const ICONS = {
      dir: { icon: Folder, color: 'text-yellow-500' },
      image: { icon: Image, color: 'text-green-500' },
      video: { icon: Video, color: 'text-blue-500' },
      audio: { icon: Music, color: 'text-pink-500' },
      document: { icon: FileText, color: 'text-orange-500' },
      archive: { icon: Archive, color: 'text-purple-500' },
    }
    return ICONS[f.is_dir ? 'dir' : f.type] || { icon: File, color: 'text-gray-500' }
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

      {uploading && <div className="px-4 py-2 bg-wechat-green/10 text-sm text-center text-wechat-green">上传中...</div>}

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
                    <p className="text-sm font-medium truncate">{f.name || '未命名'}</p>
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
            {[
              { perm: 0, label: '私密', icon: Lock },
              { perm: 1, label: '好友可见', icon: Users },
              { perm: 3, label: '公开', icon: Globe },
            ].map(({ perm, label, icon: PIc }) => (
              <button key={perm} onClick={() => shareFile(showShare.id, perm)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg mb-2 text-sm transition ${showShare.permission === perm ? 'bg-wechat-green/10 text-wechat-green' : 'bg-gray-50 hover:bg-gray-100'}`}>
                <PIc size={18} />
                <span>{label}</span>
                {showShare.permission === perm && <span className="ml-auto text-wechat-green">✓</span>}
              </button>
            ))}
            <button onClick={() => setShowShare(null)} className="w-full mt-2 py-2.5 bg-gray-100 rounded-lg text-sm">关闭</button>
          </div>
        </div>
      )}
    </div>
  )
}

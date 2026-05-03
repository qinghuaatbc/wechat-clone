import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, MessageSquare, Tv, HardDrive, Trash2, Plus, LogOut } from 'lucide-react'

const api = async (url, opts = {}) => {
  const res = await fetch(url, {
    ...opts,
    headers: { ...opts.headers, Authorization: 'Basic ' + btoa('admin:admin') }
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'error')
  return data
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('users')
  const [users, setUsers] = useState([])
  const [groups, setGroups] = useState([])
  const [channels, setChannels] = useState([])
  const [files, setFiles] = useState([])
  const [showAddHLS, setShowAddHLS] = useState(false)
  const [hlsName, setHlsName] = useState('')
  const [hlsUrl, setHlsUrl] = useState('')
  const [hlsCat, setHlsCat] = useState('')

  useEffect(() => {
    if (tab === 'users') api('/api/admin/users').then(d => setUsers(d.users || [])).catch(() => navigate('/admin'))
    if (tab === 'groups') api('/api/admin/groups').then(d => setGroups(d.groups || [])).catch(() => navigate('/admin'))
    if (tab === 'hls') api('/api/admin/hls').then(d => setChannels(d.channels || [])).catch(() => navigate('/admin'))
    if (tab === 'files') api('/api/admin/files').then(d => setFiles(d.files || [])).catch(() => navigate('/admin'))
  }, [tab])

  const delUser = async (id) => { if (confirm('删除用户?')) { await api(`/api/admin/users/${id}`, { method: 'DELETE' }); setUsers(users.filter(u => u.id !== id)) } }
  const delGroup = async (id) => { if (confirm('删除群组?')) { await api(`/api/admin/groups/${id}`, { method: 'DELETE' }); setGroups(groups.filter(g => g.id !== id)) } }
  const delHLS = async (id) => { if (confirm('删除频道?')) { await api(`/api/admin/hls/${id}`, { method: 'DELETE' }); setChannels(channels.filter(c => c.id !== id)) } }
  const delFile = async (id) => { if (confirm('删除文件?')) { await api(`/api/admin/files/${id}`, { method: 'DELETE' }); setFiles(files.filter(f => f.id !== id)) } }
  const addHLS = async () => {
    if (!hlsName.trim() || !hlsUrl.trim()) return
    const data = await api('/api/admin/hls', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: hlsName, url: hlsUrl, category: hlsCat || 'custom' }) })
    setChannels([...(data.channel ? [data.channel] : []), ...channels])
    setShowAddHLS(false); setHlsName(''); setHlsUrl(''); setHlsCat('')
  }

  const tabs = [
    { id: 'users', label: '用户', icon: Users },
    { id: 'groups', label: '群组', icon: MessageSquare },
    { id: 'hls', label: 'HLS频道', icon: Tv },
    { id: 'files', label: '文件', icon: HardDrive },
  ]

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
        <h1 className="font-bold text-lg">管理后台</h1>
        <button onClick={() => { localStorage.removeItem('admin_token'); navigate('/admin') }} className="text-gray-400 hover:text-white flex items-center gap-1 text-sm"><LogOut size={16} /> 退出</button>
      </header>

      <div className="flex bg-gray-800 border-b border-gray-700 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1 px-4 py-3 text-sm whitespace-nowrap ${tab === t.id ? 'text-wechat-green border-b-2 border-wechat-green' : 'text-gray-400'}`}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      <div className="p-4 max-w-4xl mx-auto">
        {tab === 'users' && (
          <div className="space-y-2">
            <p className="text-gray-400 text-sm mb-2">共 {users.length} 个用户</p>
            {users.map(u => (
              <div key={u.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
                <div>
                  <span className="font-medium">{u.nickname || '?'}</span>
                  <span className="text-gray-400 text-sm ml-2">{u.wxid}</span>
                  <span className="text-gray-500 text-xs ml-2">{u.phone}</span>
                </div>
                <button onClick={() => delUser(u.id)} className="text-red-400 hover:text-red-300 p-1"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        )}

        {tab === 'groups' && (
          <div className="space-y-2">
            <p className="text-gray-400 text-sm mb-2">共 {groups.length} 个群组</p>
            {groups.map(g => (
              <div key={g.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
                <div>
                  <span className="font-medium">{g.name || '未命名'}</span>
                  <span className="text-gray-400 text-sm ml-2">{g.member_count} 人</span>
                </div>
                <button onClick={() => delGroup(g.id)} className="text-red-400 hover:text-red-300 p-1"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        )}

        {tab === 'hls' && (
          <div>
            <button onClick={() => setShowAddHLS(true)} className="mb-4 px-4 py-2 bg-wechat-green text-white rounded-lg text-sm flex items-center gap-1"><Plus size={16} /> 添加频道</button>
            <div className="space-y-2">
              {channels.map(c => (
                <div key={c.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-sm">{c.name}</span>
                    <span className="text-gray-500 text-xs ml-2">{c.category}</span>
                    <p className="text-gray-600 text-xs truncate mt-0.5">{c.url}</p>
                  </div>
                  <button onClick={() => delHLS(c.id)} className="text-red-400 hover:text-red-300 p-1 flex-shrink-0"><Trash2 size={16} /></button>
                </div>
              ))}
              {channels.length === 0 && <p className="text-gray-500 text-sm text-center py-8">暂无频道</p>}
            </div>
            {showAddHLS && (
              <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6" onClick={() => setShowAddHLS(false)}>
                <div className="bg-gray-800 rounded-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                  <h3 className="font-bold mb-4">添加HLS频道</h3>
                  <input value={hlsName} onChange={e => setHlsName(e.target.value)} placeholder="频道名称" className="w-full p-3 bg-gray-700 text-white rounded-lg mb-3 text-sm focus:outline-none" />
                  <input value={hlsUrl} onChange={e => setHlsUrl(e.target.value)} placeholder="M3U8/HLS地址" className="w-full p-3 bg-gray-700 text-white rounded-lg mb-3 text-sm focus:outline-none" />
                  <input value={hlsCat} onChange={e => setHlsCat(e.target.value)} placeholder="分类 (默认custom)" className="w-full p-3 bg-gray-700 text-white rounded-lg mb-4 text-sm focus:outline-none" />
                  <button onClick={addHLS} className="w-full py-3 bg-wechat-green text-white rounded-lg text-sm font-medium">添加</button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'files' && (
          <div className="space-y-2">
            <p className="text-gray-400 text-sm mb-2">共 {files.length} 个文件</p>
            {files.map(f => (
              <div key={f.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium truncate block">{f.name || '?'}</span>
                  <span className="text-gray-500 text-xs">{f.type} · {f.is_dir ? '目录' : f.size + 'B'}</span>
                </div>
                <button onClick={() => delFile(f.id)} className="text-red-400 hover:text-red-300 p-1 flex-shrink-0"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

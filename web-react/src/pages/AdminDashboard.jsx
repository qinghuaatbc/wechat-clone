import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, MessageSquare, Tv, HardDrive, Trash2, Plus, LogOut, BookOpen, Pencil, Search, X, BarChart3, ChevronLeft, User, Shield, FileText, Video, Download, BrainCircuit, Sparkles } from 'lucide-react'

const api = async (url, opts = {}) => {
  const res = await fetch(url, {
    ...opts,
    headers: { ...opts.headers, Authorization: 'Basic ' + btoa('admin:admin') }
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'error')
  return data
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-gray-700 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1"><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-gray-400 text-xs uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
      </div>
    </div>
  )
}

function Table({ headers, rows, emptyText }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-700">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-800/80 border-b border-gray-700">
            {headers.map((h, i) => (
              <th key={i} className="text-left px-4 py-3 text-gray-400 font-medium whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="px-4 py-12 text-center text-gray-500">{emptyText}</td>
            </tr>
          ) : rows}
        </tbody>
      </table>
    </div>
  )
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('users')
  const [users, setUsers] = useState([])
  const [groups, setGroups] = useState([])
  const [channels, setChannels] = useState([])
  const [files, setFiles] = useState([])
  const [libItems, setLibItems] = useState([])
  const [searchTerm, setSearchTerm] = useState('')

  const [showAddHLS, setShowAddHLS] = useState(false)
  const [showEditHLS, setShowEditHLS] = useState(null)
  const [hlsName, setHlsName] = useState('')
  const [hlsUrl, setHlsUrl] = useState('')
  const [hlsCat, setHlsCat] = useState('')

  const [showAddLib, setShowAddLib] = useState(false)
  const [showEditLib, setShowEditLib] = useState(null)
  const [libTitle, setLibTitle] = useState('')
  const [libDesc, setLibDesc] = useState('')
  const [libCat, setLibCat] = useState('')
  const [libFile, setLibFile] = useState(null)

  const [exams, setExams] = useState([])
  const [showAIGen, setShowAIGen] = useState(false)
  const [aiTopic, setAiTopic] = useState('')
  const [aiCat, setAiCat] = useState('')
  const [aiSub, setAiSub] = useState('')
  const [aiDifficulty, setAiDifficulty] = useState(1)
  const [aiCount, setAiCount] = useState(5)
  const [aiGenerating, setAiGenerating] = useState(false)

  const [catItems, setCatItems] = useState([])
  const [showAddCat, setShowAddCat] = useState(false)
  const [showEditCat, setShowEditCat] = useState(null)
  const [catName, setCatName] = useState('')
  const [catSubs, setCatSubs] = useState('')
  const [catOrder, setCatOrder] = useState(0)

  useEffect(() => {
    if (tab === 'users') api('/api/admin/users').then(d => setUsers(d.users || [])).catch(() => navigate('/admin'))
    if (tab === 'groups') api('/api/admin/groups').then(d => setGroups(d.groups || [])).catch(() => navigate('/admin'))
    if (tab === 'hls') api('/api/admin/hls').then(d => setChannels(d.channels || [])).catch(() => navigate('/admin'))
    if (tab === 'files') api('/api/admin/files').then(d => setFiles(d.files || [])).catch(() => navigate('/admin'))
    if (tab === 'library') api('/api/admin/library').then(d => setLibItems(d.items || [])).catch(() => navigate('/admin'))
    if (tab === 'exams') api('/api/admin/exams').then(d => setExams(d.exams || [])).catch(() => navigate('/admin'))
    if (tab === 'categories') api('/api/admin/categories').then(d => setCatItems(d.categories || [])).catch(() => navigate('/admin'))
  }, [tab])

  const delUser = async (id) => {
    if (!confirm('确定删除该用户？所有相关数据（消息、好友关系等）将被一并删除，此操作无法撤销。')) return
    await api(`/api/admin/users/${id}`, { method: 'DELETE' })
    setUsers(users.filter(u => u.id !== id))
  }
  const delGroup = async (id) => {
    if (!confirm('确定删除该群组？')) return
    await api(`/api/admin/groups/${id}`, { method: 'DELETE' })
    setGroups(groups.filter(g => g.id !== id))
  }
  const delHLS = async (id) => {
    if (!confirm('确定删除该频道？')) return
    await api(`/api/admin/hls/${id}`, { method: 'DELETE' })
    setChannels(channels.filter(c => c.id !== id))
  }
  const delFile = async (id) => {
    if (!confirm('确定删除该文件？')) return
    await api(`/api/admin/files/${id}`, { method: 'DELETE' })
    setFiles(files.filter(f => f.id !== id))
  }
  const delLib = async (id) => {
    if (!confirm('确定删除该资源？')) return
    await api(`/api/admin/library/${id}`, { method: 'DELETE' })
    setLibItems(libItems.filter(i => i.id !== id))
  }
  const delExam = async (id) => {
    if (!confirm('确定删除该考试？')) return
    await api(`/api/admin/exams/${id}`, { method: 'DELETE' })
    setExams(exams.filter(e => e.id !== id))
  }
  const aiGenerate = async () => {
    if (!aiTopic.trim() || !aiCat.trim()) return
    setAiGenerating(true)
    try {
      const d = await api('/api/admin/exams/ai-generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic: aiTopic, category: aiCat, sub_category: aiSub, difficulty: aiDifficulty, count: aiCount }) })
      setExams([...(d.exam ? [d.exam] : []), ...exams])
      setShowAIGen(false); setAiTopic(''); setAiCat(''); setAiSub(''); setAiDifficulty(1); setAiCount(5)
    } catch (e) { alert('生成失败: ' + e.message) }
    setAiGenerating(false)
  }
  const delCat = async (id) => { if (!confirm('确定删除该类别？')) return; await api(`/api/admin/categories/${id}`, { method: 'DELETE' }); setCatItems(catItems.filter(c => c.id !== id)) }
  const addCat = async () => {
    if (!catName.trim()) return
    const subs = catSubs ? catSubs.split(',').map(s => s.trim()).filter(Boolean) : []
    const d = await api('/api/admin/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: catName, sub_categories: JSON.stringify(subs), sort_order: catOrder }) })
    setCatItems([...(d.category ? [d.category] : []), ...catItems])
    setShowAddCat(false); setCatName(''); setCatSubs(''); setCatOrder(0)
  }
  const editCat = async () => {
    const subs = catSubs ? catSubs.split(',').map(s => s.trim()).filter(Boolean) : []
    await api(`/api/admin/categories/${showEditCat.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: catName, sub_categories: JSON.stringify(subs), sort_order: catOrder }) })
    setShowEditCat(null)
    api('/api/admin/categories').then(d => setCatItems(d.categories || []))
  }

  const addHLS = async () => {
    if (!hlsName.trim() || !hlsUrl.trim()) return
    const data = await api('/api/admin/hls', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: hlsName, url: hlsUrl, category: hlsCat || 'custom' }) })
    setChannels([...(data.channel ? [data.channel] : []), ...channels])
    setShowAddHLS(false); setHlsName(''); setHlsUrl(''); setHlsCat('')
  }

  const editHLS = async () => {
    if (!hlsName.trim() || !hlsUrl.trim()) return
    await api(`/api/admin/hls/${showEditHLS.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: hlsName, url: hlsUrl, category: hlsCat }) })
    setShowEditHLS(null); setHlsName(''); setHlsUrl(''); setHlsCat('')
    api('/api/admin/hls').then(d => setChannels(d.channels || []))
  }

  const addLib = async () => {
    if (!libTitle.trim() || !libCat.trim() || !libFile) return
    const fd = new FormData()
    fd.append('title', libTitle)
    fd.append('description', libDesc)
    fd.append('category', libCat)
    fd.append('file', libFile)
    await api('/api/admin/library', { method: 'POST', body: fd })
    setShowAddLib(false); setLibTitle(''); setLibDesc(''); setLibCat(''); setLibFile(null)
    api('/api/admin/library').then(d => setLibItems(d.items || []))
  }

  const editLib = async () => {
    await api(`/api/admin/library/${showEditLib.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: libTitle, description: libDesc, category: libCat }) })
    setShowEditLib(null)
    api('/api/admin/library').then(d => setLibItems(d.items || []))
  }

  const tabs = [
    { id: 'users', label: '用户', icon: Users },
    { id: 'groups', label: '群组', icon: MessageSquare },
    { id: 'hls', label: '直播频道', icon: Tv },
    { id: 'files', label: '文件管理', icon: HardDrive },
    { id: 'library', label: '图书馆', icon: BookOpen },
    { id: 'exams', label: 'AI考试', icon: BrainCircuit },
    { id: 'categories', label: '类别管理', icon: BookCheck },
  ]

  const filteredUsers = users.filter(u =>
    (u.nickname && u.nickname.includes(searchTerm)) ||
    (u.wxid && u.wxid.includes(searchTerm)) ||
    (u.phone && u.phone.includes(searchTerm))
  )

  const filteredGroups = groups.filter(g =>
    (g.name && g.name.includes(searchTerm))
  )

  const filteredHLS = channels.filter(c =>
    (c.name && c.name.includes(searchTerm)) ||
    (c.category && c.category.includes(searchTerm))
  )

  const filteredLib = libItems.filter(i =>
    (i.title && i.title.includes(searchTerm)) ||
    (i.description && i.description.includes(searchTerm)) ||
    (i.category && i.category.includes(searchTerm))
  )

  const formatSize = (bytes) => {
    if (!bytes) return '-'
    if (bytes < 1024) return bytes + 'B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB'
    return (bytes / (1024 * 1024)).toFixed(1) + 'MB'
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col flex-shrink-0 hidden md:flex">
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-wechat-green to-emerald-600 flex items-center justify-center">
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white text-sm">管理后台</h1>
              <p className="text-gray-500 text-xs">wechat-clone</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                tab === t.id
                  ? 'bg-wechat-green/10 text-wechat-green shadow-sm'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`}>
              <t.icon size={18} />
              <span>{t.label}</span>
              {tab === t.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-wechat-green" />}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-500 hover:text-gray-300 text-sm transition-colors">
            <ChevronLeft size={16} />
            返回前台
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-wechat-green to-emerald-600 flex items-center justify-center">
            <Shield size={16} className="text-white" />
          </div>
          <h1 className="font-bold text-white text-sm">管理后台</h1>
        </div>
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white">
          <LogOut size={18} />
        </button>
      </div>

      {/* Mobile tabs */}
      <div className="md:hidden fixed top-14 left-0 right-0 z-40 bg-gray-900 border-b border-gray-800 overflow-x-auto flex">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1 px-4 py-2.5 text-xs whitespace-nowrap ${
              tab === t.id ? 'text-wechat-green border-b-2 border-wechat-green' : 'text-gray-400'
            }`}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 md:pt-0 pt-[112px] overflow-auto">
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          {/* Stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
            <StatCard icon={<Users size={20} />} label="用户总数" value={users.length} color="bg-blue-500/10 text-blue-400" />
            <StatCard icon={<MessageSquare size={20} />} label="群组数量" value={groups.length} color="bg-purple-500/10 text-purple-400" />
            <StatCard icon={<Tv size={20} />} label="直播频道" value={channels.length} color="bg-green-500/10 text-green-400" />
            <StatCard icon={<HardDrive size={20} />} label="文件数量" value={files.length} color="bg-orange-500/10 text-orange-400" />
            <StatCard icon={<BookOpen size={20} />} label="图书馆资源" value={libItems.length} color="bg-pink-500/10 text-pink-400" />
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-3 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                placeholder={`搜索${tabs.find(t => t.id === tab)?.label || ''}...`}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-wechat-green/50 transition-colors" />
              {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"><X size={14} /></button>}
            </div>
          </div>

          {/* Tab content */}
          {tab === 'users' && (
            <div>
              <p className="text-gray-500 text-xs mb-3">共 {users.length} 个用户，显示 {filteredUsers.length} 个</p>
              <Table
                headers={['头像', '昵称', '微信号', '手机号', '注册时间', '操作']}
                emptyText="暂无用户数据"
                rows={filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-wechat-green to-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                        {(u.nickname || '?')[0]}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-white">{u.nickname || '未设置'}</td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{u.wxid}</td>
                    <td className="px-4 py-3 text-gray-400">{u.phone || '-'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => delUser(u.id)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10 p-1.5 rounded-lg transition-colors" title="删除"><Trash2 size={15} /></button>
                    </td>
                  </tr>
                ))}
              />
            </div>
          )}

          {tab === 'groups' && (
            <div>
              <p className="text-gray-500 text-xs mb-3">共 {groups.length} 个群组，显示 {filteredGroups.length} 个</p>
              <Table
                headers={['群组名称', '成员数', '创建时间', '操作']}
                emptyText="暂无群组数据"
                rows={filteredGroups.map(g => (
                  <tr key={g.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-xs font-bold">
                          {(g.name || '?')[0]}
                        </div>
                        <span className="font-medium text-white">{g.name || '未命名'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{g.member_count} 人</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(g.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => delGroup(g.id)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10 p-1.5 rounded-lg transition-colors"><Trash2 size={15} /></button>
                    </td>
                  </tr>
                ))}
              />
            </div>
          )}

          {tab === 'hls' && (
            <div>
              <button onClick={() => setShowAddHLS(true)} className="mb-4 px-5 py-2.5 bg-gradient-to-r from-wechat-green to-emerald-600 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-wechat-green/20 transition-all flex items-center gap-2">
                <Plus size={16} /> 添加频道
              </button>
              <Table
                headers={['名称', '分类', 'URL', '操作']}
                emptyText="暂无频道，点击上方按钮添加"
                rows={filteredHLS.map(c => (
                  <tr key={c.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{c.name}</td>
                    <td className="px-4 py-3">
                      <span className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded-full">{c.category}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs max-w-[300px] truncate font-mono">{c.url}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setShowEditHLS(c); setHlsName(c.name); setHlsUrl(c.url); setHlsCat(c.category) }} className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 p-1.5 rounded-lg transition-colors" title="编辑"><Pencil size={15} /></button>
                        <button onClick={() => delHLS(c.id)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10 p-1.5 rounded-lg transition-colors" title="删除"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              />
            </div>
          )}

          {tab === 'files' && (
            <div>
              <p className="text-gray-500 text-xs mb-3">共 {files.length} 个文件</p>
              <Table
                headers={['名称', '类型', '大小', '权限', '上传时间', '操作']}
                emptyText="暂无文件数据"
                rows={files.map(f => (
                  <tr key={f.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-white max-w-[200px] truncate">{f.name || '?'}</td>
                    <td className="px-4 py-3">
                      <span className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded-full">{f.is_dir ? '📁 目录' : f.type || '未知'}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{f.is_dir ? '-' : formatSize(f.size)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${f.permission === 3 ? 'bg-green-500/10 text-green-400' : f.permission === 1 ? 'bg-blue-500/10 text-blue-400' : 'bg-gray-600/10 text-gray-400'}`}>
                        {f.permission === 3 ? '公开' : f.permission === 1 ? '好友' : '私密'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(f.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => delFile(f.id)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10 p-1.5 rounded-lg transition-colors"><Trash2 size={15} /></button>
                    </td>
                  </tr>
                ))}
              />
            </div>
          )}

          {tab === 'library' && (
            <div>
              <button onClick={() => setShowAddLib(true)} className="mb-4 px-5 py-2.5 bg-gradient-to-r from-wechat-green to-emerald-600 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-wechat-green/20 transition-all flex items-center gap-2">
                <Plus size={16} /> 添加资源
              </button>
              <Table
                headers={['标题', '分类', '描述', '大小', '下载次数', '操作']}
                emptyText="暂无资源，点击上方按钮添加"
                rows={filteredLib.map(item => (
                  <tr key={item.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{item.title}</td>
                    <td className="px-4 py-3">
                      <span className="bg-pink-500/10 text-pink-400 text-xs px-2 py-0.5 rounded-full">{item.category}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs max-w-[200px] truncate">{item.description || '-'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{formatSize(item.file_size)}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs flex items-center gap-1"><Download size={12} /> {item.downloads}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setShowEditLib(item); setLibTitle(item.title); setLibDesc(item.description || ''); setLibCat(item.category) }} className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 p-1.5 rounded-lg transition-colors" title="编辑"><Pencil size={15} /></button>
                        <button onClick={() => delLib(item.id)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10 p-1.5 rounded-lg transition-colors" title="删除"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              />
            </div>
          )}
          {tab === 'exams' && (
            <div>
              <button onClick={() => setShowAIGen(true)} className="mb-4 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-purple-500/20 transition-all flex items-center gap-2">
                <Sparkles size={16} /> AI生成考试
              </button>
              <Table
                headers={['标题', '分类', '难度', '题数', '操作']}
                emptyText="暂无考试，点击上方按钮用AI生成"
                rows={exams.filter(e => (e.title && e.title.includes(searchTerm)) || (e.category && e.category.includes(searchTerm))).map(exam => (
                  <tr key={exam.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{exam.title}</td>
                    <td className="px-4 py-3">
                      <span className="bg-purple-500/10 text-purple-400 text-xs px-2 py-0.5 rounded-full">{exam.category}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{['简单','中等','困难'][exam.difficulty-1] || '未知'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{exam.question_cnt}题</td>
                    <td className="px-4 py-3">
                      <button onClick={() => delExam(exam.id)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10 p-1.5 rounded-lg transition-colors" title="删除"><Trash2 size={15} /></button>
                    </td>
                  </tr>
                ))}
              />
            </div>
          )}
          {tab === 'categories' && (
            <div>
              <button onClick={() => setShowAddCat(true)} className="mb-4 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-purple-500/20 transition-all flex items-center gap-2">
                <Plus size={16} /> 添加类别
              </button>
              <Table
                headers={['名称', '子类别', '排序', '操作']}
                emptyText="暂无类别"
                rows={catItems.map(c => {
                  const subs = (() => { try { return JSON.parse(c.sub_categories || '[]') } catch { return [] } })()
                  return (
                    <tr key={c.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-white">{c.name}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs max-w-[200px] truncate">{subs.join(', ') || '-'}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{c.sort_order}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setShowEditCat(c); setCatName(c.name); setCatSubs(subs.join(', ')); setCatOrder(c.sort_order) }}
                            className="text-blue-400 hover:text-blue-300 p-1.5 rounded-lg" title="编辑"><Pencil size={15} /></button>
                          <button onClick={() => delCat(c.id)} className="text-red-400 hover:text-red-300 p-1.5 rounded-lg" title="删除"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              />
            </div>
          )}
        </div>
      </div>

      {/* HLS Modals */}
      {showAddHLS && (
        <Modal title="添加直播频道" onClose={() => setShowAddHLS(false)}>
          <input value={hlsName} onChange={e => setHlsName(e.target.value)} placeholder="频道名称" autoFocus
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 text-white rounded-xl text-sm focus:outline-none focus:border-wechat-green/50 mb-3" />
          <input value={hlsUrl} onChange={e => setHlsUrl(e.target.value)} placeholder="M3U8/HLS 地址"
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 text-white rounded-xl text-sm focus:outline-none focus:border-wechat-green/50 mb-3" />
          <input value={hlsCat} onChange={e => setHlsCat(e.target.value)} placeholder="分类 (如: 新闻/体育/娱乐)"
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 text-white rounded-xl text-sm focus:outline-none focus:border-wechat-green/50 mb-5" />
          <button onClick={addHLS} className="w-full py-3 bg-gradient-to-r from-wechat-green to-emerald-600 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all">
            添加
          </button>
        </Modal>
      )}

      {showEditHLS && (
        <Modal title="编辑直播频道" onClose={() => setShowEditHLS(null)}>
          <input value={hlsName} onChange={e => setHlsName(e.target.value)} placeholder="频道名称" autoFocus
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 text-white rounded-xl text-sm focus:outline-none focus:border-wechat-green/50 mb-3" />
          <input value={hlsUrl} onChange={e => setHlsUrl(e.target.value)} placeholder="M3U8/HLS 地址"
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 text-white rounded-xl text-sm focus:outline-none focus:border-wechat-green/50 mb-3" />
          <input value={hlsCat} onChange={e => setHlsCat(e.target.value)} placeholder="分类"
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 text-white rounded-xl text-sm focus:outline-none focus:border-wechat-green/50 mb-5" />
          <button onClick={editHLS} className="w-full py-3 bg-gradient-to-r from-wechat-green to-emerald-600 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all">
            保存修改
          </button>
        </Modal>
      )}

      {/* Library Modals */}
      {showAddLib && (
        <Modal title="添加图书馆资源" onClose={() => setShowAddLib(false)}>
          <input value={libTitle} onChange={e => setLibTitle(e.target.value)} placeholder="资源标题" autoFocus
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 text-white rounded-xl text-sm focus:outline-none focus:border-wechat-green/50 mb-3" />
          <textarea value={libDesc} onChange={e => setLibDesc(e.target.value)} placeholder="资源描述"
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 text-white rounded-xl text-sm focus:outline-none focus:border-wechat-green/50 mb-3 resize-none" rows={2} />
          <input value={libCat} onChange={e => setLibCat(e.target.value)} placeholder="分类 (如: 编程/语言/工具)"
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 text-white rounded-xl text-sm focus:outline-none focus:border-wechat-green/50 mb-3" />
          <div className="mb-5">
            <label className="block text-gray-400 text-xs mb-2">上传文件</label>
            <div className="border-2 border-dashed border-gray-600 rounded-xl p-4 text-center hover:border-wechat-green/50 transition-colors cursor-pointer" onClick={() => document.getElementById('lib-file-input').click()}>
              {libFile ? (
                <div className="flex items-center justify-center gap-2 text-wechat-green">
                  <FileText size={18} />
                  <span className="text-sm">{libFile.name}</span>
                </div>
              ) : (
                <div className="text-gray-500">
                  <FileText size={24} className="mx-auto mb-1" />
                  <p className="text-xs">点击选择文件</p>
                </div>
              )}
            </div>
            <input id="lib-file-input" type="file" className="hidden" onChange={e => setLibFile(e.target.files[0])} />
          </div>
          <button onClick={addLib} className="w-full py-3 bg-gradient-to-r from-wechat-green to-emerald-600 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all">
            添加
          </button>
        </Modal>
      )}

      {showEditLib && (
        <Modal title="编辑资源" onClose={() => setShowEditLib(null)}>
          <input value={libTitle} onChange={e => setLibTitle(e.target.value)} placeholder="资源标题" autoFocus
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 text-white rounded-xl text-sm focus:outline-none focus:border-wechat-green/50 mb-3" />
          <textarea value={libDesc} onChange={e => setLibDesc(e.target.value)} placeholder="资源描述"
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 text-white rounded-xl text-sm focus:outline-none focus:border-wechat-green/50 mb-3 resize-none" rows={2} />
          <input value={libCat} onChange={e => setLibCat(e.target.value)} placeholder="分类"
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 text-white rounded-xl text-sm focus:outline-none focus:border-wechat-green/50 mb-5" />
          <button onClick={editLib} className="w-full py-3 bg-gradient-to-r from-wechat-green to-emerald-600 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all">
            保存修改
          </button>
        </Modal>
      )}

      {showAIGen && (
        <Modal title="AI 生成考试" onClose={() => setShowAIGen(false)}>
          <input value={aiTopic} onChange={e => setAiTopic(e.target.value)} placeholder="考试主题 (如: Go语言并发编程)" autoFocus
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 text-white rounded-xl text-sm focus:outline-none focus:border-purple-500/50 mb-3" />
          <input value={aiCat} onChange={e => setAiCat(e.target.value)} placeholder="类别 (如: 编程/英语/数学)"
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 text-white rounded-xl text-sm focus:outline-none focus:border-purple-500/50 mb-3" />
          <input value={aiSub} onChange={e => setAiSub(e.target.value)} placeholder="子类别 (可选)"
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 text-white rounded-xl text-sm focus:outline-none focus:border-purple-500/50 mb-3" />
          <div className="flex gap-3 mb-5">
            <div className="flex-1">
              <label className="block text-gray-400 text-xs mb-1">难度</label>
              <select value={aiDifficulty} onChange={e => setAiDifficulty(parseInt(e.target.value))}
                className="w-full px-3 py-3 bg-gray-700/50 border border-gray-600 text-white rounded-xl text-sm focus:outline-none">
                <option value={1}>简单</option>
                <option value={2}>中等</option>
                <option value={3}>困难</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-gray-400 text-xs mb-1">题目数量</label>
              <input type="number" min={1} max={20} value={aiCount} onChange={e => setAiCount(parseInt(e.target.value))}
                className="w-full px-3 py-3 bg-gray-700/50 border border-gray-600 text-white rounded-xl text-sm focus:outline-none" />
            </div>
          </div>
          <button onClick={aiGenerate} disabled={aiGenerating}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {aiGenerating ? <><span className="animate-spin">⟳</span> AI生成中...</> : <><Sparkles size={16} /> AI生成</>}
          </button>
        </Modal>
      )}

      {showAddCat && (
        <Modal title="添加类别" onClose={() => setShowAddCat(false)}>
          <input value={catName} onChange={e => setCatName(e.target.value)} placeholder="类别名称" autoFocus
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 text-white rounded-xl text-sm focus:outline-none focus:border-purple-500/50 mb-3" />
          <input value={catSubs} onChange={e => setCatSubs(e.target.value)} placeholder="子类别，逗号分隔 (如: Go,Python,Java)"
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 text-white rounded-xl text-sm focus:outline-none focus:border-purple-500/50 mb-3" />
          <input type="number" value={catOrder} onChange={e => setCatOrder(parseInt(e.target.value))} placeholder="排序"
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 text-white rounded-xl text-sm focus:outline-none focus:border-purple-500/50 mb-5" />
          <button onClick={addCat} className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all">添加</button>
        </Modal>
      )}
      {showEditCat && (
        <Modal title="编辑类别" onClose={() => setShowEditCat(null)}>
          <input value={catName} onChange={e => setCatName(e.target.value)} placeholder="类别名称" autoFocus
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 text-white rounded-xl text-sm focus:outline-none focus:border-purple-500/50 mb-3" />
          <input value={catSubs} onChange={e => setCatSubs(e.target.value)} placeholder="子类别，逗号分隔"
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 text-white rounded-xl text-sm focus:outline-none focus:border-purple-500/50 mb-3" />
          <input type="number" value={catOrder} onChange={e => setCatOrder(parseInt(e.target.value))} placeholder="排序"
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 text-white rounded-xl text-sm focus:outline-none focus:border-purple-500/50 mb-5" />
          <button onClick={editCat} className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all">保存</button>
        </Modal>
      )}
    </div>
  )
}

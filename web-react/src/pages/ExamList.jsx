import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, BookCheck, Brain, ChevronRight, Clock, BarChart3, Sparkles, Plus, X, Trash2 } from 'lucide-react'
import { useStore } from '../store'
import { toast } from 'sonner'

const DIFFICULTIES = { 1: '简单', 2: '中等', 3: '困难' }
const DIFF_COLORS = { 1: 'text-green-500 bg-green-50', 2: 'text-yellow-500 bg-yellow-50', 3: 'text-red-500 bg-red-50' }

const api = (token) => async (url, opts = {}) => {
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  const res = await fetch(url, { ...opts, headers })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'error')
  return data
}

export default function ExamList() {
  const navigate = useNavigate()
  const token = useStore(s => s.token)
  const request = (url, opts) => api(token)(url, opts)
  const [exams, setExams] = useState([])
  const [categories, setCategories] = useState([])
  const [activeCat, setActiveCat] = useState('')
  const [activeSub, setActiveSub] = useState('')

  const [showCustom, setShowCustom] = useState(false)
  const [topic, setTopic] = useState('')
  const [cat, setCat] = useState('')
  const [sub, setSub] = useState('')
  const [catSubs, setCatSubs] = useState([])
  const [difficulty, setDifficulty] = useState(1)
  const [qCount, setQCount] = useState(5)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetch('/api/exams/categories', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => {
        setCategories(d.categories || [])
        setCatSubs(d.categories || [])
      })
    fetchExams()
  }, [])

  useEffect(() => { fetchExams() }, [activeCat, activeSub])

  const fetchExams = () => {
    const p = new URLSearchParams()
    if (activeCat) p.set('category', activeCat)
    if (activeSub) p.set('sub_category', activeSub)
    fetch(`/api/exams?${p}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setExams(d.exams || []))
  }

  const deleteExam = async (e, id) => {
    e.stopPropagation()
    if (!confirm('确定删除该试卷？')) return
    try {
      await request(`/api/exams/${id}`, { method: 'DELETE' })
      setExams(exams.filter(x => x.id !== id))
      toast.success('已删除')
    } catch (e) { toast.error('删除失败') }
  }

  const handleCatChange = (val) => {
    setCat(val)
    setSub('')
  }

  const selectedCat = catSubs.find(c => c.category === cat)
  const subList = selectedCat?.sub_categories || []

  const generateExam = async () => {
    if (!topic.trim() || !cat.trim()) { toast.error('请填写主题和类别'); return }
    setGenerating(true)
    try {
      const d = await request('/api/exams/generate', {
        method: 'POST',
        body: JSON.stringify({ topic: topic.trim(), category: cat.trim(), sub_category: sub, difficulty, count: qCount })
      })
      toast.success('试卷生成成功！')
      setShowCustom(false)
      setTopic(''); setCat(''); setSub(''); setDifficulty(1); setQCount(5)
      navigate(`/exam/${d.exam.id}`)
    } catch (e) { toast.error('生成失败: ' + e.message) }
    setGenerating(false)
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-gradient-to-b from-purple-50 via-white to-purple-50/30">
      <header className="px-4 pt-4 pb-5 bg-gradient-to-r from-purple-600 to-indigo-600 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate('/', { state: { tab: 'discover' } })}
            className="text-white/90 hover:text-white p-1"><ArrowLeft size={24} /></button>
          <div className="flex items-center gap-2">
            <Brain size={20} className="text-white/80" />
            <h2 className="text-white font-bold text-lg">AI考试</h2>
          </div>
          <button onClick={() => navigate('/exam/history')}
            className="text-white/80 text-sm flex items-center gap-1 hover:text-white">
            <BarChart3 size={16} /> 历史
          </button>
        </div>
        <button onClick={() => setShowCustom(true)}
          className="w-full py-2.5 bg-white/20 backdrop-blur-sm text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-white/30 transition">
          <Sparkles size={16} /> 自定义生成试卷
        </button>
      </header>

      <div className="flex gap-2 px-4 py-3 bg-white border-b overflow-x-auto">
        <button onClick={() => { setActiveCat(''); setActiveSub('') }}
          className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition ${!activeCat ? 'bg-purple-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600'}`}>全部</button>
        {categories.map(c => (
          <button key={c.category} onClick={() => { setActiveCat(c.category); setActiveSub('') }}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition ${activeCat === c.category ? 'bg-purple-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600'}`}>
            {c.category}
          </button>
        ))}
      </div>

      {activeCat && (
        <div className="flex gap-2 px-4 py-2 bg-gray-50 border-b overflow-x-auto">
          <button onClick={() => setActiveSub('')}
            className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap ${!activeSub ? 'bg-purple-100 text-purple-700' : 'text-gray-500'}`}>全部</button>
          {categories.find(c => c.category === activeCat)?.sub_categories?.map(s => (
            <button key={s.sub_category} onClick={() => setActiveSub(s.sub_category)}
              className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap ${activeSub === s.sub_category ? 'bg-purple-100 text-purple-700' : 'text-gray-500'}`}>
              {s.sub_category} ({s.count})
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {exams.map(exam => (
          <div key={exam.id} onClick={() => navigate(`/exam/${exam.id}`)}
            className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition cursor-pointer border border-gray-100 relative group">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900">{exam.title}</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{exam.description}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={e => deleteExam(e, exam.id)}
                  className="p-1.5 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition" title="删除">
                  <Trash2 size={14} className="text-red-400" />
                </button>
                <ChevronRight size={20} className="text-gray-300 mt-1" />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3 text-xs">
              <span className="bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">{exam.category}</span>
              {exam.sub_category && <span className="text-gray-400">{exam.sub_category}</span>}
              <span className={`px-2 py-0.5 rounded-full ${DIFF_COLORS[exam.difficulty] || 'text-gray-500 bg-gray-50'}`}>
                {DIFFICULTIES[exam.difficulty] || '未知'}
              </span>
              <span className="text-gray-400 flex items-center gap-1"><BookCheck size={12} />{exam.question_cnt}题</span>
              {exam.time_limit > 0 && <span className="text-gray-400 flex items-center gap-1"><Clock size={12} />{exam.time_limit}分钟</span>}
            </div>
          </div>
        ))}
        {exams.length === 0 && (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <Brain size={48} className="opacity-50" />
            <p className="mt-3 text-sm">暂无考题，点击上方按钮自定义生成</p>
          </div>
        )}
      </div>

      {showCustom && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowCustom(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Sparkles size={20} className="text-purple-600" />
                <h3 className="font-bold text-gray-900">自定义生成试卷</h3>
              </div>
              <button onClick={() => setShowCustom(false)} className="text-gray-400 hover:text-gray-600 p-1"><X size={20} /></button>
            </div>

            <input value={topic} onChange={e => setTopic(e.target.value)}
              placeholder="主题（如: Go语言并发编程）" autoFocus
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-400 mb-3" />

            <div className="flex gap-3 mb-3">
              <div className="flex-1">
                <select value={cat} onChange={e => handleCatChange(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-400">
                  <option value="">选择类别</option>
                  {catSubs.map(c => <option key={c.category} value={c.category}>{c.category}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <select value={sub} onChange={e => setSub(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-400" disabled={!cat}>
                  <option value="">子类别（可选）</option>
                  {subList.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mb-5">
              <div className="flex-1">
                <label className="block text-gray-500 text-xs mb-1.5">难度</label>
                <select value={difficulty} onChange={e => setDifficulty(parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-400">
                  <option value={1}>简单</option>
                  <option value={2}>中等</option>
                  <option value={3}>困难</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-gray-500 text-xs mb-1.5">题目数量</label>
                <input type="number" min={1} max={20} value={qCount} onChange={e => setQCount(parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-400" />
              </div>
            </div>

            <button onClick={generateExam} disabled={generating}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2">
              {generating ? <><span className="animate-spin">⟳</span> 生成中...</> : <><Sparkles size={18} /> 生成试卷并开始考试</>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

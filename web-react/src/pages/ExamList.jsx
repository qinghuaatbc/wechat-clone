import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, BookCheck, Brain, ChevronRight, Clock, BarChart3 } from 'lucide-react'
import { useStore } from '../store'

const DIFFICULTIES = { 1: '简单', 2: '中等', 3: '困难' }
const DIFF_COLORS = { 1: 'text-green-500 bg-green-50', 2: 'text-yellow-500 bg-yellow-50', 3: 'text-red-500 bg-red-50' }

export default function ExamList() {
  const navigate = useNavigate()
  const token = useStore(s => s.token)
  const [exams, setExams] = useState([])
  const [categories, setCategories] = useState([])
  const [activeCat, setActiveCat] = useState('')
  const [activeSub, setActiveSub] = useState('')

  const api = async (url) => {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    return res.json()
  }

  useEffect(() => {
    api('/api/exams/categories').then(d => setCategories(d.categories || []))
    fetchExams()
  }, [])

  useEffect(() => { fetchExams() }, [activeCat, activeSub])

  const fetchExams = () => {
    const p = new URLSearchParams()
    if (activeCat) p.set('category', activeCat)
    if (activeSub) p.set('sub_category', activeSub)
    api(`/api/exams?${p}`).then(d => setExams(d.exams || []))
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
            className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition cursor-pointer border border-gray-100">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900">{exam.title}</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{exam.description}</p>
              </div>
              <ChevronRight size={20} className="text-gray-300 flex-shrink-0 mt-1" />
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
            <p className="mt-3 text-sm">暂无考题</p>
          </div>
        )}
      </div>
    </div>
  )
}

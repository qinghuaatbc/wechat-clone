import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Flag, Send, Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react'
import { useStore } from '../store'
import { toast } from 'sonner'

const api = (token) => async (url, opts = {}) => {
  const headers = {}
  if (!(opts.body instanceof FormData)) headers['Content-Type'] = 'application/json'
  headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(url, { ...opts, headers })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'error')
  return data
}

export default function ExamTake() {
  const { id } = useParams()
  const navigate = useNavigate()
  const token = useStore(s => s.token)
  const request = useCallback((url, opts) => api(token)(url, opts), [token])

  const [exam, setExam] = useState(null)
  const [attempt, setAttempt] = useState(null)
  const [answers, setAnswers] = useState({})
  const [started, setStarted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [peekReveal, setPeekReveal] = useState({})

  useEffect(() => {
    request(`/api/exams/${id}`).then(d => {
      setExam(d.exam)
      setLoading(false)
    }).catch(() => { toast.error('加载失败'); navigate('/exam') })
  }, [id])

  const startExam = async () => {
    try {
      const d = await request(`/api/exams/${id}/start`, { method: 'POST' })
      setAttempt(d.attempt)
      setStarted(true)
    } catch (e) { toast.error(e.message) }
  }

  const doPeek = async (qi) => {
    setPeekReveal(prev => ({ ...prev, [qi]: !prev[qi] }))
  }

  const selectAnswer = (qIdx, optIdx) => {
    setAnswers(prev => ({ ...prev, [qIdx]: optIdx }))
  }

  const submitExam = async () => {
    if (!confirm('确认交卷？')) return
    setSubmitting(true)
    try {
      const ansList = exam.questions.map((q, i) => ({
        question_id: q.id,
        selected: answers[i] ?? -1
      }))
      const d = await request(`/api/exams/${attempt.id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers: ansList })
      })
      setResult(d)
    } catch (e) { toast.error(e.message) }
    setSubmitting(false)
  }

  if (loading) {
    return <div className="h-screen max-w-md mx-auto flex items-center justify-center bg-gray-50 text-sm text-gray-400">加载中...</div>
  }
  if (!exam) return null

  if (result) {
    const a = result.analysis
    const grade = a.score_pct >= 90 ? 'A' : a.score_pct >= 80 ? 'B' : a.score_pct >= 70 ? 'C' : a.score_pct >= 60 ? 'D' : 'F'
    const pass = a.score_pct >= 60

    return (
      <div className="flex flex-col h-screen max-w-md mx-auto bg-gradient-to-b from-purple-50 via-white to-purple-50/30">
        <header className="px-4 py-3 bg-white border-b flex items-center gap-3">
          <button onClick={() => navigate('/exam')} className="p-1"><ArrowLeft size={24} /></button>
          <h2 className="font-semibold">考试结果</h2>
        </header>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center border border-gray-100">
            <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center text-3xl font-bold mb-3 ${
              pass ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
            }`}>{grade}</div>
            <h3 className="text-lg font-bold text-gray-900">{pass ? '恭喜通过！' : '未通过'}</h3>
            <p className="text-gray-500 text-sm mt-1">{exam.title}</p>
            <div className="flex justify-center gap-8 mt-4">
              <div><p className="text-2xl font-bold text-purple-600">{a.score_pct}%</p><p className="text-xs text-gray-400">正确率</p></div>
              <div><p className="text-2xl font-bold text-green-600">{a.correct}</p><p className="text-xs text-gray-400">答对</p></div>
              <div><p className="text-2xl font-bold text-gray-600">{a.total}</p><p className="text-xs text-gray-400">总题</p></div>
            </div>
          </div>

          {a.weak_areas?.length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-1"><AlertTriangle size={16} className="text-orange-500" /> 薄弱环节</h4>
              <div className="space-y-1.5">
                {a.weak_areas.map((w, i) => (
                  <p key={i} className="text-xs text-gray-600 bg-orange-50 px-3 py-1.5 rounded-lg">{i+1}. {w}</p>
                ))}
              </div>
            </div>
          )}

          <button onClick={() => navigate('/exam')}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition">
            返回考试列表
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-gray-50">
      <header className="px-4 py-3 bg-white border-b flex items-center justify-between">
        <button onClick={() => { if (!started || confirm('退出将丢失进度?')) navigate('/exam') }} className="p-1"><ArrowLeft size={24} /></button>
        <h2 className="font-semibold text-sm truncate">{exam.title}</h2>
        {started && <span className="text-xs text-gray-500">{Object.keys(answers).length}/{exam.questions?.length || 0}</span>}
        {!started && <div className="w-8" />}
      </header>

      {!started ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center mb-4">
            <Flag size={36} className="text-purple-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">{exam.title}</h2>
          <p className="text-sm text-gray-500 mt-2 text-center">{exam.description}</p>
          <div className="flex gap-4 mt-4 text-xs text-gray-400">
            <span>{exam.question_cnt} 题</span>
            <span>{['简单','中等','困难'][exam.difficulty-1]}</span>
            {exam.time_limit > 0 && <span>{exam.time_limit} 分钟</span>}
          </div>
          <button onClick={startExam}
            className="mt-6 w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition">
            开始考试
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {exam.questions?.map((q, qi) => {
            let opts = []
            try { opts = JSON.parse(q.options) } catch {}
            const showAnswer = peekReveal[qi]
            return (
              <div key={q.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-start gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{qi+1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900">{q.question}</p>
                      <button onClick={() => doPeek(qi)}
                        className="flex-shrink-0 p-1 rounded-lg hover:bg-red-50 transition"
                        title={showAnswer ? '隐藏答案' : '偷窥答案'}>
                        {showAnswer ? <EyeOff size={16} className="text-red-500" /> : <Eye size={16} className="text-gray-400 hover:text-red-500" />}
                      </button>
                    </div>
                    <div className="mt-2 space-y-1.5">
                      {opts.map((opt, oi) => {
                        const isCorrect = oi === q.correct_answer
                        const isSelected = answers[qi] === oi
                        let cls = 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                        if (isSelected && showAnswer && isCorrect) cls = 'border-green-500 bg-green-50 text-green-700'
                        else if (isSelected && showAnswer && !isCorrect) cls = 'border-red-500 bg-red-50 text-red-600'
                        else if (isSelected) cls = 'border-purple-500 bg-purple-50 text-purple-700'
                        else if (showAnswer && isCorrect) cls = 'border-green-300 bg-green-50/50 text-green-700'
                        return (
                          <div key={oi} onClick={() => selectAnswer(qi, oi)}
                            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition border cursor-pointer ${cls}`}>
                            <span className="font-mono mr-2 text-xs">{String.fromCharCode(65+oi)}.</span>
                            {opt}
                            {showAnswer && isCorrect && <CheckCircle size={14} className="inline ml-1.5 text-green-500" />}
                          </div>
                        )
                      })}
                    </div>
                    {showAnswer && q.explanation && (
                      <p className="mt-2 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">{q.explanation}</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          <div className="sticky bottom-0 pb-4 pt-2">
            <button onClick={submitExam} disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting ? '提交中...' : <><Send size={18} /> 交卷</>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

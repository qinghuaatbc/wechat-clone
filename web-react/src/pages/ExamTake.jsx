import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Flag, Send, Eye, EyeOff, AlertTriangle, CheckCircle, XCircle, Download, Award } from 'lucide-react'
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
  const user = useStore(s => s.user)
  const request = useCallback((url, opts) => api(token)(url, opts), [token])

  const [exam, setExam] = useState(null)
  const [attempt, setAttempt] = useState(null)
  const [answers, setAnswers] = useState({})
  const [started, setStarted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [resultAnswers, setResultAnswers] = useState(null)
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
      if (!d?.analysis) { toast.error('提交返回数据异常'); setSubmitting(false); return }
      setResult(d)
      setResultAnswers(ansList)
      setSubmitting(false)
    } catch (e) { toast.error(e.message); setSubmitting(false) }
  }

  const cancelExam = async () => {
    if (!confirm('确定取消考试？进度将丢失。')) return
    try {
      await request(`/api/exams/${attempt.id}/cancel`, { method: 'POST' })
      toast.success('考试已取消')
      navigate('/exam')
    } catch (e) { toast.error(e.message) }
  }

  if (loading) {
    return <div className="h-screen max-w-md mx-auto flex items-center justify-center bg-gray-50 text-sm text-gray-400">加载中...</div>
  }
  if (!exam) return null

  if (result?.analysis) {
    const a = result.analysis
    const grade = a.score_pct >= 90 ? 'A' : a.score_pct >= 80 ? 'B' : a.score_pct >= 70 ? 'C' : a.score_pct >= 60 ? 'D' : 'F'
    const pass = a.score_pct >= 60

    const generateCertificate = () => {
      const win = window.open('', '_blank')
      const date = new Date().toLocaleDateString('zh-CN')
      const avatarUrl = user?.avatar || ''
      const userName = user?.nickname || '考生'
      win.document.write(`
        <!DOCTYPE html>
        <html><head><meta charset="utf-8"><title>考试证书</title>
        <style>
          @page { margin: 0 }
          body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
            font-family: 'Georgia', 'Times New Roman', serif;
            background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #f5f3ff 100%); }
          .cert { width: 700px; padding: 50px; background: white; border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.1); text-align: center;
            border: 3px solid #7c3aed; position: relative; margin: 40px auto; }
          .cert::before { content: ''; position: absolute; top: 10px; left: 10px; right: 10px; bottom: 10px;
            border: 1px solid #ddd6fe; border-radius: 14px; pointer-events: none; }
          .avatar { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid #7c3aed; margin-bottom: 15px; }
          .avatar-placeholder { width: 80px; height: 80px; border-radius: 50%; background: #7c3aed; color: white;
            display: inline-flex; align-items: center; justify-content: center; font-size: 28px; font-weight: bold; margin-bottom: 15px; }
          h1 { color: #4c1d95; font-size: 28px; margin: 5px 0; letter-spacing: 4px; }
          .subtitle { color: #7c3aed; font-size: 14px; letter-spacing: 6px; margin-bottom: 25px; }
          .name { font-size: 32px; color: #1f2937; font-weight: bold; margin: 15px 0;
            border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; display: inline-block; }
          .detail { color: #6b7280; font-size: 14px; line-height: 2; }
          .detail strong { color: #4c1d95; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;
            display: flex; justify-content: space-between; font-size: 12px; color: #9ca3af; }
        </style></head><body>
        <div class="cert">
          ${avatarUrl
            ? `<img src="${avatarUrl}" class="avatar" alt="avatar" onerror="this.style.display='none'"/>`
            : `<div class="avatar-placeholder">${userName[0]}</div>`
          }
          <h1>考试证书</h1>
          <p class="subtitle">CERTIFICATE OF COMPLETION</p>
          <div class="name">${userName}</div>
          <div class="detail">
            <p>考试科目: <strong>${exam.title}</strong></p>
            <p>成绩等级: <strong>${grade}</strong></p>
            <p>正确率: <strong>${a.score_pct}%</strong> (${a.correct}/${a.total})</p>
            <p>考试日期: ${date}</p>
          </div>
          <div class="footer">
            <span>AI考试系统</span>
            <span>${date}</span>
            <span>证书编号: ${Date.now().toString(36).toUpperCase()}</span>
          </div>
        </div>
        <script>window.print()</script>
        </body></html>
      `)
      win.document.close()
    }

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
            {pass && (
              <button onClick={generateCertificate}
                className="mt-4 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:shadow-lg transition inline-flex items-center gap-2">
                <Award size={16} /> 下载证书
              </button>
            )}
          </div>

          <h4 className="font-semibold text-sm flex items-center gap-1"><CheckCircle size={16} className="text-purple-500" /> 逐题分析</h4>
          {(exam.questions || []).map((q, qi) => {
            let opts = []
            try { opts = JSON.parse(q.options) } catch {}
            const userAns = resultAnswers?.find(a => a.question_id === q.id)?.selected
            const correct = userAns === q.correct_answer
            return (
              <div key={q.id} className={`bg-white rounded-2xl p-4 shadow-sm border ${correct ? 'border-green-200' : 'border-red-200'}`}>
                <div className="flex items-start gap-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs text-white ${
                    correct ? 'bg-green-500' : 'bg-red-500'
                  }`}>{correct ? '✓' : '✗'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{q.question}</p>
                    <div className="mt-2 space-y-1">
                      {opts.map((opt, oi) => {
                        const isCorrectOpt = oi === q.correct_answer
                        const isUserOpt = oi === userAns
                        let cls = 'border-gray-100 bg-gray-50 text-gray-500'
                        if (isCorrectOpt) cls = 'border-green-300 bg-green-50 text-green-700'
                        if (isUserOpt && !isCorrectOpt) cls = 'border-red-300 bg-red-50 text-red-600'
                        return (
                          <div key={oi} className={`px-3 py-2 rounded-xl text-sm border ${cls}`}>
                            <span className="font-mono mr-2 text-xs">{String.fromCharCode(65+oi)}.</span>
                            {opt}
                            {isCorrectOpt && <CheckCircle size={12} className="inline ml-1 text-green-500" />}
                            {isUserOpt && !isCorrectOpt && <XCircle size={12} className="inline ml-1 text-red-500" />}
                          </div>
                        )
                      })}
                    </div>
                    <p className="mt-2 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                      <span className="font-medium text-gray-700">解析：</span>{q.explanation || '无解析'}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}

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
            {started && <div className="flex items-center gap-2"><span className="text-xs text-gray-500">{Object.keys(answers).length}/{exam.questions?.length || 0}</span><button onClick={cancelExam} className="text-xs text-red-500 hover:text-red-700">取消</button></div>}
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

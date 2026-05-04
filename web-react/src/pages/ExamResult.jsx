import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, XCircle, Award } from 'lucide-react'
import { useStore } from '../store'

export default function ExamResult() {
  const { id } = useParams()
  const navigate = useNavigate()
  const token = useStore(s => s.token)
  const user = useStore(s => s.user)
  const [data, setData] = useState(null)

  useEffect(() => {
    fetch(`/api/exams/attempt/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setData(d.attempt))
      .catch(() => navigate('/exam/history'))
  }, [id])

  if (!data || data.status !== 'completed') return <div className="h-screen max-w-md mx-auto flex items-center justify-center text-sm text-gray-400">加载中...</div>

  const total = data.total || 1
  const scorePct = Math.round(data.score / total * 100)
  const grade = scorePct >= 90 ? 'A' : scorePct >= 80 ? 'B' : scorePct >= 70 ? 'C' : scorePct >= 60 ? 'D' : 'F'
  const pass = scorePct >= 60

  const qMap = {}
  ;(data.exam?.questions || []).forEach(q => { qMap[q.id] = q })
  const ansMap = {}
  ;(data.answers || []).forEach(a => { ansMap[a.question_id] = a })

  const generateCertificate = () => {
    const win = window.open('', '_blank')
    const date = new Date(data.completed_at || data.created_at).toLocaleDateString('zh-CN')
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
          <p>考试科目: <strong>${data.exam?.title || '考试'}</strong></p>
          <p>成绩等级: <strong>${grade}</strong></p>
          <p>正确率: <strong>${scorePct}%</strong> (${data.score}/${total})</p>
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
        <button onClick={() => navigate('/exam/history')} className="p-1"><ArrowLeft size={24} /></button>
        <h2 className="font-semibold">考试回顾</h2>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm text-center border border-gray-100">
          <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center text-3xl font-bold mb-3 ${
            pass ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
          }`}>{grade}</div>
          <h3 className="text-lg font-bold text-gray-900">{pass ? '通过' : '未通过'}</h3>
          <p className="text-gray-500 text-sm mt-1">{data.exam?.title || '考试'}</p>
          <div className="flex justify-center gap-8 mt-4">
            <div><p className="text-2xl font-bold text-purple-600">{scorePct}%</p><p className="text-xs text-gray-400">正确率</p></div>
            <div><p className="text-2xl font-bold text-green-600">{data.score}</p><p className="text-xs text-gray-400">答对</p></div>
            <div><p className="text-2xl font-bold text-gray-600">{total}</p><p className="text-xs text-gray-400">总题</p></div>
          </div>
          {pass && (
            <button onClick={generateCertificate}
              className="mt-4 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:shadow-lg transition inline-flex items-center gap-2">
              <Award size={16} /> 下载证书
            </button>
          )}
        </div>

        <h4 className="font-semibold text-sm flex items-center gap-1"><CheckCircle size={16} className="text-purple-500" /> 逐题分析</h4>
        {data.exam?.questions?.map(q => {
          let opts = []
          try { opts = JSON.parse(q.options) } catch {}
          const ans = ansMap[q.id]
          const userAns = ans?.selected
          const correct = ans?.is_correct
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
                          <span className="font-mono mr-2 text-xs">{String.fromCharCode(65+oi)}.</span>{opt}
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

        <button onClick={() => navigate('/exam/history')}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition">
          返回历史记录
        </button>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, BookCheck, Clock, AlertTriangle, CheckCircle, XCircle, Trophy } from 'lucide-react'
import { useStore } from '../store'

export default function ExamHistory() {
  const navigate = useNavigate()
  const token = useStore(s => s.token)
  const [attempts, setAttempts] = useState([])

  useEffect(() => {
    fetch('/api/exams/history/all', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setAttempts(d.attempts || []))
  }, [])

  const statusIcon = (a) => {
    if (a.status === 'canceled') return <XCircle size={16} className="text-red-500" />
    if (a.score >= a.total * 0.6) return <CheckCircle size={16} className="text-green-500" />
    return <AlertTriangle size={16} className="text-orange-500" />
  }

  const formatDate = (d) => {
    const date = new Date(d)
    return `${date.getMonth()+1}/${date.getDate()} ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-gray-50">
      <header className="px-4 py-3 bg-white border-b flex items-center gap-3">
        <button onClick={() => navigate('/exam')} className="p-1"><ArrowLeft size={24} /></button>
        <h2 className="font-semibold">考试历史</h2>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {attempts.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-gray-400">
            <BookCheck size={48} className="opacity-50" />
            <p className="mt-2 text-sm">暂无考试记录</p>
          </div>
        ) : attempts.map(a => (
          <div key={a.id} onClick={() => a.status === 'completed' && navigate(`/exam/result/${a.id}`)}
            className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 ${a.status === 'completed' ? 'cursor-pointer hover:shadow-md transition' : ''}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">{a.exam?.title || '考试'}</p>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
                  <Clock size={12} />{formatDate(a.started_at)}
                  {a.status === 'completed' && (
                    <span className="flex items-center gap-1">
                      <Trophy size={12} className="text-purple-500" />
                      {a.score}/{a.total} ({a.total > 0 ? Math.round(a.score/a.total*100) : 0}%)
                    </span>
                  )}
                  {a.peeked && <span className="text-red-500 flex items-center gap-1"><AlertTriangle size={12} />切屏</span>}
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                a.status === 'completed' ? 'bg-green-50 text-green-600' :
                a.status === 'canceled' ? 'bg-red-50 text-red-500' :
                'bg-yellow-50 text-yellow-600'
              }`}>
                {a.status === 'completed' ? '已完成' : a.status === 'canceled' ? '已取消' : '进行中'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

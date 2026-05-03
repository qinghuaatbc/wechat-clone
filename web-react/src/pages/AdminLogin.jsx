import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setErr('')
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, pass })
      })
      const data = await res.json()
      if (data.token) {
        localStorage.setItem('admin_token', data.token)
        navigate('/admin/dashboard')
      } else {
        setErr(data.error || '登录失败')
      }
    } catch { setErr('网络错误') }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-6">
      <form onSubmit={handleLogin} className="w-full max-w-sm bg-gray-800 rounded-2xl p-8">
        <h1 className="text-white text-2xl font-bold text-center mb-6">管理后台</h1>
        <input value={user} onChange={e => setUser(e.target.value)} placeholder="用户名" className="w-full p-3 bg-gray-700 text-white rounded-lg mb-3 focus:outline-none" required />
        <input value={pass} onChange={e => setPass(e.target.value)} type="password" placeholder="密码" className="w-full p-3 bg-gray-700 text-white rounded-lg mb-4 focus:outline-none" required />
        {err && <p className="text-red-400 text-sm mb-3">{err}</p>}
        <button className="w-full py-3 bg-wechat-green text-white rounded-lg font-medium">登录</button>
      </form>
    </div>
  )
}

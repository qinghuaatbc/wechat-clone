import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { MessageSquare, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function Login() {
  const [isLogin, setIsLogin] = useState(true)
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const navigate = useNavigate()
  
  const login = useStore(s => s.login)
  const register = useStore(s => s.register)
  const loading = useStore(s => s.loading)

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (isLogin) {
        await login(phone, password)
        toast.success('登录成功')
      } else {
        await register(phone, password, nickname)
        toast.success('注册成功')
      }
      navigate('/')
    } catch (err) {
      console.error('Auth error:', err)
      toast.error(err.response?.data?.error || '操作失败')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white animate-fade-in">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-wechat-green/20 flex items-center justify-center text-wechat-green">
            <MessageSquare size={40} fill="currentColor" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-center mb-8 text-wechat-dark">
          {isLogin ? '登录微信' : '注册微信'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="手机号" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-4 bg-wechat-bg rounded-xl focus:outline-none focus:ring-2 focus:ring-wechat-green/30 transition" required />
          <input type="password" placeholder="密码" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-4 bg-wechat-bg rounded-xl focus:outline-none focus:ring-2 focus:ring-wechat-green/30 transition" required />
          {!isLogin && <input type="text" placeholder="昵称" value={nickname} onChange={e => setNickname(e.target.value)} className="w-full p-4 bg-wechat-bg rounded-xl focus:outline-none focus:ring-2 focus:ring-wechat-green/30 transition" />}
          
          <button disabled={loading} className="w-full p-4 bg-wechat-green text-white rounded-xl font-medium text-lg active:scale-95 transition disabled:opacity-50 flex justify-center items-center">
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? '登录' : '注册')}
          </button>
        </form>

        <button onClick={() => setIsLogin(!isLogin)} className="mt-6 w-full text-center text-wechat-gray text-sm hover:text-wechat-green transition">
          {isLogin ? '没有账号？去注册' : '已有账号？去登录'}
        </button>
      </div>
    </div>
  )
}

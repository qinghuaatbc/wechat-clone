import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
import { useStore } from './store'

const Login = lazy(() => import('./pages/Login'))
const MainLayout = lazy(() => import('./pages/MainLayout'))
const ChatWindow = lazy(() => import('./pages/ChatWindow'))
const GroupChatWindow = lazy(() => import('./pages/GroupChatWindow'))
const TV = lazy(() => import('./pages/TV'))
const CloudDisk = lazy(() => import('./pages/CloudDisk'))
const Library = lazy(() => import('./pages/Library'))
const Music = lazy(() => import('./pages/Music'))
const Album = lazy(() => import('./pages/Album'))
const ExamList = lazy(() => import('./pages/ExamList'))
const ExamTake = lazy(() => import('./pages/ExamTake'))
const ExamHistory = lazy(() => import('./pages/ExamHistory'))
const ExamResult = lazy(() => import('./pages/ExamResult'))
const AdminLogin = lazy(() => import('./pages/AdminLogin'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))

const Loading = () => (
  <div className="flex items-center justify-center h-screen bg-white">
    <div className="w-8 h-8 border-2 border-wechat-green border-t-transparent rounded-full animate-spin" />
  </div>
)

const PrivateRoute = ({ children }) => {
  const token = useStore(s => s.token)
  const fontSize = useStore(s => s.fontSize)

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`
  }, [fontSize])

  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/*" element={
          <PrivateRoute>
            <Suspense fallback={<Loading />}>
              <Routes>
                <Route path="/" element={<MainLayout />} />
                <Route path="/chat/:id" element={<ChatWindow />} />
                <Route path="/chat/group/:groupId" element={<GroupChatWindow />} />
                <Route path="/tv" element={<TV />} />
                <Route path="/cloud" element={<CloudDisk />} />
                <Route path="/library" element={<Library />} />
                <Route path="/music" element={<Music />} />
                <Route path="/album" element={<Album />} />
                <Route path="/exam" element={<ExamList />} />
                <Route path="/exam/:id" element={<ExamTake />} />
                <Route path="/exam/history" element={<ExamHistory />} />
                <Route path="/exam/result/:id" element={<ExamResult />} />
              </Routes>
            </Suspense>
          </PrivateRoute>
        } />
      </Routes>
    </Suspense>
  )
}

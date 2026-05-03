import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useStore } from './store'
import Login from './pages/Login'
import MainLayout from './pages/MainLayout'
import ChatWindow from './pages/ChatWindow'
import GroupChatWindow from './pages/GroupChatWindow'
import TV from './pages/TV'
import CloudDisk from './pages/CloudDisk'
import Library from './pages/Library'
import Music from './pages/Music'
import Album from './pages/Album'
import ExamList from './pages/ExamList'
import ExamTake from './pages/ExamTake'
import ExamHistory from './pages/ExamHistory'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'

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
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/*" element={
        <PrivateRoute>
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
          </Routes>
        </PrivateRoute>
      } />
    </Routes>
  )
}

import { Routes, Route, Navigate } from 'react-router-dom'
import { useStore } from './store'
import Login from './pages/Login'
import MainLayout from './pages/MainLayout'
import ChatWindow from './pages/ChatWindow'

const PrivateRoute = ({ children }) => {
  const token = useStore(s => s.token)
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={
        <PrivateRoute>
          <Routes>
            <Route path="/" element={<MainLayout />} />
            <Route path="/chat/:id" element={<ChatWindow />} />
          </Routes>
        </PrivateRoute>
      } />
    </Routes>
  )
}

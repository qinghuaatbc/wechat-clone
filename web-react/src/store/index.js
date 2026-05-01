import { create } from 'zustand'
import axios from 'axios'
import { toast } from 'sonner'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    toast.error(err.response?.data?.error || '网络错误')
    return Promise.reject(err)
  }
)

// Initialize theme
if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.documentElement.classList.add('dark')
} else {
  document.documentElement.classList.remove('dark')
}

export const useStore = create((set, get) => ({
  token: localStorage.getItem('token') || null,
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  friends: [],
  groups: [],
  messages: {},
  unread: {},
  moments: [],
  comments: {},
  ws: null,
  previewImage: null,
  loading: false,
  isDark: document.documentElement.classList.contains('dark'),
  fontSize: parseInt(localStorage.getItem('fontSize') || '16'),

  setToken: (token) => { localStorage.setItem('token', token); set({ token }) },
  setUser: (user) => { localStorage.setItem('user', JSON.stringify(user)); set({ user }) },
  
  login: async (phone, password) => {
    set({ loading: true, friends: [], messages: {}, unread: {} })
    try {
      const res = await api.post('/login', { phone, password })
      const userData = res.data
      userData.id = userData.user_id // Normalize ID for frontend usage
      get().setToken(userData.token)
      get().setUser(userData)
      get().initWebSocket()
      return userData
    } finally { set({ loading: false }) }
  },

  register: async (phone, password, nickname) => {
    set({ loading: true, friends: [], messages: {}, unread: {} })
    try {
      const res = await api.post('/register', { phone, password, nickname })
      const userData = res.data
      userData.id = userData.user_id
      get().setToken(userData.token)
      get().setUser(userData)
      get().initWebSocket()
      return userData
    } finally { set({ loading: false }) }
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ token: null, user: null, friends: [], messages: {}, unread: {} })
  },

  fetchFriends: async () => {
    try {
      const res = await api.get('/friends', { headers: { Authorization: `Bearer ${get().token}` } })
      set({ friends: res.data.friends || [] })
    } catch (e) { set({ friends: [] }) }
  },

  fetchGroups: async () => {
    try {
      const res = await api.get('/groups', { headers: { Authorization: `Bearer ${get().token}` } })
      set({ groups: res.data.groups || [] })
    } catch (e) { set({ groups: [] }) }
  },

  fetchMoments: async () => {
    try {
      const res = await api.get('/moments', { headers: { Authorization: `Bearer ${get().token}` } })
      set({ moments: res.data.moments || [] })
    } catch (e) { set({ moments: [] }) }
  },

  fetchComments: async (momentId) => {
    try {
      const res = await api.get(`/moments/${momentId}/comments`, { headers: { Authorization: `Bearer ${get().token}` } })
      set(state => ({ comments: { ...state.comments, [momentId]: res.data.comments || [] } }))
    } catch (e) {}
  },

  postMoment: async (content, images = '') => {
    set({ loading: true })
    try {
      await api.post('/moments', { content, images }, { headers: { Authorization: `Bearer ${get().token}` } })
      get().fetchMoments()
      toast.success('发布成功')
    } finally { set({ loading: false }) }
  },

  addFriend: async (wxid) => {
    set({ loading: true })
    try {
      await api.post('/friends/add', { wxid }, { headers: { Authorization: `Bearer ${get().token}` } })
      get().fetchFriends()
      toast.success('好友已添加')
    } finally { set({ loading: false }) }
  },

  searchUser: async (keyword) => {
    try {
      const res = await api.post('/users/search', { keyword }, { headers: { Authorization: `Bearer ${get().token}` } })
      return res.data.users || []
    } catch (e) { return [] }
  },

  loadMessages: async (conversationId) => {
    if (get().messages[conversationId]) return
    set({ loading: true })
    try {
      const res = await api.get(`/messages?target_id=${conversationId}`, { headers: { Authorization: `Bearer ${get().token}` } })
      set(state => ({ 
        messages: { ...state.messages, [conversationId]: res.data.messages || [] }, 
        unread: { ...state.unread, [conversationId]: 0 } 
      }))
    } finally { set({ loading: false }) }
  },

  addMessage: (msg) => {
    const convId = msg.group_id || msg.sender_id === get().user?.id ? msg.receiver_id : msg.sender_id
    set(state => ({
      messages: { ...state.messages, [convId]: [...(state.messages[convId] || []), msg] },
      unread: { ...state.unread, [convId]: (state.unread[convId] || 0) + 1 }
    }))
  },

  clearUnread: (conversationId) => {
    set(state => ({ unread: { ...state.unread, [conversationId]: 0 } }))
  },

  setPreviewImage: (url) => set({ previewImage: url }),

  initWebSocket: () => {
    const { token } = get()
    if (!token) return
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${proto}//${location.host}/ws`)
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data)
      get().addMessage(data)
    }
    ws.onclose = () => setTimeout(() => get().initWebSocket(), 3000)
    set({ ws })
  }
}))

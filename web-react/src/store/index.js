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

const initialLang = localStorage.getItem('lang') || 'zh'

export const useStore = create((set, get) => ({
  token: localStorage.getItem('token') || null,
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  friends: [],
  groups: [],
  allUsers: [],
  groupMembers: {},
  messages: {},
  unread: {},
  moments: [],
  comments: {},
  incomingRequests: [],
  pendingRequestCount: 0,
  recommendUsers: [],
  ws: null,
  previewImage: null,
  loading: false,
  isDark: document.documentElement.classList.contains('dark'),
  fontSize: parseInt(localStorage.getItem('fontSize') || '16'),
  lang: initialLang,

  toggleLang: () => {
    const newLang = get().lang === 'zh' ? 'en' : 'zh'
    localStorage.setItem('lang', newLang)
    set({ lang: newLang })
  },

  toggleDark: () => {
    const isDark = document.documentElement.classList.toggle('dark')
    localStorage.theme = isDark ? 'dark' : 'light'
    set({ isDark: document.documentElement.classList.contains('dark') })
  },

  setFontSize: (size) => {
    localStorage.setItem('fontSize', size)
    set({ fontSize: size })
  },

  updateProfile: async (updates) => {
    set({ loading: true })
    try {
      if (updates.avatarFile) {
        const fd = new FormData()
        fd.append('file', updates.avatarFile)
        const res = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        updates.avatar = res.data.url
      }
      const { avatarFile, ...body } = updates
      await api.put('/profile', body)
      const user = get().user
      get().setUser({ ...user, ...body })
      toast.success('修改成功')
    } finally { set({ loading: false }) }
  },

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
      const res = await api.get('/friends')
      set({ friends: res.data.friends || [] })
    } catch (e) { set({ friends: [] }) }
  },

  fetchGroups: async () => {
    try {
      const res = await api.get('/groups')
      set({ groups: res.data.groups || [] })
    } catch (e) { set({ groups: [] }) }
  },

  fetchAllUsers: async () => {
    try {
      const res = await api.get('/friends/all')
      set({ allUsers: res.data.users || [] })
    } catch (e) { set({ allUsers: [] }) }
  },

  createGroup: async (name, memberIds) => {
    try {
      await api.post('/groups', { name, member_ids: memberIds })
      get().fetchGroups()
    } catch (e) { toast.error('创建群聊失败') }
  },

  fetchGroupMembers: async (groupId) => {
    try {
      const res = await api.get(`/groups/${groupId}/members`)
      set(state => ({ groupMembers: { ...state.groupMembers, [groupId]: res.data.members || [] } }))
    } catch (e) {}
  },

  loadGroupMessages: async (groupId) => {
    if (get().messages[groupId]) return
    set({ loading: true })
    try {
      const res = await api.get(`/messages?group_id=${groupId}`)
      const msgs = (res.data.messages || []).sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      set(state => ({ 
        messages: { ...state.messages, [groupId]: msgs }, 
        unread: { ...state.unread, [groupId]: 0 } 
      }))
    } finally { set({ loading: false }) }
  },

  fetchMoments: async () => {
    try {
      const res = await api.get('/moments')
      set({ moments: res.data.moments || [] })
    } catch (e) { set({ moments: [] }) }
  },

  fetchComments: async (momentId) => {
    try {
      const res = await api.get(`/moments/${momentId}/comments`)
      set(state => ({ comments: { ...state.comments, [momentId]: res.data.comments || [] } }))
    } catch (e) {}
  },

  postMoment: async (content, images = '') => {
    set({ loading: true })
    try {
      await api.post('/moments', { content, images })
      get().fetchMoments()
      toast.success('发布成功')
    } finally { set({ loading: false }) }
  },

  addFriend: async (targetId, message) => {
    set({ loading: true })
    try {
      const res = await api.post('/friends/request', { target_id: targetId, message: message || '你好，我想加你为好友' })
      toast.success(res.data.message === 'request sent' ? '好友请求已发送' : '好友已添加')
    } finally { set({ loading: false }) }
  },

  cancelRequest: async (requestId) => {
    try {
      await api.post(`/friends/requests/${requestId}/reject`)
      toast.success('已取消请求')
    } catch (e) {}
  },

  acceptRequest: async (requestId) => {
    try {
      await api.post(`/friends/requests/${requestId}/accept`)
      toast.success('好友已添加')
      get().fetchFriends()
    } catch (e) {}
  },

  rejectRequest: async (requestId) => {
    try {
      await api.post(`/friends/requests/${requestId}/reject`)
      toast.success('已拒绝')
    } catch (e) {}
  },

  fetchFriendRequests: async () => {
    try {
      const res = await api.get('/friends/requests?direction=incoming')
      set({ incomingRequests: res.data.requests || [], pendingRequestCount: res.data.count || 0 })
    } catch (e) { set({ incomingRequests: [], pendingRequestCount: 0 }) }
  },

  fetchRecommend: async () => {
    try {
      const res = await api.get('/friends/recommend')
      set({ recommendUsers: res.data.users || [] })
    } catch (e) { set({ recommendUsers: [] }) }
  },

  updateVerifySetting: async (needVerification) => {
    try {
      await api.put('/friends/verify-setting', { need_verification: needVerification })
      const user = get().user
      get().setUser({ ...user, need_verification: needVerification })
      toast.success('设置已更新')
    } catch (e) {}
  },

  searchUser: async (keyword) => {
    try {
      const res = await api.post('/users/search', { keyword })
      return res.data.users || []
    } catch (e) { return [] }
  },

  loadMessages: async (conversationId) => {
    if (get().messages[conversationId]) return
    set({ loading: true })
    try {
      const res = await api.get(`/messages?target_id=${conversationId}`)
      const msgs = (res.data.messages || []).sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      set(state => ({ 
        messages: { ...state.messages, [conversationId]: msgs }, 
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

  deleteMessage: (convId, msgId) => {
    set(state => {
      const msgs = state.messages[convId] || []
      return {
        messages: { ...state.messages, [convId]: msgs.filter(m => m.id !== msgId) }
      }
    })
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

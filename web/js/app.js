const API = '/api';
let token = localStorage.getItem('token');
let currentUser = JSON.parse(localStorage.getItem('user') || 'null');
let ws = null;
let currentChat = null;
let currentChatType = 'private';

// Auth
document.addEventListener('DOMContentLoaded', () => {
  setupAuthTabs();
  setupLogin();
  setupRegister();
  setupNav();
  setupMsgInput();

  if (token) {
    showMainScreen();
  }
});

function setupAuthTabs() {
  document.querySelectorAll('.auth-tabs .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.auth-tabs .tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      if (tab.dataset.tab === 'login') {
        document.getElementById('login-form').classList.remove('hidden');
        document.getElementById('register-form').classList.add('hidden');
      } else {
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('register-form').classList.remove('hidden');
      }
    });
  });
}

function setupLogin() {
  document.getElementById('login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const phone = document.getElementById('login-phone').value;
    const password = document.getElementById('login-password').value;
    const res = await fetch(API + '/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password })
    });
    const data = await res.json();
    if (data.token) {
      token = data.token;
      currentUser = data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(data));
      showMainScreen();
    } else {
      alert(data.error);
    }
  });
}

function setupRegister() {
  document.getElementById('register-form').addEventListener('submit', async e => {
    e.preventDefault();
    const phone = document.getElementById('reg-phone').value;
    const password = document.getElementById('reg-password').value;
    const nickname = document.getElementById('reg-nickname').value;
    const res = await fetch(API + '/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password, nickname })
    });
    const data = await res.json();
    if (data.token) {
      token = data.token;
      currentUser = data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(data));
      showMainScreen();
    } else {
      alert(data.error);
    }
  });
}

function showMainScreen() {
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('main-screen').classList.remove('hidden');
  loadFriends();
  loadMoments();
  loadProfile();
  connectWS();
}

function logout() {
  token = null;
  currentUser = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  document.getElementById('main-screen').classList.add('hidden');
  document.getElementById('auth-screen').classList.remove('hidden');
  if (ws) ws.close();
}

// WS
function connectWS() {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws = new WebSocket(`${proto}//${location.host}/ws`);
  ws.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if (currentChat && data.sender_id === currentChat.id) {
      appendMessage(data.content, false);
    }
  };
}

// Nav
function setupNav() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      document.getElementById(item.dataset.tab).classList.add('active');
    });
  });
}

// API helper
async function api(path, opts = {}) {
  opts.headers = { ...opts.headers, 'Authorization': `Bearer ${token}` };
  const res = await fetch(API + path, opts);
  return res.json();
}

// Friends
async function loadFriends() {
  const data = await api('/friends');
  const list = document.getElementById('friends-list');
  list.innerHTML = '';
  (data.friends || []).forEach(f => {
    list.innerHTML += `<div class="list-item" onclick="openChat('${f.id}', '${f.nickname}')">
      <div class="avatar">${f.nickname?.[0] || '?'}</div>
      <div class="item-info">
        <div class="item-name">${f.nickname}</div>
        <div class="item-desc">${f.online ? '在线' : '离线'}</div>
      </div>
    </div>`;
  });
}

// Search
function showSearchUser() {
  document.getElementById('modal-body').innerHTML = `
    <input type="text" id="search-input" placeholder="输入微信号或昵称">
    <button class="btn-primary" onclick="searchUser()">搜索</button>
    <div id="search-results"></div>`;
  document.getElementById('modal').classList.remove('hidden');
}

async function searchUser() {
  const keyword = document.getElementById('search-input').value;
  const data = await api('/users/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keyword })
  });
  const results = document.getElementById('search-results');
  results.innerHTML = '';
  (data.users || []).forEach(u => {
    results.innerHTML += `<div class="list-item" onclick="addFriend('${u.id}')">
      <div class="avatar">${u.nickname?.[0] || '?'}</div>
      <div class="item-info">
        <div class="item-name">${u.nickname}</div>
        <div class="item-desc">${u.wxid}</div>
      </div>
      <button class="btn-primary" style="width:auto;padding:8px 16px;font-size:14px;">添加</button>
    </div>`;
  });
}

async function addFriend(targetId) {
  await api('/friends/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target_id: targetId })
  });
  alert('添加成功');
  closeModal();
  loadFriends();
}

// Chat
function openChat(id, name) {
  currentChat = { id, name };
  currentChatType = 'private';
  document.getElementById('chat-title').textContent = name;
  document.getElementById('main-screen').classList.add('hidden');
  document.getElementById('chat-window').classList.remove('hidden');
  document.getElementById('messages').innerHTML = '';
  loadMessages(id);
}

function showAddChat() {
  showSearchUser();
}

async function loadMessages(targetId) {
  const data = await api(`/messages?target_id=${targetId}`);
  (data.messages || []).reverse().forEach(m => {
    appendMessage(m.content, m.sender_id === currentUser.user_id);
  });
}

function appendMessage(content, sent) {
  const div = document.createElement('div');
  div.className = `msg ${sent ? 'sent' : 'received'}`;
  div.innerHTML = `<div class="msg-bubble">${content}</div>`;
  document.getElementById('messages').appendChild(div);
  div.scrollIntoView();
}

function setupMsgInput() {
  document.getElementById('msg-input').addEventListener('keypress', e => {
    if (e.key === 'Enter') sendMessage();
  });
}

async function sendMessage() {
  const input = document.getElementById('msg-input');
  const content = input.value.trim();
  if (!content || !currentChat) return;
  input.value = '';

  await api('/messages/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ receiver_id: currentChat.id, content, type: 1 })
  });

  appendMessage(content, true);
}

function closeChat() {
  currentChat = null;
  document.getElementById('chat-window').classList.add('hidden');
  document.getElementById('main-screen').classList.remove('hidden');
}

// Moments
async function loadMoments() {
  const data = await api('/moments');
  const list = document.getElementById('moments-list');
  list.innerHTML = '';
  (data.moments || []).forEach(m => {
    list.innerHTML += `<div class="moment-item">
      <div class="moment-header">
        <div class="avatar">${m.nickname?.[0] || '?'}</div>
        <div style="margin-left:12px"><b>${m.nickname}</b><br><small style="color:#999">${new Date(m.created_at).toLocaleString()}</small></div>
      </div>
      <div class="moment-content">${m.content}</div>
      <div class="moment-actions">
        <button class="${m.is_liked ? 'liked' : ''}" onclick="toggleLike(${m.id})">${m.is_liked ? '❤️' : '🤍'} ${m.likes}</button>
        <button onclick="showComment(${m.id})">💬 ${m.comments}</button>
      </div>
    </div>`;
  });
}

async function toggleLike(id) {
  const action = event.target.classList.contains('liked') ? '/unlike' : '/like';
  await api('/moments' + action, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ moment_id: id })
  });
  loadMoments();
}

function showComment(momentId) {
  document.getElementById('modal-body').innerHTML = `
    <textarea id="comment-input" placeholder="写评论..."></textarea>
    <button class="btn-primary" onclick="postComment(${momentId})">评论</button>`;
  document.getElementById('modal').classList.remove('hidden');
}

async function postComment(momentId) {
  const content = document.getElementById('comment-input').value;
  if (!content) return;
  await api('/moments/comment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ moment_id: momentId, content })
  });
  closeModal();
  loadMoments();
}

function showPostMoment() {
  document.getElementById('modal-body').innerHTML = `
    <textarea id="moment-input" placeholder="分享新鲜事..." rows="4"></textarea>
    <button class="btn-primary" onclick="postMoment()">发表</button>`;
  document.getElementById('modal').classList.remove('hidden');
}

async function postMoment() {
  const content = document.getElementById('moment-input').value;
  if (!content) return;
  await api('/moments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content })
  });
  closeModal();
  loadMoments();
}

// Profile
async function loadProfile() {
  const data = await api('/profile');
  document.getElementById('profile-card').innerHTML = `
    <div class="avatar">${data.nickname?.[0] || '?'}</div>
    <h3>${data.nickname}</h3>
    <p>微信号: ${data.wxid}</p>
    <p>${data.signature || '这个人很懒，什么都没写'}</p>`;
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
}

# WeChat Clone

仿微信应用 — Go + PostgreSQL + Redis + WebSocket

## 功能

- 用户注册/登录（JWT认证）
- 好友管理（搜索、添加、删除）
- 实时聊天（WebSocket）
- 群聊（创建、成员管理）
- 朋友圈（发布、点赞、评论）
- 个人资料管理

## 技术栈

| 组件 | 技术 |
|------|------|
| 后端 | Go + Gin |
| 数据库 | PostgreSQL 16 |
| 缓存 | Redis 7 |
| 实时通信 | WebSocket (gorilla/websocket) |
| 认证 | JWT (golang-jwt) |
| ORM | GORM |
| 前端 | 原生 HTML/CSS/JS |

## 快速启动

```bash
# 1. 启动 PostgreSQL 和 Redis
docker-compose up -d

# 2. 复制并配置环境变量
cp .env.example .env

# 3. 安装依赖
go mod tidy

# 4. 运行服务
go run cmd/server/main.go
```

服务启动后访问: http://localhost:8080

## API 接口

### 认证
- `POST /api/register` — 注册
- `POST /api/login` — 登录

### 用户
- `GET /api/profile` — 获取资料
- `PUT /api/profile` — 更新资料

### 好友
- `GET /api/friends` — 好友列表
- `POST /api/friends/add` — 添加好友
- `POST /api/friends/delete` — 删除好友
- `POST /api/users/search` — 搜索用户

### 消息
- `POST /api/messages/send` — 发送消息
- `GET /api/messages?target_id=xxx` — 聊天记录

### 群聊
- `POST /api/groups` — 创建群聊
- `GET /api/groups` — 我的群聊
- `GET /api/groups/:id/members` — 群成员

### 朋友圈
- `POST /api/moments` — 发布动态
- `GET /api/moments` — 朋友圈
- `POST /api/moments/like` — 点赞
- `POST /api/moments/comment` — 评论

### WebSocket
- `GET /ws` — 实时消息推送

## 数据库表

| 表名 | 说明 |
|------|------|
| users | 用户表 |
| friendships | 好友关系表 |
| messages | 消息表 |
| groups | 群聊表 |
| group_members | 群成员表 |
| moments | 朋友圈动态表 |
| moment_comments | 评论表 |
| moment_likes | 点赞表 |

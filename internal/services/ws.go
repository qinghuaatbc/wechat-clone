package services

import (
	"encoding/json"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 1024 * 1024 // 1MB
)

type Client struct {
	hub        *WSHub
	conn       *websocket.Conn
	send       chan []byte
	id         string
	onMessage  func(map[string]interface{})
}

type WSHub struct {
	clients  map[string]*Client
	groups   map[string]map[string]bool
	mu       sync.RWMutex
	upgrader websocket.Upgrader
}

func NewWSHub() *WSHub {
	return &WSHub{
		clients: make(map[string]*Client),
		groups:  make(map[string]map[string]bool),
		upgrader: websocket.Upgrader{
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
			CheckOrigin: func(r *http.Request) bool {
				return true
			},
		},
	}
}

func (h *WSHub) Serve(userID string, w http.ResponseWriter, r *http.Request, onMessage func(map[string]interface{})) {
	conn, err := h.upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}

	client := &Client{
		hub:       h,
		conn:      conn,
		send:      make(chan []byte, 256),
		id:        userID,
		onMessage: onMessage,
	}

	h.mu.Lock()
	// If user already connected, close old connection (single device for simplicity)
	if old, exists := h.clients[userID]; exists {
		// Remove from all groups
		for gid, members := range h.groups {
			delete(members, userID)
			if len(members) == 0 {
				delete(h.groups, gid)
			}
		}
		delete(h.clients, userID)
		close(old.send)
	}
	h.clients[userID] = client
	h.mu.Unlock()

	go client.writePump()
	go client.readPump()
}

func (h *WSHub) SendToUser(userID string, data interface{}) {
	h.mu.RLock()
	client, ok := h.clients[userID]
	h.mu.RUnlock()

	if !ok {
		return
	}

	msg, _ := json.Marshal(data)
	select {
	case client.send <- msg:
	default:
		h.mu.Lock()
		close(client.send)
		delete(h.clients, userID)
		h.mu.Unlock()
	}
}

func (h *WSHub) JoinGroup(groupID string, userID string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if h.groups[groupID] == nil {
		h.groups[groupID] = make(map[string]bool)
	}
	h.groups[groupID][userID] = true
}

func (h *WSHub) LeaveGroup(groupID string, userID string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if conns, ok := h.groups[groupID]; ok {
		delete(conns, userID)
		if len(conns) == 0 {
			delete(h.groups, groupID)
		}
	}
}

func (h *WSHub) BroadcastToGroup(groupID string, data interface{}) {
	h.mu.RLock()
	members, ok := h.groups[groupID]
	h.mu.RUnlock()

	if !ok {
		return
	}

	msg, _ := json.Marshal(data)
	for userID := range members {
		h.SendToUser(userID, msg)
	}
}

func (c *Client) readPump() {
	defer func() {
		c.hub.mu.Lock()
		if c.hub.clients[c.id] == c {
			delete(c.hub.clients, c.id)
		}
		c.hub.mu.Unlock()
		c.conn.Close()
	}()

	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure) {
				// log.Printf("error: %v", err)
			}
			break
		}

		// Handle client messages (e.g. ack, status updates)
		var msg map[string]interface{}
		if err := json.Unmarshal(message, &msg); err == nil {
			if c.onMessage != nil {
				c.onMessage(msg)
			}
		}
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// Optimization: send queued messages in one batch
			n := len(c.send)
			for i := 0; i < n; i++ {
				w.Write([]byte{'\n'})
				w.Write(<-c.send)
			}

			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

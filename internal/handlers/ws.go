package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/qinghua/wechat-clone/internal/services"
)

type WSHandler struct {
	Hub     *services.WSHub
	MsgHdlr *MessageHandler
}

func NewWSHandler(hub *services.WSHub, msgHdlr *MessageHandler) *WSHandler {
	return &WSHandler{Hub: hub, MsgHdlr: msgHdlr}
}

func (h *WSHandler) HandleConnection(c *gin.Context) {
	userID := c.GetString("user_id_str")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	// Wrap writer to intercept close if needed, but Serve is fire and forget
	// We need to pass a custom reader/wrapper to handle group logic if we want it in the readPump
	// For now, we'll handle group logic via a separate endpoint or let the client send a message that the server parses.
	// To keep it simple, we will expose methods on Hub and call them from here if we can intercept messages.
	// But Serve() runs its own readPump.
	// Let's modify Serve to accept a callback for messages or handle it differently.
	
	// Easier way: Client sends JSON like {"action": "join_group", "group_id": "xxx"}
	// We need to inject this into the readPump loop.
	
	h.Hub.Serve(userID, c.Writer, c.Request, func(msg map[string]interface{}) {
		if action, ok := msg["action"].(string); ok {
			switch action {
			case "join_group":
				if gid, ok := msg["group_id"].(string); ok {
					h.Hub.JoinGroup(gid, userID)
				}
			case "leave_group":
				if gid, ok := msg["group_id"].(string); ok {
					h.Hub.LeaveGroup(gid, userID)
				}
			}
		}
	})
}

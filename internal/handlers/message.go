package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/qinghua/wechat-clone/internal/models"
	"github.com/qinghua/wechat-clone/internal/services"
	"gorm.io/gorm"
)

type MessageHandler struct {
	DB    *gorm.DB
	Redis *services.RedisService
	Hub   *services.WSHub
}

func NewMessageHandler(db *gorm.DB, redis *services.RedisService, hub *services.WSHub) *MessageHandler {
	return &MessageHandler{DB: db, Redis: redis, Hub: hub}
}

type MsgInfo struct {
	ID           uint      `json:"id"`
	SenderID     uuid.UUID `json:"sender_id"`
	ReceiverID   *uuid.UUID `json:"receiver_id,omitempty"`
	GroupID      *uuid.UUID `json:"group_id,omitempty"`
	Type         int       `json:"type"`
	Content      string    `json:"content"`
	FileName     string    `json:"file_name"`
	FileSize     int64     `json:"file_size"`
	QuoteContent string    `json:"quote_content"`
	IsRecalled   bool      `json:"is_recalled"`
	Status       int       `json:"status"`
	CreatedAt    string    `json:"created_at"`
}

func toMsgInfo(m models.Message) MsgInfo {
	return MsgInfo{
		ID:           m.ID,
		SenderID:     m.SenderID,
		ReceiverID:   m.ReceiverID,
		GroupID:      m.GroupID,
		Type:         m.Type,
		Content:      m.Content,
		FileName:     m.FileName,
		FileSize:     m.FileSize,
		QuoteContent: m.QuoteContent,
		IsRecalled:   m.IsRecalled,
		Status:       m.Status,
		CreatedAt:    m.CreatedAt.Format(time.RFC3339),
	}
}

type SendMsgReq struct {
	ReceiverID   uuid.UUID `json:"receiver_id"`
	GroupID      uuid.UUID `json:"group_id"`
	Type         int       `json:"type"`
	Content      string    `json:"content" binding:"required"`
	QuoteContent string    `json:"quote_content"`
	QuoteMsgID   uint      `json:"quote_msg_id"`
	FileName     string    `json:"file_name"`
	FileSize     int64     `json:"file_size"`
}

func (h *MessageHandler) SendMessage(c *gin.Context) {
	userID := getUserID(c)
	var req SendMsgReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	msg := models.Message{
		SenderID:     userID,
		Type:         req.Type,
		Content:      req.Content,
		QuoteContent: req.QuoteContent,
		FileName:     req.FileName,
		FileSize:     req.FileSize,
		Status:       1,
	}

	if req.GroupID != uuid.Nil {
		msg.GroupID = &req.GroupID
	} else if req.ReceiverID == uuid.Nil || req.ReceiverID.String() == FILE_HELPER_ID {
		// Self message (File Helper)
		msg.ReceiverID = &userID
	} else {
		msg.ReceiverID = &req.ReceiverID
	}

	if err := h.DB.Create(&msg).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "send failed"})
		return
	}

	msgData := gin.H{
		"id":           msg.ID,
		"sender_id":    msg.SenderID,
		"receiver_id":  msg.ReceiverID,
		"group_id":     msg.GroupID,
		"type":         msg.Type,
		"content":      msg.Content,
		"file_name":    msg.FileName,
		"file_size":    msg.FileSize,
		"quote_content": msg.QuoteContent,
		"is_recalled":  msg.IsRecalled,
		"created_at":   msg.CreatedAt,
	}

	if msg.GroupID != nil {
		h.Hub.BroadcastToGroup(msg.GroupID.String(), msgData)
		h.Hub.SendToUser(userID.String(), msgData)
	}

	c.JSON(http.StatusOK, gin.H{"message": "sent", "id": msg.ID})
}

func (h *MessageHandler) GetHistory(c *gin.Context) {
	userID := getUserID(c)
	target := c.Query("target_id")
	group := c.Query("group_id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "50"))
	if page < 1 {
		page = 1
	}

	var query *gorm.DB
	if group != "" {
		query = h.DB.Where("group_id = ?", group)
	} else {
		query = h.DB.Where(
			"(sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)",
			userID, target, target, userID,
		)
	}

	var msgs []models.Message
	query.Order("created_at DESC").Limit(pageSize).Offset((page - 1) * pageSize).Find(&msgs)

	msgInfos := make([]MsgInfo, len(msgs))
	for i, m := range msgs {
		msgInfos[i] = toMsgInfo(m)
	}

	c.JSON(http.StatusOK, gin.H{"messages": msgInfos})
}

func (h *MessageHandler) RecallMessage(c *gin.Context) {
	userID := getUserID(c)
	var req struct {
		MsgID uint `json:"msg_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var msg models.Message
	if err := h.DB.First(&msg, req.MsgID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "message not found"})
		return
	}

	if msg.SenderID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "unauthorized"})
		return
	}

	// Only allow recall within 2 minutes
	if time.Since(msg.CreatedAt) > 2*time.Minute {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cannot recall after 2 minutes"})
		return
	}

	h.DB.Model(&msg).Update("is_recalled", true)
	
	// Notify receiver
	targetID := ""
	if msg.ReceiverID != nil {
		targetID = msg.ReceiverID.String()
	} else if msg.GroupID != nil {
		targetID = msg.GroupID.String()
		h.Hub.BroadcastToGroup(msg.GroupID.String(), map[string]interface{}{
			"type": "message_recalled",
			"id":   msg.ID,
		})
	}

	if targetID != "" && msg.GroupID == nil {
		h.Hub.SendToUser(targetID, map[string]interface{}{
			"type": "message_recalled",
			"id":   msg.ID,
		})
	}

	c.JSON(http.StatusOK, gin.H{"message": "recalled"})
}

func (h *MessageHandler) DeleteMessage(c *gin.Context) {
	userID := getUserID(c)
	msgID := c.Param("id")

	var msg models.Message
	if err := h.DB.First(&msg, msgID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "message not found"})
		return
	}

	if msg.SenderID != userID && (msg.ReceiverID == nil || *msg.ReceiverID != userID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "unauthorized"})
		return
	}

	h.DB.Delete(&msg)
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

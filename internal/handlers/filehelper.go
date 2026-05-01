package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/qinghua/wechat-clone/internal/models"
)

const FILE_HELPER_ID = "00000000-0000-0000-0000-000000000001"

func (h *MessageHandler) GetFileHelperMessages(c *gin.Context) {
	userID := getUserID(c)
	
	// For file helper, we query messages where both sender and receiver are the current user
	// Or where receiver is null/FILE_HELPER
	// Simplified: Let's assume frontend sends with receiver_id == sender_id
	// But actually, we can just query messages for this user that are marked as 'file_helper'
	// Or simpler: just query all messages where sender_id = user AND receiver_id = user
	
	var msgs []models.Message
	h.DB.Where("sender_id = ? AND receiver_id = ?", userID, userID).
		Order("created_at DESC").Limit(50).Find(&msgs)

	c.JSON(http.StatusOK, gin.H{"messages": msgs})
}

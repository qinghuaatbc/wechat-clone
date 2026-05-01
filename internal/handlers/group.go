package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/qinghua/wechat-clone/internal/models"
	"github.com/qinghua/wechat-clone/internal/services"
	"gorm.io/gorm"
)

type GroupHandler struct {
	DB    *gorm.DB
	Redis *services.RedisService
	Hub   *services.WSHub
}

func NewGroupHandler(db *gorm.DB, redis *services.RedisService, hub *services.WSHub) *GroupHandler {
	return &GroupHandler{DB: db, Redis: redis, Hub: hub}
}

type CreateGroupReq struct {
	Name    string      `json:"name" binding:"required"`
	Members []uuid.UUID `json:"members"`
}

func (h *GroupHandler) CreateGroup(c *gin.Context) {
	userID := getUserID(c)
	var req CreateGroupReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	group := models.Group{
		Name:    req.Name,
		OwnerID: userID,
	}
	h.DB.Create(&group)

	h.DB.Create(&models.GroupMember{GroupID: group.ID, UserID: userID, Role: 1})

	for _, m := range req.Members {
		h.DB.Create(&models.GroupMember{GroupID: group.ID, UserID: m, Role: 0})
	}

	c.JSON(http.StatusOK, gin.H{"group_id": group.ID, "message": "group created"})
}

func (h *GroupHandler) GetGroups(c *gin.Context) {
	userID := getUserID(c)

	var groups []models.Group
	h.DB.Joins("JOIN group_members ON group_members.group_id = groups.id").
		Where("group_members.user_id = ?", userID).
		Find(&groups)

	c.JSON(http.StatusOK, gin.H{"groups": groups})
}

type GroupMemberInfo struct {
	ID       uuid.UUID `json:"id"`
	Nickname string    `json:"nickname"`
	Avatar   string    `json:"avatar"`
	Role     int       `json:"role"`
	Alias    string    `json:"alias"`
}

func (h *GroupHandler) GetMembers(c *gin.Context) {
	groupID := c.Param("id")

	var members []GroupMemberInfo
	h.DB.Table("users").
		Select("users.id, users.nickname, users.avatar, group_members.role, group_members.alias").
		Joins("JOIN group_members ON group_members.user_id = users.id").
		Where("group_members.group_id = ?", groupID).
		Find(&members)

	c.JSON(http.StatusOK, gin.H{"members": members})
}

type AddMemberReq struct {
	UserIDs []uuid.UUID `json:"user_ids" binding:"required"`
}

func (h *GroupHandler) AddMembers(c *gin.Context) {
	groupID := c.Param("id")
	gid, _ := uuid.Parse(groupID)
	var req AddMemberReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	for _, uid := range req.UserIDs {
		h.DB.FirstOrCreate(&models.GroupMember{}, models.GroupMember{GroupID: gid, UserID: uid})
	}

	c.JSON(http.StatusOK, gin.H{"message": "members added"})
}

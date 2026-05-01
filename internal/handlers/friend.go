package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/qinghua/wechat-clone/internal/models"
	"github.com/qinghua/wechat-clone/internal/services"
	"gorm.io/gorm"
)

type FriendHandler struct {
	DB    *gorm.DB
	Redis *services.RedisService
	Hub   *services.WSHub
}

func NewFriendHandler(db *gorm.DB, redis *services.RedisService, hub *services.WSHub) *FriendHandler {
	return &FriendHandler{DB: db, Redis: redis, Hub: hub}
}

type AddFriendReq struct {
	Wxid string `json:"wxid" binding:"required"`
}

func (h *FriendHandler) AddFriend(c *gin.Context) {
	userID := getUserID(c)
	var req AddFriendReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var friend models.User
	if err := h.DB.Where("wxid = ?", req.Wxid).First(&friend).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	if friend.ID == userID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cannot add yourself"})
		return
	}

	var exists int64
	h.DB.Model(&models.Friendship{}).
		Where("(user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)",
			userID, friend.ID, friend.ID, userID).Count(&exists)
	if exists > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "already friends"})
		return
	}

	h.DB.Create(&models.Friendship{UserID: userID, FriendID: friend.ID, Status: 1})
	h.DB.Create(&models.Friendship{UserID: friend.ID, FriendID: userID, Status: 1})

	c.JSON(http.StatusOK, gin.H{"message": "friend added"})
}

type FriendInfo struct {
	ID       uuid.UUID `json:"id"`
	Wxid     string    `json:"wxid"`
	Nickname string    `json:"nickname"`
	Avatar   string    `json:"avatar"`
	Remark   string    `json:"remark"`
	Online   bool      `json:"online"`
}

func (h *FriendHandler) GetFriends(c *gin.Context) {
	userID := getUserID(c)

	var friendships []models.Friendship
	h.DB.Where("user_id = ? AND status = ?", userID, 1).Find(&friendships)

	var friends []FriendInfo
	for _, fs := range friendships {
		var u models.User
		h.DB.First(&u, "id = ?", fs.FriendID)
		friends = append(friends, FriendInfo{
			ID:       u.ID,
			Wxid:     u.Wxid,
			Nickname: u.Nickname,
			Avatar:   u.Avatar,
			Remark:   fs.Remark,
			Online:   h.Redis.IsUserOnline(u.ID.String()),
		})
	}

	c.JSON(http.StatusOK, gin.H{"friends": friends})
}

type SearchUserReq struct {
	Keyword string `json:"keyword" binding:"required"`
}

type SearchUserInfo struct {
	ID       uuid.UUID `json:"id"`
	Wxid     string    `json:"wxid"`
	Nickname string    `json:"nickname"`
	Avatar   string    `json:"avatar"`
}

func (h *FriendHandler) SearchUser(c *gin.Context) {
	var req SearchUserReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var users []models.User
	h.DB.Where("wxid LIKE ? OR nickname LIKE ? OR phone LIKE ?", "%"+req.Keyword+"%", "%"+req.Keyword+"%", "%"+req.Keyword+"%").
		Find(&users)

	var results []SearchUserInfo
	for _, u := range users {
		results = append(results, SearchUserInfo{
			ID:       u.ID,
			Wxid:     u.Wxid,
			Nickname: u.Nickname,
			Avatar:   u.Avatar,
		})
	}

	c.JSON(http.StatusOK, gin.H{"users": results})
}

type DeleteFriendReq struct {
	FriendID uuid.UUID `json:"friend_id" binding:"required"`
}

func (h *FriendHandler) DeleteFriend(c *gin.Context) {
	userID := getUserID(c)
	var req DeleteFriendReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	h.DB.Where("(user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)",
		userID, req.FriendID, req.FriendID, userID).Delete(&models.Friendship{})

	c.JSON(http.StatusOK, gin.H{"message": "friend deleted"})
}

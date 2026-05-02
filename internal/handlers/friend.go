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

type SendFriendRequestReq struct {
	TargetID uuid.UUID `json:"target_id" binding:"required"`
	Message  string    `json:"message"`
}

func (h *FriendHandler) SendFriendRequest(c *gin.Context) {
	userID := getUserID(c)
	var req SendFriendRequestReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.TargetID == userID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cannot add yourself"})
		return
	}

	var target models.User
	if err := h.DB.First(&target, "id = ?", req.TargetID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	var exists int64
	h.DB.Model(&models.Friendship{}).
		Where("(user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)",
			userID, target.ID, target.ID, userID).Count(&exists)
	if exists > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "already friends"})
		return
	}

	var pending int64
	h.DB.Model(&models.FriendRequest{}).
		Where("(from_id = ? AND to_id = ? AND status = ?) OR (from_id = ? AND to_id = ? AND status = ?)",
			userID, target.ID, models.RequestPending,
			target.ID, userID, models.RequestPending).Count(&pending)
	if pending > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "request already sent"})
		return
	}

	var friendReq models.FriendRequest
	h.DB.Where("from_id = ? AND to_id = ? AND status = ?", target.ID, userID, models.RequestPending).First(&friendReq)
	if friendReq.ID > 0 {
		h.DB.Model(&friendReq).Update("status", models.RequestAccepted)
		h.DB.Create(&models.Friendship{UserID: userID, FriendID: target.ID, Status: 1})
		h.DB.Create(&models.Friendship{UserID: target.ID, FriendID: userID, Status: 1})
		c.JSON(http.StatusOK, gin.H{"message": "friend added"})
		return
	}

	if !target.NeedVerification {
		h.DB.Create(&models.Friendship{UserID: userID, FriendID: target.ID, Status: 1})
		h.DB.Create(&models.Friendship{UserID: target.ID, FriendID: userID, Status: 1})
		c.JSON(http.StatusOK, gin.H{"message": "friend added"})
		return
	}

	if req.Message == "" {
		req.Message = "你好，我想加你为好友"
	}

	h.DB.Create(&models.FriendRequest{FromID: userID, ToID: target.ID, Message: req.Message, Status: models.RequestPending})
	c.JSON(http.StatusOK, gin.H{"message": "request sent"})
}

type FriendRequestInfo struct {
	ID        uint      `json:"id"`
	FromID    uuid.UUID `json:"from_id"`
	ToID      uuid.UUID `json:"to_id"`
	FromName  string    `json:"from_name"`
	FromWxid  string    `json:"from_wxid"`
	FromAvatar string   `json:"from_avatar"`
	ToName    string    `json:"to_name"`
	Message   string    `json:"message"`
	Status    int       `json:"status"`
	CreatedAt string    `json:"created_at"`
}

func (h *FriendHandler) GetFriendRequests(c *gin.Context) {
	userID := getUserID(c)
	direction := c.DefaultQuery("direction", "incoming")

	var requests []models.FriendRequest
	query := h.DB.Where("status = ?", models.RequestPending)
	if direction == "incoming" {
		query = query.Where("to_id = ?", userID)
	} else {
		query = query.Where("from_id = ?", userID)
	}
	query.Order("created_at DESC").Find(&requests)

	var results []FriendRequestInfo
	for _, req := range requests {
		var fromUser, toUser models.User
		h.DB.First(&fromUser, "id = ?", req.FromID)
		h.DB.First(&toUser, "id = ?", req.ToID)

		results = append(results, FriendRequestInfo{
			ID:         req.ID,
			FromID:     req.FromID,
			ToID:       req.ToID,
			FromName:   fromUser.Nickname,
			FromWxid:   fromUser.Wxid,
			FromAvatar: fromUser.Avatar,
			ToName:     toUser.Nickname,
			Message:    req.Message,
			Status:     req.Status,
			CreatedAt:  req.CreatedAt.Format("2006-01-02 15:04"),
		})
	}

	c.JSON(http.StatusOK, gin.H{"requests": results, "count": len(results)})
}

func (h *FriendHandler) AcceptRequest(c *gin.Context) {
	userID := getUserID(c)
	reqID := c.Param("id")

	var friendReq models.FriendRequest
	if err := h.DB.First(&friendReq, "id = ?", reqID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "request not found"})
		return
	}

	if friendReq.ToID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "unauthorized"})
		return
	}

	h.DB.Model(&friendReq).Update("status", models.RequestAccepted)
	h.DB.Create(&models.Friendship{UserID: userID, FriendID: friendReq.FromID, Status: 1})
	h.DB.Create(&models.Friendship{UserID: friendReq.FromID, FriendID: userID, Status: 1})

	c.JSON(http.StatusOK, gin.H{"message": "friend added"})
}

func (h *FriendHandler) RejectRequest(c *gin.Context) {
	userID := getUserID(c)
	reqID := c.Param("id")

	var friendReq models.FriendRequest
	if err := h.DB.First(&friendReq, "id = ?", reqID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "request not found"})
		return
	}

	if friendReq.ToID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "unauthorized"})
		return
	}

	h.DB.Model(&friendReq).Update("status", models.RequestRejected)
	c.JSON(http.StatusOK, gin.H{"message": "request rejected"})
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
	ID             uuid.UUID `json:"id"`
	Wxid           string    `json:"wxid"`
	Nickname       string    `json:"nickname"`
	Avatar         string    `json:"avatar"`
	Phone          string    `json:"phone"`
	IsFriend       bool      `json:"is_friend"`
	RequestStatus  int       `json:"request_status"`
	RequestID      uint      `json:"request_id"`
}

func (h *FriendHandler) SearchUser(c *gin.Context) {
	userID := getUserID(c)
	var req SearchUserReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var users []models.User
	h.DB.Where("id != ? AND (wxid LIKE ? OR nickname LIKE ? OR phone LIKE ?)",
		userID, "%"+req.Keyword+"%", "%"+req.Keyword+"%", "%"+req.Keyword+"%").
		Find(&users)

	var friendIDs []uuid.UUID
	h.DB.Model(&models.Friendship{}).
		Where("user_id = ? AND status = ?", userID, 1).
		Pluck("friend_id", &friendIDs)
	friendMap := make(map[uuid.UUID]bool)
	for _, id := range friendIDs {
		friendMap[id] = true
	}

	var pendingRequests []models.FriendRequest
	h.DB.Where("(from_id = ? OR to_id = ?) AND status = ?", userID, userID, models.RequestPending).Find(&pendingRequests)
	requestMap := make(map[uuid]int)
	requestIDMap := make(map[uuid]uint)
	for _, r := range pendingRequests {
		if r.FromID == userID {
			requestMap[r.ToID] = r.Status
			requestIDMap[r.ToID] = r.ID
		} else {
			requestMap[r.FromID] = r.Status
			requestIDMap[r.FromID] = r.ID
		}
	}

	var results []SearchUserInfo
	for _, u := range users {
		status := 0
		reqID := uint(0)
		if s, ok := requestMap[u.ID]; ok {
			status = s
			reqID = requestIDMap[u.ID]
		}
		results = append(results, SearchUserInfo{
			ID:            u.ID,
			Wxid:          u.Wxid,
			Nickname:      u.Nickname,
			Avatar:        u.Avatar,
			Phone:         u.Phone,
			IsFriend:      friendMap[u.ID],
			RequestStatus: status,
			RequestID:     reqID,
		})
	}

	c.JSON(http.StatusOK, gin.H{"users": results})
}

func (h *FriendHandler) GetRecommend(c *gin.Context) {
	userID := getUserID(c)

	var friendIDs []uuid.UUID
	h.DB.Model(&models.Friendship{}).
		Where("user_id = ? AND status = ?", userID, 1).
		Pluck("friend_id", &friendIDs)

	var recommends []SearchUserInfo
	if len(friendIDs) > 0 {
		var friendsOfFriends []uuid.UUID
		h.DB.Model(&models.Friendship{}).
			Where("user_id IN ? AND status = ? AND friend_id NOT IN ? AND friend_id != ?",
				friendIDs, 1, append(friendIDs, userID), userID).
			Pluck("friend_id", &friendsOfFriends)

		if len(friendsOfFriends) > 0 {
			var users []models.User
			h.DB.Where("id IN ?", friendsOfFriends).Limit(10).Find(&users)
			for _, u := range users {
				recommends = append(recommends, SearchUserInfo{
					ID:       u.ID,
					Wxid:     u.Wxid,
					Nickname: u.Nickname,
					Avatar:   u.Avatar,
					Phone:    u.Phone,
				})
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"users": recommends})
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

type UpdateVerifySettingReq struct {
	NeedVerification bool `json:"need_verification"`
}

func (h *FriendHandler) UpdateVerifySetting(c *gin.Context) {
	userID := getUserID(c)
	var req UpdateVerifySettingReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	h.DB.Model(&models.User{}).Where("id = ?", userID).Update("need_verification", req.NeedVerification)
	c.JSON(http.StatusOK, gin.H{"message": "setting updated"})
}

package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/qinghua/wechat-clone/internal/models"
	"gorm.io/gorm"
)

type MomentHandler struct {
	DB *gorm.DB
}

func NewMomentHandler(db *gorm.DB) *MomentHandler {
	return &MomentHandler{DB: db}
}

type CreateMomentReq struct {
	Content string `json:"content" binding:"required"`
	Images  string `json:"images"`
}

func (h *MomentHandler) Create(c *gin.Context) {
	userID := getUserID(c)
	var req CreateMomentReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	moment := models.Moment{
		UserID:  userID,
		Content: req.Content,
		Images:  req.Images,
		Visible: 1,
	}
	h.DB.Create(&moment)

	c.JSON(http.StatusOK, gin.H{"moment_id": moment.ID, "message": "published"})
}

type MomentResp struct {
	models.Moment
	Nickname string `json:"nickname"`
	Avatar   string `json:"avatar"`
	Likes    int    `json:"likes"`
	Comments int    `json:"comments"`
	IsLiked  bool   `json:"is_liked"`
}

func (h *MomentHandler) GetFeed(c *gin.Context) {
	userID := getUserID(c)

	var moments []models.Moment
	h.DB.Where("user_id = ? OR user_id IN (SELECT friend_id FROM friendships WHERE user_id = ? AND status = 1)",
		userID, userID).
		Order("created_at DESC").
		Limit(50).
		Find(&moments)

	var resp []MomentResp
	for _, m := range moments {
		var user models.User
		h.DB.First(&user, "id = ?", m.UserID)

		var likeCount, commentCount, isLikedCount int64
		h.DB.Model(&models.MomentLike{}).Where("moment_id = ?", m.ID).Count(&likeCount)
		h.DB.Model(&models.MomentComment{}).Where("moment_id = ?", m.ID).Count(&commentCount)
		h.DB.Model(&models.MomentLike{}).Where("moment_id = ? AND user_id = ?", m.ID, userID).Count(&isLikedCount)

		resp = append(resp, MomentResp{
			Moment:   m,
			Nickname: user.Nickname,
			Avatar:   user.Avatar,
			Likes:    int(likeCount),
			Comments: int(commentCount),
			IsLiked:  isLikedCount > 0,
		})
	}

	c.JSON(http.StatusOK, gin.H{"moments": resp})
}

type MomentActionReq struct {
	MomentID uint `json:"moment_id" binding:"required"`
}

func (h *MomentHandler) Like(c *gin.Context) {
	userID := getUserID(c)
	var req MomentActionReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	h.DB.FirstOrCreate(&models.MomentLike{}, models.MomentLike{MomentID: req.MomentID, UserID: userID})

	c.JSON(http.StatusOK, gin.H{"message": "liked"})
}

func (h *MomentHandler) Unlike(c *gin.Context) {
	userID := getUserID(c)
	var req MomentActionReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	h.DB.Where("moment_id = ? AND user_id = ?", req.MomentID, userID).Delete(&models.MomentLike{})

	c.JSON(http.StatusOK, gin.H{"message": "unliked"})
}

type CommentReq struct {
	MomentID uint   `json:"moment_id" binding:"required"`
	Content  string `json:"content" binding:"required"`
}

func (h *MomentHandler) Comment(c *gin.Context) {
	userID := getUserID(c)
	var req CommentReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	h.DB.Create(&models.MomentComment{
		MomentID: req.MomentID,
		UserID:   userID,
		Content:  req.Content,
	})

	c.JSON(http.StatusOK, gin.H{"message": "commented"})
}

func (h *MomentHandler) GetComments(c *gin.Context) {
	var comments []models.MomentComment
	h.DB.Where("moment_id = ?", c.Param("id")).Order("created_at ASC").Find(&comments)

	c.JSON(http.StatusOK, gin.H{"comments": comments})
}

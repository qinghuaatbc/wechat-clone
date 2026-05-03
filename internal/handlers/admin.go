package handlers

import (
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/qinghua/wechat-clone/internal/models"
	"gorm.io/gorm"
)

const adminUser = "admin"
const adminPass = "admin"

type AdminHandler struct {
	DB *gorm.DB
}

func NewAdminHandler(db *gorm.DB) *AdminHandler {
	return &AdminHandler{DB: db}
}

func adminAuth(c *gin.Context) bool {
	user, pass, hasAuth := c.Request.BasicAuth()
	return hasAuth && user == adminUser && pass == adminPass
}

func (h *AdminHandler) Login(c *gin.Context) {
	var req struct {
		User string `json:"user"`
		Pass string `json:"pass"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid"})
		return
	}
	if req.User == adminUser && req.Pass == adminPass {
		c.JSON(http.StatusOK, gin.H{"token": "admin-token"})
		return
	}
	c.JSON(http.StatusUnauthorized, gin.H{"error": "bad credentials"})
}

func (h *AdminHandler) ListUsers(c *gin.Context) {
	var users []models.User
	h.DB.Order("created_at DESC").Find(&users)
	c.JSON(http.StatusOK, gin.H{"users": users})
}

func (h *AdminHandler) DeleteUser(c *gin.Context) {
	uid := c.Param("id")
	h.DB.Where("id = ?", uid).Delete(&models.User{})
	h.DB.Where("user_id = ? OR friend_id = ?", uid, uid).Delete(&models.Friendship{})
	h.DB.Where("from_id = ? OR to_id = ?", uid, uid).Delete(&models.FriendRequest{})
	h.DB.Where("sender_id = ?", uid).Delete(&models.Message{})
	h.DB.Where("owner_id = ?", uid).Delete(&models.Group{})
	h.DB.Where("user_id = ?", uid).Delete(&models.GroupMember{})
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

func (h *AdminHandler) ListGroups(c *gin.Context) {
	var groups []models.Group
	h.DB.Order("created_at DESC").Find(&groups)

	type GroupRow struct {
		models.Group
		MemberCount int `json:"member_count"`
	}
	var result []GroupRow
	for _, g := range groups {
		var cnt int64
		h.DB.Model(&models.GroupMember{}).Where("group_id = ?", g.ID).Count(&cnt)
		result = append(result, GroupRow{Group: g, MemberCount: int(cnt)})
	}
	c.JSON(http.StatusOK, gin.H{"groups": result})
}

func (h *AdminHandler) DeleteGroup(c *gin.Context) {
	gid := c.Param("id")
	h.DB.Where("group_id = ?", gid).Delete(&models.GroupMember{})
	h.DB.Where("id = ?", gid).Delete(&models.Group{})
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

func (h *AdminHandler) ListHLS(c *gin.Context) {
	var channels []models.HLSChannel
	h.DB.Order("category ASC, name ASC").Find(&channels)
	c.JSON(http.StatusOK, gin.H{"channels": channels})
}

type HLSUpsertReq struct {
	Name     string `json:"name" binding:"required"`
	URL      string `json:"url" binding:"required"`
	Category string `json:"category"`
}

func (h *AdminHandler) CreateHLS(c *gin.Context) {
	var req HLSUpsertReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	cat := req.Category
	if cat == "" {
		cat = "custom"
	}
	ch := models.HLSChannel{Name: req.Name, URL: req.URL, Category: cat}
	if err := h.DB.Create(&ch).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "create failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"channel": ch})
}

func (h *AdminHandler) DeleteHLS(c *gin.Context) {
	h.DB.Where("id = ?", c.Param("id")).Delete(&models.HLSChannel{})
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

func (h *AdminHandler) ListFiles(c *gin.Context) {
	var files []models.CloudFile
	h.DB.Order("created_at DESC").Find(&files)
	c.JSON(http.StatusOK, gin.H{"files": files})
}

func (h *AdminHandler) DeleteFile(c *gin.Context) {
	fid := c.Param("id")
	var cf models.CloudFile
	if err := h.DB.First(&cf, "id = ?", fid).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	if !cf.IsDir && cf.Path != "" {
		os.Remove("." + cf.Path)
	}
	h.DB.Where("parent_id = ?", cf.ID).Delete(&models.CloudFile{})
	h.DB.Delete(&cf)
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

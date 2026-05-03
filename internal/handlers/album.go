package handlers

import (
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/qinghua/wechat-clone/internal/models"
	"gorm.io/gorm"
)

type AlbumHandler struct {
	DB        *gorm.DB
	UploadDir string
}

func NewAlbumHandler(db *gorm.DB) *AlbumHandler {
	dir := "uploads/album"
	os.MkdirAll(dir, 0755)
	return &AlbumHandler{DB: db, UploadDir: dir}
}

func (h *AlbumHandler) ListMyPhotos(c *gin.Context) {
	userID := getUserID(c)
	var photos []models.CloudFile
	h.DB.Where("user_id = ? AND type = ? AND is_dir = ?", userID, "image", false).
		Order("created_at DESC").Find(&photos)
	c.JSON(http.StatusOK, gin.H{"photos": photos})
}

func (h *AlbumHandler) UploadPhoto(c *gin.Context) {
	userID := getUserID(c)
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no file"})
		return
	}
	ext := filepath.Ext(file.Filename)
	extLower := filepath.Ext(file.Filename)
	if extLower != ".jpg" && extLower != ".jpeg" && extLower != ".png" && extLower != ".gif" && extLower != ".webp" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "only image files allowed"})
		return
	}
	filename := uuid.New().String() + "_" + time.Now().Format("150405") + ext
	dest := filepath.Join(h.UploadDir, filename)
	if err := c.SaveUploadedFile(file, dest); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "save failed"})
		return
	}
	photo := models.CloudFile{
		UserID: userID,
		Name:   file.Filename,
		Path:   "/uploads/album/" + filename,
		Type:   "image",
		Size:   file.Size,
		IsDir:  false,
	}
	if err := h.DB.Create(&photo).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "create failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"photo": photo})
}

func (h *AlbumHandler) SharePhoto(c *gin.Context) {
	userID := getUserID(c)
	var req struct {
		PhotoID uuid.UUID `json:"photo_id" binding:"required"`
		UserID  uuid.UUID `json:"user_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var photo models.CloudFile
	if err := h.DB.First(&photo, "id = ? AND user_id = ?", req.PhotoID, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "photo not found"})
		return
	}
	share := models.PhotoShare{
		PhotoID:          req.PhotoID,
		OwnerID:          userID,
		SharedWithUserID: req.UserID,
	}
	if err := h.DB.Create(&share).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "share failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"share": share})
}

func (h *AlbumHandler) GetSharedWithMe(c *gin.Context) {
	userID := getUserID(c)
	var shares []models.PhotoShare
	h.DB.Where("shared_with_user_id = ?", userID).Order("created_at DESC").Find(&shares)

	var results []gin.H
	for _, s := range shares {
		var photo models.CloudFile
		if err := h.DB.First(&photo, "id = ?", s.PhotoID).Error; err != nil {
			continue
		}
		var owner models.User
		h.DB.First(&owner, "id = ?", s.OwnerID)
		results = append(results, gin.H{
			"share_id":   s.ID,
			"photo_id":   photo.ID,
			"name":       photo.Name,
			"path":       photo.Path,
			"owner_id":   s.OwnerID,
			"owner_name": owner.Nickname,
			"created_at": s.CreatedAt,
		})
	}
	c.JSON(http.StatusOK, gin.H{"photos": results})
}

func (h *AlbumHandler) UnsharePhoto(c *gin.Context) {
	shareID := c.Param("id")
	h.DB.Where("id = ?", shareID).Delete(&models.PhotoShare{})
	c.JSON(http.StatusOK, gin.H{"message": "unshared"})
}

func (h *AlbumHandler) DeletePhoto(c *gin.Context) {
	userID := getUserID(c)
	photoID := c.Param("id")
	var photo models.CloudFile
	if err := h.DB.First(&photo, "id = ? AND user_id = ?", photoID, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	if photo.Path != "" {
		os.Remove("." + photo.Path)
	}
	h.DB.Where("photo_id = ?", photo.ID).Delete(&models.PhotoShare{})
	h.DB.Delete(&photo)
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

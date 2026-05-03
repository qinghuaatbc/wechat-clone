package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/qinghua/wechat-clone/internal/models"
	"gorm.io/gorm"
)

type CloudHandler struct {
	DB        *gorm.DB
	UploadDir string
}

func NewCloudHandler(db *gorm.DB) *CloudHandler {
	dir := "uploads/cloud"
	os.MkdirAll(dir, 0755)
	return &CloudHandler{DB: db, UploadDir: dir}
}

type CreateDirReq struct {
	Name     string     `json:"name" binding:"required"`
	ParentID *uuid.UUID `json:"parent_id"`
}

func (h *CloudHandler) CreateDir(c *gin.Context) {
	userID := getUserID(c)
	var req CreateDirReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	dir := models.CloudFile{
		UserID:     userID,
		Name:       req.Name,
		Type:       "dir",
		IsDir:      true,
		ParentID:   req.ParentID,
		Permission: models.PermPrivate,
	}
	if err := h.DB.Create(&dir).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "create dir failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"dir": dir})
}

type UploadCloudReq struct {
	ParentID *uuid.UUID `form:"parent_id"`
}

func (h *CloudHandler) UploadFile(c *gin.Context) {
	userID := getUserID(c)
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no file"})
		return
	}

	ext := filepath.Ext(file.Filename)
	filename := fmt.Sprintf("%s_%d%s", uuid.New().String(), time.Now().Unix(), ext)
	dest := filepath.Join(h.UploadDir, filename)
	if err := c.SaveUploadedFile(file, dest); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "save failed"})
		return
	}

	var parentID *uuid.UUID
	if pid := c.PostForm("parent_id"); pid != "" {
		if parsed, err := uuid.Parse(pid); err == nil {
			parentID = &parsed
		}
	}

	cf := models.CloudFile{
		UserID:   userID,
		Name:     file.Filename,
		Path:     "/uploads/cloud/" + filename,
		Type:     detectCloudFileType(ext),
		Size:     file.Size,
		ParentID: parentID,
		IsDir:    false,
		Permission: models.PermPrivate,
	}
	if err := h.DB.Create(&cf).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "save record failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"file": cf})
}

func detectCloudFileType(ext string) string {
	ext = strings.ToLower(ext)
	switch ext {
	case ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp":
		return "image"
	case ".mp4", ".avi", ".mov", ".mkv", ".webm":
		return "video"
	case ".mp3", ".wav", ".ogg", ".flac":
		return "audio"
	case ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx":
		return "document"
	case ".zip", ".rar", ".7z", ".tar", ".gz":
		return "archive"
	case ".glb", ".gltf", ".obj", ".stl", ".fbx":
		return "3d-model"
	default:
		return "other"
	}
}

func (h *CloudHandler) ListFiles(c *gin.Context) {
	userID := getUserID(c)
	parentID := c.Query("parent_id")
	shareType := c.Query("share")

	var files []models.CloudFile
	query := h.DB.Where("user_id = ?", userID)

	if shareType == "shared" {
		query = h.DB.Where("permission IN ? AND user_id != ?",
			[]int{models.PermPublic, models.PermFriends}, userID)
	} else if parentID != "" {
		query = query.Where("parent_id = ?", parentID)
	} else {
		query = query.Where("parent_id IS NULL")
	}

	query.Order("is_dir DESC, name ASC").Find(&files)
	c.JSON(http.StatusOK, gin.H{"files": files})
}

type ShareFileReq struct {
	FileID     uuid.UUID `json:"file_id" binding:"required"`
	Permission int       `json:"permission"`
	TargetID   string    `json:"target_id"`
}

func (h *CloudHandler) ShareFile(c *gin.Context) {
	userID := getUserID(c)
	var req ShareFileReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var cf models.CloudFile
	if err := h.DB.First(&cf, "id = ? AND user_id = ?", req.FileID, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "file not found"})
		return
	}

	perm := req.Permission
	if perm < models.PermPrivate || perm > models.PermPublic {
		perm = models.PermPrivate
	}
	h.DB.Model(&cf).Update("permission", perm)
	c.JSON(http.StatusOK, gin.H{"message": "shared", "permission": perm})
}

func (h *CloudHandler) GetShared(c *gin.Context) {
	userID := getUserID(c)

	var files []models.CloudFile
	h.DB.Where("(permission = ? OR permission = ?) AND user_id != ?",
		models.PermPublic, models.PermFriends, userID).
		Order("updated_at DESC").
		Limit(50).
		Find(&files)

	var results []gin.H
	for _, f := range files {
		var owner models.User
		h.DB.First(&owner, "id = ?", f.UserID)
		results = append(results, gin.H{
			"id":         f.ID,
			"name":       f.Name,
			"type":       f.Type,
			"size":       f.Size,
			"path":       f.Path,
			"is_dir":     f.IsDir,
			"owner_id":   f.UserID,
			"owner_name": owner.Nickname,
			"created_at": f.CreatedAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{"files": results})
}

func (h *CloudHandler) DeleteFile(c *gin.Context) {
	userID := getUserID(c)
	fileID := c.Param("id")

	var cf models.CloudFile
	if err := h.DB.First(&cf, "id = ? AND user_id = ?", fileID, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "file not found"})
		return
	}

	if !cf.IsDir && cf.Path != "" {
		os.Remove("." + cf.Path)
	}

	h.DB.Where("parent_id = ?", cf.ID).Delete(&models.CloudFile{})
	h.DB.Delete(&cf)
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/qinghua/wechat-clone/internal/models"
	"gorm.io/gorm"
)

type LibraryHandler struct {
	DB        *gorm.DB
	UploadDir string
}

func NewLibraryHandler(db *gorm.DB) *LibraryHandler {
	dir := "uploads/library"
	os.MkdirAll(dir, 0755)
	return &LibraryHandler{DB: db, UploadDir: dir}
}

func (h *LibraryHandler) ListPublic(c *gin.Context) {
	category := c.Query("category")
	search := c.Query("search")

	query := h.DB.Model(&models.LibraryItem{})
	if category != "" {
		query = query.Where("category = ?", category)
	}
	if search != "" {
		query = query.Where("title ILIKE ? OR description ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	var items []models.LibraryItem
	query.Order("created_at DESC").Find(&items)
	c.JSON(http.StatusOK, gin.H{"items": items})
}

func (h *LibraryHandler) GetCategories(c *gin.Context) {
	var cats []struct {
		Category string
		Count    int
	}
	h.DB.Model(&models.LibraryItem{}).
		Select("category, count(*) as count").
		Group("category").
		Order("category ASC").
		Scan(&cats)

	var result []gin.H
	for _, c := range cats {
		result = append(result, gin.H{"category": c.Category, "count": c.Count})
	}
	c.JSON(http.StatusOK, gin.H{"categories": result})
}

func (h *LibraryHandler) Download(c *gin.Context) {
	var item models.LibraryItem
	if err := h.DB.First(&item, "id = ?", c.Param("id")).Error; err != nil {
		c.Status(http.StatusNotFound)
		return
	}
	cleanPath := filepath.Clean("." + item.FilePath)
	if _, err := os.Stat(cleanPath); os.IsNotExist(err) {
		c.Status(http.StatusNotFound)
		return
	}
	if c.Query("preview") == "1" {
		c.File(cleanPath)
		return
	}
	h.DB.Model(&item).UpdateColumn("downloads", gorm.Expr("downloads + 1"))
	c.FileAttachment(cleanPath, item.Title+filepath.Ext(item.FilePath))
}

type LibraryUploadReq struct {
	Title       string `form:"title" binding:"required"`
	Description string `form:"description"`
	Category    string `form:"category" binding:"required"`
}

func (h *LibraryHandler) AdminUpload(c *gin.Context) {
	var req LibraryUploadReq
	if err := c.ShouldBind(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no file"})
		return
	}
	if file.Size > 300*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file too large, max 300MB"})
		return
	}
	ext := filepath.Ext(file.Filename)
	filename := fmt.Sprintf("%s_%d%s", uuid.New().String(), time.Now().Unix(), ext)
	dest := filepath.Join(h.UploadDir, filename)
	if err := c.SaveUploadedFile(file, dest); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "save failed"})
		return
	}
	item := models.LibraryItem{
		Title:       req.Title,
		Description: req.Description,
		Category:    req.Category,
		FilePath:    "/uploads/library/" + filename,
		FileSize:    file.Size,
	}
	if err := h.DB.Create(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "create failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"item": item})
}

func (h *LibraryHandler) AdminUpdate(c *gin.Context) {
	id := c.Param("id")
	var item models.LibraryItem
	if err := h.DB.First(&item, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	var req struct {
		Title       string `json:"title"`
		Description string `json:"description"`
		Category    string `json:"category"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	updates := map[string]interface{}{}
	if req.Title != "" {
		updates["title"] = req.Title
	}
	if req.Category != "" {
		updates["category"] = req.Category
	}
	updates["description"] = req.Description
	h.DB.Model(&item).Updates(updates)
	c.JSON(http.StatusOK, gin.H{"item": item})
}

func (h *LibraryHandler) AdminDelete(c *gin.Context) {
	id := c.Param("id")
	var item models.LibraryItem
	if err := h.DB.First(&item, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	if item.FilePath != "" {
		os.Remove("." + item.FilePath)
	}
	h.DB.Delete(&item)
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

func (h *LibraryHandler) AdminList(c *gin.Context) {
	var items []models.LibraryItem
	h.DB.Order("created_at DESC").Find(&items)
	c.JSON(http.StatusOK, gin.H{"items": items})
}

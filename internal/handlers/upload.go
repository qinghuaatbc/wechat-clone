package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type UploadHandler struct {
	UploadDir string
}

func NewUploadHandler() *UploadHandler {
	dir := "uploads"
	os.MkdirAll(dir, 0755)
	return &UploadHandler{UploadDir: dir}
}

func (h *UploadHandler) UploadFile(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no file uploaded"})
		return
	}

	ext := filepath.Ext(file.Filename)
	filename := fmt.Sprintf("%s_%d%s", uuid.New().String(), time.Now().Unix(), ext)
	dest := filepath.Join(h.UploadDir, filename)

	if err := c.SaveUploadedFile(file, dest); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "save failed"})
		return
	}

	url := "/uploads/" + filename
	c.JSON(http.StatusOK, gin.H{"url": url})
}

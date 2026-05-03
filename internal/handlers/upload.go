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

	if file.Size > 100*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file too large, max 100MB"})
		return
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))
	allowed := map[string]bool{
		".jpg": true, ".jpeg": true, ".png": true, ".gif": true, ".webp": true,
		".mp4": true, ".avi": true, ".mov": true, ".mkv": true, ".webm": true,
		".mp3": true, ".wav": true, ".ogg": true, ".flac": true, ".aac": true,
		".pdf": true, ".doc": true, ".docx": true, ".txt": true, ".csv": true,
		".zip": true, ".rar": true, ".7z": true,
		".glb": true, ".gltf": true, ".obj": true, ".stl": true, ".fbx": true,
	}
	if !allowed[ext] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file type not allowed"})
		return
	}

	filename := fmt.Sprintf("%s_%d%s", uuid.New().String(), time.Now().Unix(), ext)
	dest := filepath.Join(h.UploadDir, filename)

	if err := c.SaveUploadedFile(file, dest); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "save failed"})
		return
	}

	url := "/uploads/" + filename
	fileType := detectFileType(ext)

	c.JSON(http.StatusOK, gin.H{"url": url, "type": fileType, "filename": file.Filename, "size": file.Size})
}

func detectFileType(ext string) string {
	switch ext {
	case ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp":
		return "image"
	case ".mp4", ".avi", ".mov", ".mkv", ".webm", ".flv", ".wmv":
		return "video"
	case ".mp3", ".wav", ".ogg", ".flac", ".aac", ".m4a":
		return "audio"
	case ".glb", ".gltf", ".obj", ".stl", ".fbx":
		return "3d-model"
	case ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".csv":
		return "file"
	case ".zip", ".rar", ".7z":
		return "archive"
	default:
		return "file"
	}
}

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

	ext := filepath.Ext(file.Filename)
	filename := fmt.Sprintf("%s_%d%s", uuid.New().String(), time.Now().Unix(), ext)
	dest := filepath.Join(h.UploadDir, filename)

	if err := c.SaveUploadedFile(file, dest); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "save failed"})
		return
	}

	url := "/uploads/" + filename
	fileType := detectFileType(file.Filename)

	c.JSON(http.StatusOK, gin.H{"url": url, "type": fileType, "filename": file.Filename, "size": file.Size})
}

func detectFileType(filename string) string {
	ext := strings.ToLower(filepath.Ext(filename))
	
	videoExts := map[string]bool{".mp4": true, ".avi": true, ".mov": true, ".mkv": true, ".webm": true, ".flv": true, ".wmv": true}
	imageExts := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".gif": true, ".webp": true, ".bmp": true}
	audioExts := map[string]bool{".mp3": true, ".wav": true, ".ogg": true, ".flac": true, ".aac": true, ".m4a": true}
	docExts := map[string]bool{".pdf": true, ".doc": true, ".docx": true, ".xls": true, ".xlsx": true, ".ppt": true, ".pptx": true, ".txt": true, ".csv": true, ".zip": true, ".rar": true, ".7z": true}
	model3dExts := map[string]bool{".glb": true, ".gltf": true, ".obj": true, ".stl": true, ".fbx": true}

	if videoExts[ext] {
		return "video"
	}
	if imageExts[ext] {
		return "image"
	}
	if audioExts[ext] {
		return "audio"
	}
	if model3dExts[ext] {
		return "3d-model"
	}
	if docExts[ext] {
		return "file"
	}
	return "file"
}

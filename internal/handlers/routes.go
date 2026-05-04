package handlers

import (
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/qinghua/wechat-clone/internal/middleware"
	"github.com/qinghua/wechat-clone/internal/services"
	"gorm.io/gorm"
)

func serveFile(c *gin.Context, baseDir, relPath string) {
	cleanPath := filepath.Clean(baseDir + relPath)
	if !strings.HasPrefix(cleanPath, filepath.Clean(baseDir)+string(os.PathSeparator)) &&
		cleanPath != filepath.Clean(baseDir) {
		c.Status(http.StatusForbidden)
		return
	}
	data, err := os.ReadFile(cleanPath)
	if err != nil {
		c.Status(http.StatusNotFound)
		return
	}
	ct := "application/octet-stream"
	if ext := filepath.Ext(cleanPath); ext == ".glb" || ext == ".gltf" {
		ct = "model/gltf-binary"
	} else if t := mime.TypeByExtension(ext); t != "" {
		ct = t
	}
	c.Data(http.StatusOK, ct, data)
}

func SetupRoutes(r *gin.Engine, db *gorm.DB, redis *services.RedisService, hub *services.WSHub, jwtSecret, adminUser, adminPass string) {
	mime.AddExtensionType(".glb", "model/gltf-binary")
	mime.AddExtensionType(".gltf", "model/gltf+json")
	mime.AddExtensionType(".obj", "text/plain")
	mime.AddExtensionType(".stl", "application/vnd.ms-pki.stl")
	mime.AddExtensionType(".fbx", "application/octet-stream")
	authH := NewAuthHandler(db, redis, jwtSecret)
	friendH := NewFriendHandler(db, redis, hub)
	msgH := NewMessageHandler(db, redis, hub)
	groupH := NewGroupHandler(db, redis, hub)
	momentH := NewMomentHandler(db)
	wsH := NewWSHandler(hub, msgH)
	uploadH := NewUploadHandler()
	cloudH := NewCloudHandler(db)
	adminH := NewAdminHandler(db, adminUser, adminPass)

	libraryH := NewLibraryHandler(db)
	albumH := NewAlbumHandler(db)
	examH := NewExamHandler(db)
	auth := middleware.AuthMiddleware(jwtSecret)

	r.Use(middleware.RateLimit())

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	api := r.Group("/api")
	{
		api.POST("/register", authH.Register)
		api.POST("/login", authH.Login)
		api.GET("/hls/channels", adminH.ListHLS)
		api.GET("/library", libraryH.ListPublic)
		api.GET("/library/categories", libraryH.GetCategories)
		api.GET("/library/:id/download", libraryH.Download)
		api.GET("/exams", examH.ListExams)
		api.GET("/exams/categories", examH.GetCategories)

		protected := api.Group("", auth)
		{
			protected.GET("/profile", authH.GetProfile)
			protected.PUT("/profile", authH.UpdateProfile)

			protected.GET("/friends", friendH.GetFriends)
			protected.POST("/friends/request", friendH.SendFriendRequest)
			protected.GET("/friends/requests", friendH.GetFriendRequests)
			protected.POST("/friends/requests/:id/accept", friendH.AcceptRequest)
			protected.POST("/friends/requests/:id/reject", friendH.RejectRequest)
			protected.POST("/friends/delete", friendH.DeleteFriend)
			protected.GET("/friends/recommend", friendH.GetRecommend)
			protected.PUT("/friends/verify-setting", friendH.UpdateVerifySetting)
			protected.POST("/friends/qr-add", friendH.QRCodeAddFriend)
			protected.GET("/friends/all", friendH.GetAllUsers)
			protected.POST("/users/search", friendH.SearchUser)

			protected.POST("/messages/send", msgH.SendMessage)
			protected.GET("/messages", msgH.GetHistory)
			protected.POST("/messages/recall", msgH.RecallMessage)
			protected.DELETE("/messages/:id", msgH.DeleteMessage)

			protected.POST("/groups", groupH.CreateGroup)
			protected.GET("/groups", groupH.GetGroups)
			protected.GET("/groups/:id/members", groupH.GetMembers)
			protected.POST("/groups/:id/members", groupH.AddMembers)
			protected.DELETE("/groups/:id", groupH.DeleteGroup)

			protected.GET("/album", albumH.ListMyPhotos)
			protected.POST("/album/upload", albumH.UploadPhoto)
			protected.POST("/album/share", albumH.SharePhoto)
			protected.GET("/album/shared", albumH.GetSharedWithMe)
			protected.DELETE("/album/share/:id", albumH.UnsharePhoto)
			protected.DELETE("/album/:id", albumH.DeletePhoto)

			protected.GET("/exams/:id", examH.GetExam)
			protected.POST("/exams/generate", examH.GenerateCustomExam)
			protected.DELETE("/exams/:id", examH.DeleteMyExam)
			protected.POST("/exams/:id/start", examH.StartAttempt)
			protected.POST("/exams/:id/submit", examH.SubmitAttempt)
			protected.POST("/exams/:id/cancel", examH.CancelAttempt)
			protected.POST("/exams/:id/peek", examH.PeekAttempt)
			protected.GET("/exams/history/all", examH.GetHistory)
			protected.GET("/exams/attempt/:id", examH.GetAttempt)

			protected.POST("/moments", momentH.Create)
			protected.GET("/moments", momentH.GetFeed)
			protected.POST("/moments/like", momentH.Like)
			protected.POST("/moments/unlike", momentH.Unlike)
			protected.POST("/moments/comment", momentH.Comment)
			protected.GET("/moments/:id/comments", momentH.GetComments)
			protected.POST("/upload", uploadH.UploadFile)

			protected.POST("/cloud/mkdir", cloudH.CreateDir)
			protected.POST("/cloud/upload", cloudH.UploadFile)
			protected.GET("/cloud/list", cloudH.ListFiles)
			protected.POST("/cloud/share", cloudH.ShareFile)
			protected.GET("/cloud/shared", cloudH.GetShared)
			protected.PUT("/cloud/:id/rename", cloudH.RenameFile)
			protected.DELETE("/cloud/:id", cloudH.DeleteFile)
		}
	}

	r.GET("/ws", auth, wsH.HandleConnection)

	admin := r.Group("/api/admin")
	{
		admin.POST("/login", adminH.Login)
		admin.GET("/users", adminH.ListUsers)
		admin.DELETE("/users/:id", adminH.DeleteUser)
		admin.GET("/groups", adminH.ListGroups)
		admin.DELETE("/groups/:id", adminH.DeleteGroup)
		admin.GET("/hls", adminH.ListHLS)
		admin.POST("/hls", adminH.CreateHLS)
		admin.PUT("/hls/:id", adminH.UpdateHLS)
		admin.DELETE("/hls/:id", adminH.DeleteHLS)
		admin.GET("/files", adminH.ListFiles)
		admin.DELETE("/files/:id", adminH.DeleteFile)
		admin.GET("/library", libraryH.AdminList)
		admin.POST("/library", libraryH.AdminUpload)
		admin.PUT("/library/:id", libraryH.AdminUpdate)
		admin.DELETE("/library/:id", libraryH.AdminDelete)
		admin.GET("/categories", examH.AdminListCategories)
		admin.POST("/categories", examH.AdminCreateCategory)
		admin.PUT("/categories/:id", examH.AdminUpdateCategory)
		admin.DELETE("/categories/:id", examH.AdminDeleteCategory)
		admin.GET("/exams", examH.AdminList)
		admin.POST("/exams", examH.AdminCreate)
		admin.POST("/exams/ai-generate", examH.AdminGenerate)
		admin.PUT("/exams/:id", examH.AdminUpdate)
		admin.DELETE("/exams/:id", examH.AdminDelete)
	}

	// Serve React production build (if exists)
	if _, err := os.Stat("./web-react/dist"); err == nil {
		r.NoRoute(func(c *gin.Context) {
			c.Header("Cache-Control", "no-cache, no-store, must-revalidate")
			c.Header("Pragma", "no-cache")
			c.Header("Expires", "0")
			c.File("./web-react/dist/index.html")
		})
		r.Static("/assets", "./web-react/dist/assets")
 			r.Static("/cloud-files", "./uploads/cloud")
		r.GET("/uploads/*filepath", func(c *gin.Context) {
			serveFile(c, uploadH.UploadDir, c.Param("filepath"))
		})
		r.Static("/library-files", "./uploads/library")
	} else {
		r.StaticFile("/", "./web/index.html")
		r.StaticFile("/css/style.css", "./web/css/style.css")
		r.StaticFile("/js/app.js", "./web/js/app.js")
		r.GET("/uploads/*filepath", func(c *gin.Context) {
			serveFile(c, uploadH.UploadDir, c.Param("filepath"))
		})
	}
}

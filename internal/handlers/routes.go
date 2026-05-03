package handlers

import (
	"mime"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
	"github.com/qinghua/wechat-clone/internal/middleware"
	"github.com/qinghua/wechat-clone/internal/services"
	"gorm.io/gorm"
)

func serveFile(c *gin.Context, baseDir, relPath string) {
	fp := baseDir + relPath
	data, err := os.ReadFile(fp)
	if err != nil {
		c.Status(404)
		return
	}
	ct := "application/octet-stream"
	if ext := filepath.Ext(fp); ext == ".glb" || ext == ".gltf" {
		ct = "model/gltf-binary"
	} else if t := mime.TypeByExtension(ext); t != "" {
		ct = t
	}
	c.Data(200, ct, data)
}

func SetupRoutes(r *gin.Engine, db *gorm.DB, redis *services.RedisService, hub *services.WSHub, jwtSecret string) {
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

	auth := middleware.AuthMiddleware(jwtSecret)

	r.Use(middleware.RateLimit())

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	api := r.Group("/api")
	{
		api.POST("/register", authH.Register)
		api.POST("/login", authH.Login)

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
			protected.DELETE("/cloud/:id", cloudH.DeleteFile)
		}
	}

	r.GET("/ws", auth, wsH.HandleConnection)

	// Serve React production build (if exists)
	if _, err := os.Stat("./web-react/dist"); err == nil {
		r.NoRoute(func(c *gin.Context) {
			c.File("./web-react/dist/index.html")
		})
		r.Static("/assets", "./web-react/dist/assets")
 	r.Static("/cloud-files", "./uploads/cloud")
		r.GET("/uploads/*filepath", func(c *gin.Context) {
			serveFile(c, uploadH.UploadDir, c.Param("filepath"))
		})
	} else {
		r.StaticFile("/", "./web/index.html")
		r.StaticFile("/css/style.css", "./web/css/style.css")
		r.StaticFile("/js/app.js", "./web/js/app.js")
		r.GET("/uploads/*filepath", func(c *gin.Context) {
			serveFile(c, uploadH.UploadDir, c.Param("filepath"))
		})
	}
}

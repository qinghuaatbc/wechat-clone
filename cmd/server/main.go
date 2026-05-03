package main

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/qinghua/wechat-clone/internal/config"
	"github.com/qinghua/wechat-clone/internal/database"
	"github.com/qinghua/wechat-clone/internal/handlers"
	"github.com/qinghua/wechat-clone/internal/services"
)

func main() {
	cfg := config.Load()

	database.Connect(cfg)
	redisSvc := database.InitRedis(cfg)
	hub := services.NewWSHub()

	r := gin.Default()

	handlers.SetupRoutes(r, database.DB, redisSvc, hub, cfg.JWTSecret)

	log.Printf("server starting on :%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal("server failed:", err)
	}
}

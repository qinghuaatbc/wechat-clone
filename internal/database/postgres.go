package database

import (
	"log"

	"github.com/qinghua/wechat-clone/internal/config"
	"github.com/qinghua/wechat-clone/internal/models"
	"github.com/qinghua/wechat-clone/internal/services"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Connect(cfg *config.Config) {
	var err error
	DB, err = gorm.Open(postgres.Open(cfg.DSN()), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Fatal("failed to connect database:", err)
	}

	if err = DB.AutoMigrate(
		&models.User{},
		&models.Friendship{},
		&models.Message{},
		&models.Group{},
		&models.GroupMember{},
		&models.Moment{},
		&models.MomentComment{},
		&models.MomentLike{},
	); err != nil {
		log.Fatal("failed to migrate database:", err)
	}

	log.Println("database connected and migrated")
}

func InitRedis(cfg *config.Config) *services.RedisService {
	return services.NewRedisService(services.RedisConfig{
		Addr:     cfg.RedisAddr(),
		Password: cfg.RedisPass,
	})
}

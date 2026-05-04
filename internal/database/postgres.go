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
		&models.CloudFile{},
		&models.HLSChannel{},
		&models.LibraryItem{},
		&models.PhotoShare{},
		&models.Exam{},
		&models.ExamQuestion{},
		&models.ExamAttempt{},
		&models.ExamAnswer{},
		&models.Category{},
	); err != nil {
		log.Fatal("failed to migrate database:", err)
	}

	log.Println("database connected and migrated")

	seedHLSChannels(DB)
	seedCategories(DB)
}

func seedHLSChannels(db *gorm.DB) {
	var count int64
	db.Model(&models.HLSChannel{}).Count(&count)
	if count > 0 {
		return
	}
	channels := []models.HLSChannel{
		{Name: "Apple HLS Test", URL: "https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8", Category: "test"},
		{Name: "Big Buck Bunny", URL: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", Category: "movie"},
		{Name: "4K HDR", URL: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", Category: "movie"},
		{Name: "Live Sports 1", URL: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", Category: "sport"},
		{Name: "Live News", URL: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", Category: "news"},
		{Name: "CCTV-1 综合", URL: "http://183.196.13.77:9901/tsfile/live/0001_1.m3u8", Category: "tv"},
		{Name: "CCTV-13 新闻", URL: "http://183.196.13.77:9901/tsfile/live/0002_1.m3u8", Category: "news"},
		{Name: "湖南卫视", URL: "http://183.196.13.77:9901/tsfile/live/0003_1.m3u8", Category: "tv"},
		{Name: "浙江卫视", URL: "http://183.196.13.77:9901/tsfile/live/0004_1.m3u8", Category: "tv"},
		{Name: "CCTV-5 体育", URL: "http://183.196.13.77:9901/tsfile/live/0005_1.m3u8", Category: "sport"},
		{Name: "CCTV-6 电影", URL: "http://183.196.13.77:9901/tsfile/live/0006_1.m3u8", Category: "movie"},
		{Name: "东方卫视", URL: "http://183.196.13.77:9901/tsfile/live/0007_1.m3u8", Category: "tv"},
		{Name: "CCTV-8 电视剧", URL: "http://183.196.13.77:9901/tsfile/live/0008_1.m3u8", Category: "tv"},
	}
	for _, ch := range channels {
		db.Create(&ch)
	}
	log.Printf("seeded %d HLS channels", len(channels))
}

func seedCategories(db *gorm.DB) {
	var cnt int64
	db.Model(&models.Category{}).Count(&cnt)
	if cnt > 0 {
		return
	}
	cats := []models.Category{
		{Name: "编程", SubCategories: `["Go","Python","JavaScript","Rust","Java","C++"]`, SortOrder: 1},
		{Name: "语言", SubCategories: `["英语","日语","法语","德语","韩语"]`, SortOrder: 2},
		{Name: "数学", SubCategories: `["代数","几何","微积分","概率论","线性代数"]`, SortOrder: 3},
		{Name: "科学", SubCategories: `["物理","化学","生物","天文","地理"]`, SortOrder: 4},
		{Name: "工具", SubCategories: `["Docker","Linux","Git","Kubernetes","数据库"]`, SortOrder: 5},
	}
	for _, c := range cats {
		db.Create(&c)
	}
	log.Printf("seeded %d categories", len(cats))
}

func InitRedis(cfg *config.Config) *services.RedisService {
	return services.NewRedisService(services.RedisConfig{
		Addr:     cfg.RedisAddr(),
		Password: cfg.RedisPass,
	})
}

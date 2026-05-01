package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port         string
	DBHost       string
	DBPort       string
	DBUser       string
	DBPassword   string
	DBName       string
	DBSSLMode    string
	RedisHost    string
	RedisPort    string
	RedisPass    string
	JWTSecret    string
	JWTExpireHrs int
}

func Load() *Config {
	_ = godotenv.Load()

	return &Config{
		Port:         getEnv("PORT", "8080"),
		DBHost:       getEnv("DB_HOST", "localhost"),
		DBPort:       getEnv("DB_PORT", "5432"),
		DBUser:       getEnv("DB_USER", "postgres"),
		DBPassword:   getEnv("DB_PASSWORD", "postgres"),
		DBName:       getEnv("DB_NAME", "wechat_clone"),
		DBSSLMode:    getEnv("DB_SSLMODE", "disable"),
		RedisHost:    getEnv("REDIS_HOST", "localhost"),
		RedisPort:    getEnv("REDIS_PORT", "6379"),
		RedisPass:    getEnv("REDIS_PASSWORD", ""),
		JWTSecret:    getEnv("JWT_SECRET", "wechat-clone-secret"),
		JWTExpireHrs: 168,
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func (c *Config) DSN() string {
	return "host=" + c.DBHost +
		" port=" + c.DBPort +
		" user=" + c.DBUser +
		" password=" + c.DBPassword +
		" dbname=" + c.DBName +
		" sslmode=" + c.DBSSLMode +
		" TimeZone=Asia/Shanghai"
}

func (c *Config) RedisAddr() string {
	return c.RedisHost + ":" + c.RedisPort
}

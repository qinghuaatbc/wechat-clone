package services

import (
	"context"
	"time"

	"github.com/redis/go-redis/v9"
)

type RedisConfig struct {
	Addr     string
	Password string
}

type RedisService struct {
	client *redis.Client
	ctx    context.Context
}

func NewRedisService(cfg RedisConfig) *RedisService {
	rdb := redis.NewClient(&redis.Options{
		Addr:     cfg.Addr,
		Password: cfg.Password,
		DB:       0,
	})
	return &RedisService{
		client: rdb,
		ctx:    context.Background(),
	}
}

func (r *RedisService) Client() *redis.Client {
	return r.client
}

func (r *RedisService) SetUserOnline(userID string) error {
	return r.client.Set(r.ctx, "online:"+userID, "1", 24*time.Hour).Err()
}

func (r *RedisService) SetUserOffline(userID string) error {
	return r.client.Del(r.ctx, "online:"+userID).Err()
}

func (r *RedisService) IsUserOnline(userID string) bool {
	val, _ := r.client.Get(r.ctx, "online:"+userID).Result()
	return val == "1"
}

func (r *RedisService) CacheMessage(userID string, data string) error {
	return r.client.LPush(r.ctx, "msg:"+userID, data).Err()
}

func (r *RedisService) GetCachedMessages(userID string, count int64) ([]string, error) {
	return r.client.LRange(r.ctx, "msg:"+userID, 0, count-1).Result()
}

package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

var limiter = rate.NewLimiter(10, 20) // 10 requests per second, burst 20

func RateLimit() gin.HandlerFunc {
	return func(c *gin.Context) {
		if !limiter.Allow() {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "too many requests, please try again later",
			})
			c.Abort()
			return
		}
		c.Next()
	}
}

func RateLimitByIP(limit rate.Limit, burst int) gin.HandlerFunc {
	// In a real app, use Redis to store limit per IP
	// For this MVP, we use a global limiter for simplicity
	limiter := rate.NewLimiter(limit, burst)
	return func(c *gin.Context) {
		if !limiter.Allow() {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "too many requests",
			})
			c.Abort()
			return
		}
		c.Next()
	}
}

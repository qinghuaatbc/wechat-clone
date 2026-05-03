package handlers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/qinghua/wechat-clone/internal/middleware"
	"github.com/qinghua/wechat-clone/internal/models"
	"github.com/qinghua/wechat-clone/internal/services"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthHandler struct {
	DB        *gorm.DB
	Redis     *services.RedisService
	JWTSecret string
}

func NewAuthHandler(db *gorm.DB, redis *services.RedisService, jwtSecret string) *AuthHandler {
	return &AuthHandler{DB: db, Redis: redis, JWTSecret: jwtSecret}
}

type RegisterReq struct {
	Phone    string `json:"phone" binding:"required"`
	Password string `json:"password" binding:"required,min=6"`
	Nickname string `json:"nickname"`
	Gender   int    `json:"gender"`
}

type LoginReq struct {
	Phone    string `json:"phone" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var count int64
	h.DB.Model(&models.User{}).Where("phone = ?", req.Phone).Count(&count)
	if count > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "phone already registered"})
		return
	}

	hashedPw, _ := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)

	wxid := "wx_" + uuid.New().String()[:8]
	if req.Nickname == "" {
		req.Nickname = "用户" + wxid[3:]
	}

	user := models.User{
		Wxid:     wxid,
		Phone:    req.Phone,
		Nickname: req.Nickname,
		Password: string(hashedPw),
		Gender:   req.Gender,
		Avatar:   fmt.Sprintf("https://api.dicebear.com/7.x/adventurer/svg?seed=%s&backgroundColor=b6e3f4,c0aede,d1d4f9", wxid),
	}

	if err := h.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "register failed"})
		return
	}

	token := h.generateToken(user)

	c.JSON(http.StatusOK, gin.H{
		"token":             token,
		"user_id":           user.ID,
		"wxid":              user.Wxid,
		"nickname":          user.Nickname,
		"need_verification": user.NeedVerification,
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := h.DB.Where("phone = ?", req.Phone).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	token := h.generateToken(user)

	h.Redis.SetUserOnline(user.ID.String())

	c.JSON(http.StatusOK, gin.H{
		"token":             token,
		"user_id":           user.ID,
		"wxid":              user.Wxid,
		"nickname":          user.Nickname,
		"avatar":            user.Avatar,
		"need_verification": user.NeedVerification,
	})
}

func getUserID(c *gin.Context) uuid.UUID {
	v, _ := c.Get("user_id")
	return v.(uuid.UUID)
}

func (h *AuthHandler) GetProfile(c *gin.Context) {
	userID := getUserID(c)

	var user models.User
	if err := h.DB.First(&user, "id = ?", userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":                user.ID,
		"wxid":              user.Wxid,
		"phone":             user.Phone,
		"nickname":          user.Nickname,
		"avatar":            user.Avatar,
		"signature":         user.Signature,
		"gender":            user.Gender,
		"need_verification": user.NeedVerification,
	})
}

type UpdateProfileReq struct {
	Nickname  string `json:"nickname"`
	Avatar    string `json:"avatar"`
	Signature string `json:"signature"`
	Gender    int    `json:"gender"`
}

func (h *AuthHandler) UpdateProfile(c *gin.Context) {
	userID := getUserID(c)

	var req UpdateProfileReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updates := map[string]interface{}{}
	if req.Nickname != "" {
		updates["nickname"] = req.Nickname
	}
	if req.Avatar != "" {
		updates["avatar"] = req.Avatar
	}
	if req.Signature != "" {
		updates["signature"] = req.Signature
	}
	updates["gender"] = req.Gender

	h.DB.Model(&models.User{}).Where("id = ?", userID).Updates(updates)

	c.JSON(http.StatusOK, gin.H{"message": "profile updated"})
}

func (h *AuthHandler) generateToken(user models.User) string {
	claims := middleware.JWTClaims{
		UserID: user.ID,
		Wxid:   user.Wxid,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(168 * time.Hour)),
		},
	}

	token, _ := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(h.JWTSecret))
	return token
}

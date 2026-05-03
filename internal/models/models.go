package models

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID               uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Wxid             string    `gorm:"uniqueIndex;size:32" json:"wxid"`
	Phone            string    `gorm:"uniqueIndex;size:20" json:"phone"`
	Nickname         string    `gorm:"size:64" json:"nickname"`
	Avatar           string    `gorm:"size:512" json:"avatar"`
	Signature        string    `gorm:"size:256" json:"signature"`
	Password         string    `gorm:"size:128" json:"-"`
	Gender           int       `gorm:"default:0" json:"gender"`
	Status           int       `gorm:"default:1" json:"status"`
	NeedVerification bool      `gorm:"default:true" json:"need_verification"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

type FriendRequest struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	FromID    uuid.UUID `gorm:"type:uuid;index" json:"from_id"`
	ToID      uuid.UUID `gorm:"type:uuid;index" json:"to_id"`
	Message   string    `gorm:"size:256" json:"message"`
	Status    int       `gorm:"default:0" json:"status"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (FriendRequest) TableName() string { return "friend_requests" }

const (
	RequestPending  = 0
	RequestAccepted = 1
	RequestRejected = 2
)

type Friendship struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;index" json:"user_id"`
	FriendID  uuid.UUID `gorm:"type:uuid" json:"friend_id"`
	Remark    string    `gorm:"size:64" json:"remark"`
	Status    int       `gorm:"default:1" json:"status"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Message struct {
	ID           uint       `gorm:"primaryKey" json:"id"`
	SenderID     uuid.UUID  `gorm:"type:uuid;index" json:"sender_id"`
	ReceiverID   *uuid.UUID `gorm:"type:uuid" json:"receiver_id"`
	GroupID      *uuid.UUID `gorm:"type:uuid" json:"group_id"`
	Type         int        `gorm:"default:1" json:"type"`
	Content      string     `gorm:"type:text" json:"content"`
	FileName     string     `gorm:"size:256" json:"file_name"`
	FileSize     int64      `gorm:"default:0" json:"file_size"`
	QuoteContent string     `gorm:"type:text" json:"quote_content"`
	IsRecalled   bool       `gorm:"default:false" json:"is_recalled"`
	Status       int        `gorm:"default:1" json:"status"`
	CreatedAt    time.Time  `json:"created_at"`
}

type Group struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name      string    `gorm:"size:128" json:"name"`
	Avatar    string    `gorm:"size:512" json:"avatar"`
	OwnerID   uuid.UUID `gorm:"type:uuid" json:"owner_id"`
	Notice    string    `gorm:"size:512" json:"notice"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type GroupMember struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	GroupID   uuid.UUID `gorm:"type:uuid;index" json:"group_id"`
	UserID    uuid.UUID `gorm:"type:uuid" json:"user_id"`
	Role      int       `gorm:"default:0" json:"role"`
	Alias     string    `gorm:"size:64" json:"alias"`
	CreatedAt time.Time `json:"created_at"`
}

type Moment struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;index" json:"user_id"`
	Content   string    `gorm:"type:text" json:"content"`
	Images    string    `gorm:"type:text" json:"images"`
	Visible   int       `gorm:"default:1" json:"visible"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type MomentComment struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	MomentID  uint      `gorm:"index" json:"moment_id"`
	UserID    uuid.UUID `gorm:"type:uuid" json:"user_id"`
	Content   string    `gorm:"type:text" json:"content"`
	CreatedAt time.Time `json:"created_at"`
}

type MomentLike struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	MomentID  uint      `gorm:"uniqueIndex:idx_moment_user" json:"moment_id"`
	UserID    uuid.UUID `gorm:"type:uuid;uniqueIndex:idx_moment_user" json:"user_id"`
	CreatedAt time.Time `json:"created_at"`
}

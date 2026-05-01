package models

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID         uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Wxid       string    `gorm:"uniqueIndex;size:32"`
	Phone      string    `gorm:"uniqueIndex;size:20"`
	Nickname   string    `gorm:"size:64"`
	Avatar     string    `gorm:"size:512"`
	Signature  string    `gorm:"size:256"`
	Password   string    `gorm:"size:128"`
	Gender     int       `gorm:"default:0"`
	Status     int       `gorm:"default:1"`
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

type Friendship struct {
	ID        uint      `gorm:"primaryKey"`
	UserID    uuid.UUID `gorm:"type:uuid;index"`
	FriendID  uuid.UUID `gorm:"type:uuid"`
	Remark    string    `gorm:"size:64"`
	Status    int       `gorm:"default:1"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

type Message struct {
	ID          uint      `gorm:"primaryKey"`
	SenderID    uuid.UUID `gorm:"type:uuid;index"`
	ReceiverID  *uuid.UUID `gorm:"type:uuid"`
	GroupID     *uuid.UUID `gorm:"type:uuid"`
	Type        int       `gorm:"default:1"`
	Content     string    `gorm:"type:text"`
	QuoteContent string   `gorm:"type:text"` // 引用内容
	IsRecalled  bool      `gorm:"default:false"` // 是否撤回
	Status      int       `gorm:"default:1"`
	CreatedAt   time.Time
}

type Group struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Name      string    `gorm:"size:128"`
	Avatar    string    `gorm:"size:512"`
	OwnerID   uuid.UUID `gorm:"type:uuid"`
	Notice    string    `gorm:"size:512"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

type GroupMember struct {
	ID        uint      `gorm:"primaryKey"`
	GroupID   uuid.UUID `gorm:"type:uuid;index"`
	UserID    uuid.UUID `gorm:"type:uuid"`
	Role      int       `gorm:"default:0"`
	Alias     string    `gorm:"size:64"`
	CreatedAt time.Time
}

type Moment struct {
	ID        uint      `gorm:"primaryKey"`
	UserID    uuid.UUID `gorm:"type:uuid;index"`
	Content   string    `gorm:"type:text"`
	Images    string    `gorm:"type:text"`
	Visible   int       `gorm:"default:1"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

type MomentComment struct {
	ID        uint      `gorm:"primaryKey"`
	MomentID  uint      `gorm:"index"`
	UserID    uuid.UUID `gorm:"type:uuid"`
	Content   string    `gorm:"type:text"`
	CreatedAt time.Time
}

type MomentLike struct {
	ID        uint      `gorm:"primaryKey"`
	MomentID  uint      `gorm:"uniqueIndex:idx_moment_user"`
	UserID    uuid.UUID `gorm:"type:uuid;uniqueIndex:idx_moment_user"`
	CreatedAt time.Time
}

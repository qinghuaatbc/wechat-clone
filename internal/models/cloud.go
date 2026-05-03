package models

import (
	"time"

	"github.com/google/uuid"
)

type CloudFile struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID       uuid.UUID `gorm:"type:uuid;index"`
	Name         string    `gorm:"size:256"`
	Path         string    `gorm:"size:1024"`
	Type         string    `gorm:"size:64"`
	Size         int64     `gorm:"default:0"`
	ParentID     *uuid.UUID `gorm:"type:uuid"`
	IsDir        bool      `gorm:"default:false"`
	Permission   int       `gorm:"default:0"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

const (
	PermPrivate  = 0
	PermFriends  = 1
	PermGroup    = 2
	PermPublic   = 3
)

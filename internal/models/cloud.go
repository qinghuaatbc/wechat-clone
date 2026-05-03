package models

import (
	"time"

	"github.com/google/uuid"
)

type CloudFile struct {
	ID         uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID     uuid.UUID  `gorm:"type:uuid;index" json:"user_id"`
	Name       string     `gorm:"size:256" json:"name"`
	Path       string     `gorm:"size:1024" json:"path"`
	Type       string     `gorm:"size:64" json:"type"`
	Size       int64      `gorm:"default:0" json:"size"`
	ParentID   *uuid.UUID `gorm:"type:uuid" json:"parent_id"`
	IsDir      bool       `gorm:"default:false" json:"is_dir"`
	Permission int        `gorm:"default:0" json:"permission"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`
}

const (
	PermPrivate = 0
	PermFriends = 1
	PermGroup   = 2
	PermPublic  = 3
)

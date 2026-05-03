package models

import (
	"time"

	"github.com/google/uuid"
)

type LibraryItem struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Title       string    `gorm:"size:256" json:"title"`
	Description string    `gorm:"type:text" json:"description"`
	Category    string    `gorm:"size:64;index" json:"category"`
	FilePath    string    `gorm:"size:1024" json:"file_path"`
	FileSize    int64     `gorm:"default:0" json:"file_size"`
	Downloads   int       `gorm:"default:0" json:"downloads"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

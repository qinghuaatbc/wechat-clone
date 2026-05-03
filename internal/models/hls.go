package models

import (
	"time"

	"github.com/google/uuid"
)

type HLSChannel struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name      string    `gorm:"size:256" json:"name"`
	URL       string    `gorm:"size:1024" json:"url"`
	Category  string    `gorm:"size:64" json:"category"`
	CreatedAt time.Time `json:"created_at"`
}

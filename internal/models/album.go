package models

import (
	"time"

	"github.com/google/uuid"
)

type PhotoShare struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	PhotoID         uuid.UUID `gorm:"type:uuid;index" json:"photo_id"`
	OwnerID         uuid.UUID `gorm:"type:uuid;index" json:"owner_id"`
	SharedWithUserID uuid.UUID `gorm:"type:uuid;index" json:"shared_with_user_id"`
	CreatedAt       time.Time `json:"created_at"`
}

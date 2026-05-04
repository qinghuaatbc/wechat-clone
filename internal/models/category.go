package models

import (
	"encoding/json"
)

type Category struct {
	ID            uint   `gorm:"primaryKey" json:"id"`
	Name          string `gorm:"uniqueIndex;size:64" json:"name"`
	SubCategories string `gorm:"type:text" json:"sub_categories"`
	SortOrder     int    `gorm:"default:0" json:"sort_order"`
}

func (c *Category) GetSubs() []string {
	var subs []string
	json.Unmarshal([]byte(c.SubCategories), &subs)
	return subs
}

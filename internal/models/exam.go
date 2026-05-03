package models

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Exam struct {
	ID          uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Title       string         `gorm:"size:256" json:"title"`
	Description string         `gorm:"type:text" json:"description"`
	Category    string         `gorm:"size:64;index" json:"category"`
	SubCategory string         `gorm:"size:64" json:"sub_category"`
	Difficulty  int            `gorm:"default:1" json:"difficulty"`
	QuestionCnt int            `gorm:"default:0" json:"question_cnt"`
	TimeLimit   int            `gorm:"default:0" json:"time_limit"`
	CreatedBy   uuid.UUID      `gorm:"type:uuid" json:"created_by"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	Questions   []ExamQuestion `gorm:"foreignKey:ExamID" json:"questions,omitempty"`
}

type ExamQuestion struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	ExamID        uuid.UUID `gorm:"type:uuid;index" json:"exam_id"`
	Question      string    `gorm:"type:text" json:"question"`
	Options       string    `gorm:"type:text" json:"options"`
	CorrectAnswer int       `json:"correct_answer"`
	Explanation   string    `gorm:"type:text" json:"explanation"`
	OrderNum      int       `gorm:"default:0" json:"order_num"`
}

func (q *ExamQuestion) ParseOptions() []string {
	var opts []string
	json.Unmarshal([]byte(q.Options), &opts)
	return opts
}

type ExamAttempt struct {
	ID           uint         `gorm:"primaryKey" json:"id"`
	ExamID       uuid.UUID    `gorm:"type:uuid;index" json:"exam_id"`
	UserID       uuid.UUID    `gorm:"type:uuid;index" json:"user_id"`
	Score        int          `gorm:"default:0" json:"score"`
	Total        int          `gorm:"default:0" json:"total"`
	Status       string       `gorm:"size:16;default:in_progress" json:"status"`
	Peeked       bool         `gorm:"default:false" json:"peeked"`
	PeekCanceled bool         `gorm:"default:false" json:"peek_canceled"`
	Answers      []ExamAnswer `gorm:"foreignKey:AttemptID" json:"answers,omitempty"`
	StartedAt    time.Time    `json:"started_at"`
	CompletedAt  *time.Time   `json:"completed_at,omitempty"`
	CreatedAt    time.Time    `json:"created_at"`
	Exam         Exam         `gorm:"foreignKey:ExamID" json:"exam,omitempty"`
}

func (a *ExamAttempt) BeforeCreate(tx *gorm.DB) error {
	a.StartedAt = time.Now()
	return nil
}

type ExamAnswer struct {
	ID         uint `gorm:"primaryKey" json:"id"`
	AttemptID  uint `gorm:"index" json:"attempt_id"`
	QuestionID uint `json:"question_id"`
	Selected   int  `json:"selected"`
	IsCorrect  bool `json:"is_correct"`
}

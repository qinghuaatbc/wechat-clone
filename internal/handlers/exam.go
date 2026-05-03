package handlers

import (
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/qinghua/wechat-clone/internal/models"
	"github.com/qinghua/wechat-clone/internal/services"
	"gorm.io/gorm"
)

type ExamHandler struct {
	DB *gorm.DB
	AI *services.AIService
}

func NewExamHandler(db *gorm.DB) *ExamHandler {
	return &ExamHandler{DB: db, AI: services.NewAIService()}
}

func (h *ExamHandler) ListExams(c *gin.Context) {
	cat := c.Query("category")
	sub := c.Query("sub_category")
	difficulty := c.Query("difficulty")

	query := h.DB.Model(&models.Exam{}).Preload("Questions")
	if cat != "" {
		query = query.Where("category = ?", cat)
	}
	if sub != "" {
		query = query.Where("sub_category = ?", sub)
	}
	if difficulty != "" {
		query = query.Where("difficulty = ?", difficulty)
	}

	var exams []models.Exam
	query.Order("created_at DESC").Find(&exams)
	c.JSON(http.StatusOK, gin.H{"exams": exams})
}

func (h *ExamHandler) GetCategories(c *gin.Context) {
	var cats []struct {
		Category    string
		SubCategory string
		Count       int
	}
	h.DB.Model(&models.Exam{}).
		Select("category, sub_category, count(*) as count").
		Group("category, sub_category").
		Order("category ASC").
		Scan(&cats)

	grouped := map[string][]gin.H{}
	for _, c := range cats {
		key := c.Category
		grouped[key] = append(grouped[key], gin.H{
			"sub_category": c.SubCategory, "count": c.Count,
		})
	}
	var result []gin.H
	for k, v := range grouped {
		result = append(result, gin.H{"category": k, "sub_categories": v})
	}
	c.JSON(http.StatusOK, gin.H{"categories": result})
}

func (h *ExamHandler) GetExam(c *gin.Context) {
	var exam models.Exam
	if err := h.DB.Preload("Questions").First(&exam, "id = ?", c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "exam not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"exam": exam})
}

func (h *ExamHandler) StartAttempt(c *gin.Context) {
	userID := getUserID(c)
	var exam models.Exam
	if err := h.DB.First(&exam, "id = ?", c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "exam not found"})
		return
	}
	attempt := models.ExamAttempt{
		ExamID: exam.ID,
		UserID: userID,
		Total:  exam.QuestionCnt,
		Status: "in_progress",
	}
	if err := h.DB.Create(&attempt).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "create failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"attempt": attempt})
}

type SubmitReq struct {
	Answers []AnswerEntry `json:"answers" binding:"required"`
}

type AnswerEntry struct {
	QuestionID uint `json:"question_id"`
	Selected   int  `json:"selected"`
}

func (h *ExamHandler) SubmitAttempt(c *gin.Context) {
	userID := getUserID(c)
	var attempt models.ExamAttempt
	if err := h.DB.First(&attempt, "id = ? AND user_id = ? AND status = ?",
		c.Param("aid"), userID, "in_progress").Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "attempt not found or already submitted"})
		return
	}
	var req SubmitReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var questions []models.ExamQuestion
	h.DB.Where("exam_id = ?", attempt.ExamID).Find(&questions)
	qMap := map[uint]models.ExamQuestion{}
	for _, q := range questions {
		qMap[q.ID] = q
	}

	score := 0
	var answers []models.ExamAnswer
	for _, a := range req.Answers {
		q, ok := qMap[a.QuestionID]
		correct := ok && a.Selected == q.CorrectAnswer
		if correct {
			score++
		}
		answers = append(answers, models.ExamAnswer{
			AttemptID:  attempt.ID,
			QuestionID: a.QuestionID,
			Selected:   a.Selected,
			IsCorrect:  correct,
		})
	}
	h.DB.Create(&answers)

	now := time.Now()
	attempt.Score = score
	attempt.Total = len(questions)
	attempt.Status = "completed"
	attempt.CompletedAt = &now
	h.DB.Save(&attempt)

	// Analysis
	correctCnt := 0
	wrongByQuestion := map[uint]bool{}
	for _, a := range answers {
		if a.IsCorrect {
			correctCnt++
		} else {
			wrongByQuestion[a.QuestionID] = true
		}
	}

	weakAreas := []string{}
	for qid := range wrongByQuestion {
		if q, ok := qMap[qid]; ok {
			weakAreas = append(weakAreas, q.Question)
		}
	}

	scorePct := float64(0)
	if len(questions) > 0 {
		scorePct = math.Round(float64(score)/float64(len(questions))*100)
	}

	c.JSON(http.StatusOK, gin.H{
		"attempt":   attempt,
		"analysis": gin.H{
			"score_pct":  scorePct,
			"correct":    correctCnt,
			"total":      len(questions),
			"weak_areas": weakAreas,
		},
	})
}

func (h *ExamHandler) PeekAttempt(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "ok", "peeked": true})
}

func (h *ExamHandler) GetHistory(c *gin.Context) {
	userID := getUserID(c)
	var attempts []models.ExamAttempt
	h.DB.Where("user_id = ?", userID).
		Order("created_at DESC").
		Preload("Exam").
		Find(&attempts)
	c.JSON(http.StatusOK, gin.H{"attempts": attempts})
}

func (h *ExamHandler) GetAttempt(c *gin.Context) {
	userID := getUserID(c)
	var attempt models.ExamAttempt
	if err := h.DB.Preload("Answers").Preload("Exam.Questions").
		First(&attempt, "id = ? AND user_id = ?", c.Param("aid"), userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"attempt": attempt})
}

// Admin endpoints
type ExamCreateReq struct {
	Title       string     `json:"title" binding:"required"`
	Description string     `json:"description"`
	Category    string     `json:"category" binding:"required"`
	SubCategory string     `json:"sub_category"`
	Difficulty  int        `json:"difficulty"`
	TimeLimit   int        `json:"time_limit"`
	Questions   []QuestionInput `json:"questions" binding:"required"`
}

type QuestionInput struct {
	Question      string   `json:"question"`
	Options       []string `json:"options"`
	CorrectAnswer int      `json:"correct_answer"`
	Explanation   string   `json:"explanation"`
}

func (h *ExamHandler) AdminGenerate(c *gin.Context) {
	var req struct {
		Topic       string `json:"topic" binding:"required"`
		Category    string `json:"category" binding:"required"`
		SubCategory string `json:"sub_category"`
		Difficulty  int    `json:"difficulty"`
		Count       int    `json:"count"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if req.Count < 1 || req.Count > 20 {
		req.Count = 5
	}
	if req.Difficulty < 1 || req.Difficulty > 3 {
		req.Difficulty = 1
	}

	questions, err := h.AI.GenerateQuestions(services.GenerateQuestionsReq{
		Topic:       req.Topic,
		Category:    req.Category,
		SubCategory: req.SubCategory,
		Difficulty:  req.Difficulty,
		Count:       req.Count,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	exam := models.Exam{
		Title:       req.Topic,
		Description: fmt.Sprintf("AI生成的%s考试，主题：%s", req.Category, req.Topic),
		Category:    req.Category,
		SubCategory: req.SubCategory,
		Difficulty:  req.Difficulty,
		QuestionCnt: len(questions),
	}
	h.DB.Create(&exam)

	for i, q := range questions {
		opts, _ := json.Marshal(q.Options)
		h.DB.Create(&models.ExamQuestion{
			ExamID:        exam.ID,
			Question:      q.Question,
			Options:       string(opts),
			CorrectAnswer: q.CorrectAnswer,
			Explanation:   q.Explanation,
			OrderNum:      i + 1,
		})
	}

	h.DB.Preload("Questions").First(&exam, exam.ID)
	c.JSON(http.StatusOK, gin.H{"exam": exam, "ai_generated": true})
}

func (h *ExamHandler) AdminCreate(c *gin.Context) {
	var req ExamCreateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	exam := models.Exam{
		Title:       req.Title,
		Description: req.Description,
		Category:    req.Category,
		SubCategory: req.SubCategory,
		Difficulty:  req.Difficulty,
		QuestionCnt: len(req.Questions),
		TimeLimit:   req.TimeLimit,
	}
	if err := h.DB.Create(&exam).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "create failed"})
		return
	}

	for i, q := range req.Questions {
		opts, _ := json.Marshal(q.Options)
		h.DB.Create(&models.ExamQuestion{
			ExamID:        exam.ID,
			Question:      q.Question,
			Options:       string(opts),
			CorrectAnswer: q.CorrectAnswer,
			Explanation:   q.Explanation,
			OrderNum:      i + 1,
		})
	}
	// update question count
	exam.QuestionCnt = len(req.Questions)
	h.DB.Save(&exam)

	h.DB.Preload("Questions").First(&exam, exam.ID)
	c.JSON(http.StatusOK, gin.H{"exam": exam})
}

func (h *ExamHandler) AdminUpdate(c *gin.Context) {
	id := c.Param("id")
	var exam models.Exam
	if err := h.DB.First(&exam, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	var req struct {
		Title       string `json:"title"`
		Description string `json:"description"`
		Category    string `json:"category"`
		SubCategory string `json:"sub_category"`
		Difficulty  int    `json:"difficulty"`
		TimeLimit   int    `json:"time_limit"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	updates := map[string]interface{}{}
	if req.Title != "" {
		updates["title"] = req.Title
	}
	if req.Category != "" {
		updates["category"] = req.Category
	}
	if req.SubCategory != "" {
		updates["sub_category"] = req.SubCategory
	}
	if req.Difficulty > 0 {
		updates["difficulty"] = req.Difficulty
	}
	if req.TimeLimit > 0 {
		updates["time_limit"] = req.TimeLimit
	}
	updates["description"] = req.Description
	h.DB.Model(&exam).Updates(updates)
	c.JSON(http.StatusOK, gin.H{"exam": exam})
}

func (h *ExamHandler) AdminDelete(c *gin.Context) {
	id := c.Param("id")
	h.DB.Where("exam_id = ?", id).Delete(&models.ExamQuestion{})
	h.DB.Where("exam_id = ?", id).Delete(&models.ExamAttempt{})
	h.DB.Delete(&models.Exam{}, "id = ?", id)
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

func (h *ExamHandler) AdminList(c *gin.Context) {
	var exams []models.Exam
	h.DB.Order("created_at DESC").Find(&exams)
	c.JSON(http.StatusOK, gin.H{"exams": exams})
}

package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
)

type AIService struct{}

func NewAIService() *AIService {
	return &AIService{}
}

type GenerateQuestionsReq struct {
	Topic       string `json:"topic"`
	Category    string `json:"category"`
	SubCategory string `json:"sub_category"`
	Difficulty  int    `json:"difficulty"`
	Count       int    `json:"count"`
}

type QuestionResult struct {
	Question      string   `json:"question"`
	Options       []string `json:"options"`
	CorrectAnswer int      `json:"correct_answer"`
	Explanation   string   `json:"explanation"`
}

func (s *AIService) GenerateQuestions(req GenerateQuestionsReq) ([]QuestionResult, error) {
	apiKey := os.Getenv("ANTHROPIC_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("ANTHROPIC_API_KEY not set")
	}

	diffLabel := map[int]string{1: "简单", 2: "中等", 3: "困难"}

	prompt := fmt.Sprintf(`请生成%d道%s难度的%s选择题，主题：%s。子类别：%s。

要求：
1. 每道题4个选项
2. 标注正确答案索引(0-3)
3. 附上解析

请以JSON数组格式返回，每个元素包含：question, options(数组), correct_answer(数字), explanation(字符串)`,
		req.Count, diffLabel[req.Difficulty], req.Category, req.Topic, req.SubCategory)

	body := map[string]interface{}{
		"model":      "claude-sonnet-4-20250514",
		"max_tokens": 4096,
		"messages": []map[string]string{
			{"role": "user", "content": prompt},
		},
	}

	jsonBody, _ := json.Marshal(body)
	req2, _ := http.NewRequest("POST", "https://api.anthropic.com/v1/messages",
		bytes.NewReader(jsonBody))
	req2.Header.Set("x-api-key", apiKey)
	req2.Header.Set("anthropic-version", "2023-06-01")
	req2.Header.Set("Content-Type", "application/json")
	client := &http.Client{}
	resp, err := client.Do(req2)
	if err != nil {
		return nil, fmt.Errorf("API call failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)

	var result struct {
		Content []struct {
			Text string `json:"text"`
		} `json:"content"`
	}
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("parse response failed: %w", err)
	}

	if len(result.Content) == 0 {
		return nil, fmt.Errorf("empty response from API")
	}

	text := result.Content[0].Text
	text = strings.TrimSpace(text)
	text = strings.TrimPrefix(text, "```json")
	text = strings.TrimPrefix(text, "```")
	text = strings.TrimSuffix(text, "```")
	text = strings.TrimSpace(text)

	var questions []QuestionResult
	if err := json.Unmarshal([]byte(text), &questions); err != nil {
		return nil, fmt.Errorf("parse questions failed: %s\nraw: %s", err, text)
	}

	return questions, nil
}

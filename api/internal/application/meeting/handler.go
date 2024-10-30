package application

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/guangtouwangba/ai-meeting-notes/internal/domain/meeting"
)

type MeetingHandler struct {
	repo meeting.Repository
}

type CreateMeetingRequest struct {
	Title               string              `json:"title"`
	Description         string              `json:"description"`
	TargetLang          string              `json:"target_lang"`
	SourceLang          string              `json:"source_lang"`
	StartTime           time.Time           `json:"start_time"`
	EndTime             time.Time           `json:"end_time"`
	Speaker             string              `json:"speaker"`
	TranscriberSettings TranscriberSettings `json:"transcriber_settings"`
}

type TranscriberSettings struct {
}

func NewMeetingHandler(repo meeting.Repository) *MeetingHandler {
	return &MeetingHandler{repo: repo}
}

func (h *MeetingHandler) CreateMeeting(c *gin.Context) {
	var req CreateMeetingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	err := h.repo.Create(c, &meeting.Meeting{
		Title:       req.Title,
		StartTime:   req.StartTime,
		EndTime:     req.EndTime,
		Description: req.Description,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Meeting created"})
}

func (h *MeetingHandler) GetMeetings(c *gin.Context) {
	// 获取分页参数，默认第1页，每页20条
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	// 验证参数
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// 获取分页数据
	result, err := h.repo.GetPaginated(c, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *MeetingHandler) GetMeeting(c *gin.Context) {
	id := c.Param("id")
	m, err := h.repo.GetByID(c, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, m)
}

func (h *MeetingHandler) UpdateMeeting(c *gin.Context) {
	id := c.Param("id")
	var req CreateMeetingRequest
	err := h.repo.Update(c, &meeting.Meeting{
		ID:          id,
		Title:       req.Title,
		StartTime:   req.StartTime,
		EndTime:     req.EndTime,
		Description: req.Description,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
}

func (h *MeetingHandler) DeleteMeeting(c *gin.Context) {
	id := c.Param("id")
	err := h.repo.Delete(c, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Meeting deleted"})
}

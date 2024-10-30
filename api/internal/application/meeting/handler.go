package application

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/guangtouwangba/ai-meeting-notes/internal/domain/meeting"
)

type MeetingHandler struct {
	repo meeting.Repository
}

type CreateMeetingRequest struct {
	Title       string    `json:"title"`
	Description string    `json:"description"`
	StartTime   time.Time `json:"start_time"`
	EndTime     time.Time `json:"end_time"`
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
	meetings, err := h.repo.GetAll(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, meetings)
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

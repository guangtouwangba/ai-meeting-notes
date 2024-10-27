package application

import (
	"github.com/gin-gonic/gin"
	"github.com/guangtouwangba/ai-meeting-notes/internal/domain/meeting"
)

type Handler struct {
	repo meeting.Repository
}

func NewHandler(repo meeting.Repository) *Handler {
	return &Handler{repo: repo}
}

func (h *Handler) CreateMeeting(c *gin.Context) {
	// 实现创建会议的逻辑
}

func (h *Handler) GetMeetings(c *gin.Context) {
	// 实现获取所有会议的逻辑
}

func (h *Handler) GetMeeting(c *gin.Context) {
	// 实现获取单个会议的逻辑
}

func (h *Handler) UpdateMeeting(c *gin.Context) {
	// 实现更新会议的逻辑
}

func (h *Handler) DeleteMeeting(c *gin.Context) {
	// 实现删除会议的逻辑
}

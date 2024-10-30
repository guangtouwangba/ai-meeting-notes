package http

import (
	"github.com/gin-gonic/gin"
	"github.com/guangtouwangba/ai-meeting-notes/internal/application/meeting"
	"github.com/guangtouwangba/ai-meeting-notes/internal/domain/meeting"
)

type MeetingHandler struct {
	meetingService *application.MeetingHandler
}

func NewMeetingHandler(repo meeting.Repository) *MeetingHandler {
	return &MeetingHandler{
		meetingService: application.NewMeetingHandler(repo),
	}
}

// RegisterRoutes 注册所有会议相关的路由
func (h *MeetingHandler) RegisterRoutes(r *gin.Engine) {
	meetingGroup := r.Group("/meetings")
	{
		meetingGroup.POST("", h.CreateMeeting)
		meetingGroup.GET("", h.GetMeetings)
		meetingGroup.GET("/:id", h.GetMeeting)
		meetingGroup.PUT("/:id", h.UpdateMeeting)
		meetingGroup.DELETE("/:id", h.DeleteMeeting)
	}
}

// CreateMeeting 创建新会议
func (h *MeetingHandler) CreateMeeting(c *gin.Context) {
	h.meetingService.CreateMeeting(c)
}

// GetMeetings 获取所有会议
func (h *MeetingHandler) GetMeetings(c *gin.Context) {
	h.meetingService.GetMeetings(c)
}

// GetMeeting 获取单个会议
func (h *MeetingHandler) GetMeeting(c *gin.Context) {
	h.meetingService.GetMeeting(c)
}

// UpdateMeeting 更新会议
func (h *MeetingHandler) UpdateMeeting(c *gin.Context) {
	h.meetingService.UpdateMeeting(c)
}

// DeleteMeeting 删除会议
func (h *MeetingHandler) DeleteMeeting(c *gin.Context) {
	h.meetingService.DeleteMeeting(c)
}

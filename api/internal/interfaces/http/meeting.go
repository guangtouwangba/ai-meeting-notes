package http

import (
	"github.com/gin-gonic/gin"
	application "github.com/guangtouwangba/ai-meeting-notes/internal/application/meeting"
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

func (h *MeetingHandler) RegisterRoutes(r *gin.Engine) {
	// 添加 CORS 中间件
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	meetingGroup := r.Group("/meetings")
	{
		meetingGroup.GET("", h.GetMeetings)
		meetingGroup.GET("/:id", h.GetMeeting)
		meetingGroup.POST("", h.CreateMeeting)
		meetingGroup.PUT("/:id", h.UpdateMeeting)
		meetingGroup.DELETE("/:id", h.DeleteMeeting)
	}
}

func (h *MeetingHandler) GetMeetings(c *gin.Context) {
	h.meetingService.GetMeetings(c)
}

// CreateMeeting 创建新会议
func (h *MeetingHandler) CreateMeeting(c *gin.Context) {
	h.meetingService.CreateMeeting(c)
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

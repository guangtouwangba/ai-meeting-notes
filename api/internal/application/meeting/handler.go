package meeting

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type Meeting struct {
	ID        string `json:"id"`
	Title     string `json:"title"`
	StartTime string `json:"start_time"`
	EndTime   string `json:"end_time"`
}

var meetings = []Meeting{}

func CreateMeeting(c *gin.Context) {
	var newMeeting Meeting
	if err := c.ShouldBindJSON(&newMeeting); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	meetings = append(meetings, newMeeting)
	c.JSON(http.StatusCreated, newMeeting)
}

func GetMeetings(c *gin.Context) {
	c.JSON(http.StatusOK, meetings)
}

func GetMeeting(c *gin.Context) {
	id := c.Param("id")
	for _, meeting := range meetings {
		if meeting.ID == id {
			c.JSON(http.StatusOK, meeting)
			return
		}
	}
	c.JSON(http.StatusNotFound, gin.H{"error": "会议未找到"})
}

func UpdateMeeting(c *gin.Context) {
	id := c.Param("id")
	var updatedMeeting Meeting
	if err := c.ShouldBindJSON(&updatedMeeting); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	for i, meeting := range meetings {
		if meeting.ID == id {
			meetings[i] = updatedMeeting
			c.JSON(http.StatusOK, updatedMeeting)
			return
		}
	}
	c.JSON(http.StatusNotFound, gin.H{"error": "会议未找到"})
}

func DeleteMeeting(c *gin.Context) {
	id := c.Param("id")
	for i, meeting := range meetings {
		if meeting.ID == id {
			meetings = append(meetings[:i], meetings[i+1:]...)
			c.JSON(http.StatusOK, gin.H{"message": "会议已删除"})
			return
		}
	}
	c.JSON(http.StatusNotFound, gin.H{"error": "会议未找到"})
}

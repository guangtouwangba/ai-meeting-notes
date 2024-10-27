package main

import (
	application "github.com/guangtouwangba/ai-meeting-notes/internal/application/meeting"
	"log"

	"github.com/gin-gonic/gin"
	"github.com/guangtouwangba/ai-meeting-notes/internal/domain/meeting"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func main() {
	// 设置数据库连接
	dsn := "user:password@tcp(127.0.0.1:3306)/dbname?charset=utf8mb4&parseTime=True&loc=Local"
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("无法连接到数据库: %v", err)
	}

	// 自动迁移数据库结构
	err = db.AutoMigrate(&meeting.Meeting{})
	if err != nil {
		log.Fatalf("自动迁移失败: %v", err)
	}

	// 创建repository实例
	meetingRepo := meeting.NewGormRepository(db)

	// 创建一个默认的Gin引擎
	r := gin.Default()

	// 定义一个简单的路由
	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "欢迎使用Gin HTTP服务器!",
		})
	})

	// 注册会议相关的路由
	meetingHandler := application.NewHandler(meetingRepo)
	r.POST("/meetings", meetingHandler.CreateMeeting)
	r.GET("/meetings", meetingHandler.GetMeetings)
	r.GET("/meetings/:id", meetingHandler.GetMeeting)
	r.PUT("/meetings/:id", meetingHandler.UpdateMeeting)
	r.DELETE("/meetings/:id", meetingHandler.DeleteMeeting)

	// 启动服务器
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("启动服务器失败: %v", err)
	}
}

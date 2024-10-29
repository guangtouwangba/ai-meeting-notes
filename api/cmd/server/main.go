package main

import (
	"gorm.io/driver/postgres"
	"log"

	"github.com/gin-gonic/gin"
	"github.com/guangtouwangba/ai-meeting-notes/configs"
	application "github.com/guangtouwangba/ai-meeting-notes/internal/application/meeting"
	"github.com/guangtouwangba/ai-meeting-notes/internal/domain/meeting"
	"gorm.io/gorm"
)

func main() {
	// 加载配置
	config, err := configs.LoadConfig()
	if err != nil {
		log.Fatalf("无法加载配置: %v", err)
	}
	log.Println("配置加载成功")

	log.Println("DSN: ", config.GetDSN())

	// 设置数据库连接
	db, err := gorm.Open(postgres.Open(config.GetDSN()), &gorm.Config{})
	if err != nil {
		log.Fatalf("无法连接到数据库: %v", err)
	}
	log.Println("数据库连接成功")

	// 自动迁移数据库结构
	err = db.AutoMigrate(&meeting.Meeting{})
	if err != nil {
		log.Fatalf("自动迁移失败: %v", err)
	}
	log.Println("数据库结构自动迁移成功")

	// 创建repository实例
	meetingRepo := meeting.NewGormRepository(db)
	log.Println("Meeting repository 创建成功")

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
	log.Println("所有路由注册成功")

	// 启动服务器
	log.Println("正在启动服务器...")
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("启动服务器失败: %v", err)
	}
}

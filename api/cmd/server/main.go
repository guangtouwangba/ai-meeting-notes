package main

import (
	infrastructure "github.com/guangtouwangba/ai-meeting-notes/internal/infrastructure/persistence"
	"log"

	"github.com/gin-gonic/gin"
	"github.com/guangtouwangba/ai-meeting-notes/configs"
	"github.com/guangtouwangba/ai-meeting-notes/internal/domain/meeting"
	"github.com/guangtouwangba/ai-meeting-notes/internal/interfaces/http"
	"github.com/guangtouwangba/ai-meeting-notes/internal/interfaces/websocket"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	// 加载配置
	config, err := configs.LoadConfig()
	if err != nil {
		log.Fatalf("无法加载配置: %v", err)
	}
	log.Println("配置加载成功")

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
	meetingRepo := infrastructure.NewMeetingRepository(db)
	log.Println("Meeting repository 创建成功")

	// 创建一个默认的Gin引擎
	r := gin.Default()

	// 设置CORS
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// 定义一个简单的路由
	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "欢迎使用Gin HTTP服务器!",
		})
	})

	// 注册WebSocket路由，传入数据库连接
	r.GET("/ws/recording", websocket.HandleWebSocket(db))

	// 注册会议相关的路由
	meetingHandler := http.NewMeetingHandler(meetingRepo)
	meetingHandler.RegisterRoutes(r)
	log.Println("所有路由注册成功")

	// 启动服务器
	log.Println("正在启动服务器...")
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("启动服务器失败: %v", err)
	}
}

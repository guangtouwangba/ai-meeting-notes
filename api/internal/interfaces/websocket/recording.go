package websocket

import (
	"encoding/json"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/guangtouwangba/ai-meeting-notes/configs"
	application "github.com/guangtouwangba/ai-meeting-notes/internal/application/recording"
	"github.com/guangtouwangba/ai-meeting-notes/internal/domain/recording"
	"gorm.io/gorm"
	"log"
	"net/http"
	"sync"
	"time"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // 允许所有来源，生产环境中应该更严格
	},
}

// 添加连接管理
var (
	connections = make(map[*websocket.Conn]bool)
	connMutex   sync.Mutex
)

// HandleWebSocket 处理 WebSocket 连接
func HandleWebSocket(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 升级 HTTP 连接为 WebSocket
		conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			log.Printf("Failed to upgrade connection: %v", err)
			return
		}

		log.Printf("New WebSocket connection established from: %v", conn.RemoteAddr())

		// 注册新连接
		connMutex.Lock()
		connections[conn] = true
		connMutex.Unlock()

		// 确保连接最终会被清理
		defer func() {
			log.Printf("Cleaning up connection from: %v", conn.RemoteAddr())
			connMutex.Lock()
			delete(connections, conn)
			connMutex.Unlock()
			conn.Close()
		}()

		// 初始化 recording handler
		recordingHandler, err := application.NewRecordingHandler(configs.GetConfig(), db)
		if err != nil {
			log.Printf("Error initializing recording handler: %v", err)
			return
		}

		// 设置连接参数
		conn.SetReadLimit(512 * 1024) // 设置最大消息大小为 512KB
		conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		conn.SetPongHandler(func(string) error {
			conn.SetReadDeadline(time.Now().Add(60 * time.Second))
			return nil
		})

		// 主消息处理循环
		for {
			messageType, message, err := conn.ReadMessage()
			if err != nil {
				if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
					log.Printf("Unexpected close error for connection %v: %v", conn.RemoteAddr(), err)
				}
				break
			}

			// 记录消息类型和大小
			log.Printf("Received message from %v - Type: %d, Size: %d bytes",
				conn.RemoteAddr(), messageType, len(message))

			if messageType == websocket.TextMessage {
				// 处理 JSON 消息
				var msg recording.Message
				if err := json.Unmarshal(message, &msg); err != nil {
					log.Printf("Error unmarshaling JSON from %v: %v\nRaw message: %s",
						conn.RemoteAddr(), err, string(message))
					continue
				}

				log.Printf("Received message type: %s from %v with data: %+v",
					msg.Type, conn.RemoteAddr(), msg.Data)

				switch msg.Type {
				case "start_recording":
					log.Printf("Starting recording for connection %v with data: %+v",
						conn.RemoteAddr(), msg.Data)
					recordingHandler.StartRecording(conn, msg.Data)

				case "stop_recording":
					log.Printf("Stopping recording for connection %v with data: %+v",
						conn.RemoteAddr(), msg.Data)
					recordingHandler.StopRecording(conn, msg.Data)

				case "audio_data":
					log.Printf("Received audio data from %v, data size: %d bytes",
						conn.RemoteAddr(), len(message))
					recordingHandler.ProcessAudioData(c, conn, msg.Data)

				default:
					log.Printf("Unknown message type: %s from %v with data: %+v",
						msg.Type, conn.RemoteAddr(), msg.Data)
				}
			} else if messageType == websocket.BinaryMessage {
				log.Printf("Received binary message from %v, size: %d bytes",
					conn.RemoteAddr(), len(message))
			}

			// 重置读取超时
			if err := conn.SetReadDeadline(time.Now().Add(60 * time.Second)); err != nil {
				log.Printf("Error setting read deadline for %v: %v", conn.RemoteAddr(), err)
				break
			}
		}
	}
}

// 发送消息的辅助函数
func sendMessage(conn *websocket.Conn, msg recording.Message) error {
	connMutex.Lock()
	defer connMutex.Unlock()

	if !connections[conn] {
		return websocket.ErrCloseSent
	}

	return conn.WriteJSON(msg)
}

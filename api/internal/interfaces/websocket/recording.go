package websocket

import (
	"encoding/json"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/guangtouwangba/ai-meeting-notes/configs"
	application "github.com/guangtouwangba/ai-meeting-notes/internal/application/recording"
	"github.com/guangtouwangba/ai-meeting-notes/internal/domain/recording"
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

func HandleWebSocket(c *gin.Context) {
	// 升级 HTTP 连接为 WebSocket
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Failed to upgrade connection: %v", err)
		return
	}

	// 注册新连接
	connMutex.Lock()
	connections[conn] = true
	connMutex.Unlock()

	// 确保连接最终会被清理
	defer func() {
		connMutex.Lock()
		delete(connections, conn)
		connMutex.Unlock()
		conn.Close()
	}()

	// 设置连接参数
	conn.SetReadLimit(512 * 1024) // 设置最大消息大小为 512KB
	conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	conn.SetPongHandler(func(string) error {
		conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	// 初始化 recording handler
	recordingHandler, err := application.NewRecordingHandler(configs.GetConfig())
	if err != nil {
		log.Printf("Error initializing recording handler: %v", err)
		return
	}

	// 启动 ping-pong 保活
	go func() {
		ticker := time.NewTicker(54 * time.Second)
		defer ticker.Stop()

		for {
			select {
			case <-ticker.C:
				if err := conn.WriteControl(websocket.PingMessage, []byte{}, time.Now().Add(10*time.Second)); err != nil {
					log.Printf("Failed to write ping: %v", err)
					return
				}
			}
		}
	}()

	// 主消息处理循环
	for {
		messageType, message, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("Unexpected close error: %v", err)
			}
			break
		}

		if messageType == websocket.TextMessage {
			// 处理 JSON 消息
			var msg recording.Message
			if err := json.Unmarshal(message, &msg); err != nil {
				log.Printf("Error unmarshaling JSON: %v", err)
				continue
			}

			switch msg.Type {
			case "start_recording":
				log.Printf("Received start_recording request: %+v", msg)
				recordingHandler.StartRecording(conn, msg.Data)
			case "stop_recording":
				log.Printf("Received stop_recording request: %+v", msg)
				recordingHandler.StopRecording(conn, msg.Data)
			case "audio_data":
				// 这里只是接收到了音频数据的标识，实际的音频数据会在下一个二进制消息中
				log.Printf("Received audio_data notification %v \n", msg.Data)
				recordingHandler.ProcessAudioData(conn, msg.Data)
			default:
				log.Printf("Unknown message type: %s", msg.Type)
				// 发送错误响应
				errorMsg := recording.Message{
					Type: "error",
					Data: map[string]string{
						"error": "Unknown message type",
					},
				}
				if err := conn.WriteJSON(errorMsg); err != nil {
					log.Printf("Error sending error message: %v", err)
				}
			}
		} else if messageType == websocket.BinaryMessage {
			// 处理二进制音频数据
			log.Printf("Received binary audio data, length: %d bytes", len(message))
			recordingHandler.ProcessAudioData(conn, message)
		}

		// 重置读取超时
		err = conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		if err != nil {
			return
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

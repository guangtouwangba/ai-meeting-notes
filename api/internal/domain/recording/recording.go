package recording

import (
	"github.com/gorilla/websocket"
	"time"
)

// Message 定义 WebSocket 消息结构
type Message struct {
	Type string      `json:"type"`
	Data interface{} `json:"data"`
}

// Recording 表示一个正在进行的录音会话
type Recording struct {
	ID        string
	MeetingID string
	Status    string
	Title     string
	StartTime time.Time
	Conn      *websocket.Conn
}

package recording

import (
	"github.com/gorilla/websocket"
	"log"
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
	Conn      *websocket.Conn
}

// StartRecording 开始录音
func (h *RecordingHandler) StartRecording(conn *websocket.Conn, data interface{}) {
	log.Println("Received start_recording request")
	h.mu.Lock()
	defer h.mu.Unlock()

	// 解析开始录音的参数
	startData, ok := data.(map[string]interface{})
	if !ok {
		log.Println("Invalid start recording data format:", data)
		return
	}

	log.Printf("Start recording data: %+v", startData)

	// ... 其余代码保持不变
}

// ProcessAudioData 处理音频数据
func (h *RecordingHandler) ProcessAudioData(conn *websocket.Conn, data interface{}) {
	log.Println("Received audio data")
	h.mu.RLock()
	defer h.mu.RUnlock()

	// ... 其余代码保持不变
}

// StopRecording 停止录音
func (h *RecordingHandler) StopRecording(conn *websocket.Conn, data interface{}) {
	log.Println("Received stop_recording request")
	h.mu.Lock()
	defer h.mu.Unlock()

	// ... 其余代码保持不变
}

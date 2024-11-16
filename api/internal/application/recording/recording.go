package application

import (
	"encoding/base64"
	"fmt"
	"github.com/gorilla/websocket"
	"github.com/guangtouwangba/ai-meeting-notes/configs"
	application "github.com/guangtouwangba/ai-meeting-notes/internal/application/storage"
	"github.com/guangtouwangba/ai-meeting-notes/internal/domain/recording"
	"gorm.io/gorm"
	"log"
	"sync"
	"time"
)

// RecordingHandler 处理录音相关的逻辑
type RecordingHandler struct {
	activeRecordings map[string]*recording.Recording
	mu               sync.RWMutex
	storage          application.Storage
	db               *gorm.DB
}

// NewRecordingHandler 创建新的 RecordingHandler
func NewRecordingHandler(config configs.Config, db *gorm.DB) (*RecordingHandler, error) {
	storage, err := application.NewStorage(config)
	if err != nil {
		return nil, err
	}
	return &RecordingHandler{
		activeRecordings: make(map[string]*recording.Recording),
		storage:          storage,
		db:               db,
	}, nil
}

// StartRecording 开始录音
func (h *RecordingHandler) StartRecording(conn *websocket.Conn, data interface{}) {
	h.mu.Lock()
	defer h.mu.Unlock()

	log.Printf("Starting recording with data: %+v from connection %v", data, conn.RemoteAddr())

	// 检查是否已经存在该连接的录音会话
	for id, r := range h.activeRecordings {
		if r.Conn == conn {
			log.Printf("Found existing recording session %s for connection %v", id, conn.RemoteAddr())
			return
		}
	}

	// 解析开始录音的参数
	startData, ok := data.(map[string]interface{})
	if !ok {
		log.Printf("Invalid start recording data format: %+v", data)
		return
	}

	// 创建新的录音会话
	rec := &recording.Recording{
		ID:        generateID(),
		MeetingID: startData["meeting_id"].(string),
		Title:     startData["title"].(string),
		StartTime: time.Now(),
		Status:    "recording",
		Conn:      conn,
	}

	// 保存录音会话
	h.activeRecordings[rec.ID] = rec
	log.Printf("Created new recording session: %s for connection %v", rec.ID, conn.RemoteAddr())

	// 打印当前活动的录音会话
	log.Printf("Current active recordings: %d", len(h.activeRecordings))
	for id, r := range h.activeRecordings {
		log.Printf("- Recording %s: connection %v", id, r.Conn.RemoteAddr())
	}

	// 发送确认消息给客户端
	response := recording.Message{
		Type: "recording_started",
		Data: map[string]string{
			"recording_id": rec.ID,
			"status":       rec.Status,
		},
	}

	if err := conn.WriteJSON(response); err != nil {
		log.Printf("Error sending recording started confirmation: %v", err)
		delete(h.activeRecordings, rec.ID)
		return
	}
}

// ProcessAudioData 处理音频数据
func (h *RecordingHandler) ProcessAudioData(conn *websocket.Conn, data interface{}) {
	h.mu.Lock()
	defer h.mu.Unlock()

	// 打印当前所有活动录音
	log.Printf("Current active recordings before processing: %d", len(h.activeRecordings))
	for id, r := range h.activeRecordings {
		log.Printf("- Recording %s: connection %v", id, r.Conn.RemoteAddr())
	}

	// 查找对应的录音会话
	var rec *recording.Recording
	for _, r := range h.activeRecordings {
		if r.Conn == conn {
			rec = r
			break
		}
	}

	if rec == nil {
		log.Printf("No active recording found for connection %v", conn.RemoteAddr())
		return
	}

	log.Printf("Processing audio data for recording: %s", rec.ID)

	// 处理音频数据
	audioData, ok := data.(map[string]interface{})
	if !ok {
		log.Printf("Invalid audio data format: %+v", data)
		return
	}

	// 获取 base64 音频数据
	base64Audio, ok := audioData["audio"].(string)
	if !ok {
		log.Printf("Invalid audio data format: audio field not found")
		return
	}

	// 将 base64 转换为二进制数据
	audioBytes, err := base64.StdEncoding.DecodeString(base64Audio)
	if err != nil {
		log.Printf("Error decoding base64 audio: %v", err)
		return
	}

	// 保存音频数据
	err = h.storage.SaveRecording(audioBytes, rec.ID)
	if err != nil {
		log.Printf("Error saving recording: %v", err)
		return
	}

	// 发送处理结果给客户端
	response := recording.Message{
		Type: "audio_processed",
		Data: map[string]interface{}{
			"recording_id": rec.ID,
			"status":       "processed",
		},
	}

	if err := conn.WriteJSON(response); err != nil {
		log.Printf("Error sending audio processing result: %v", err)
	}
}

// StopRecording 停止录音
func (h *RecordingHandler) StopRecording(conn *websocket.Conn, data interface{}) {
	h.mu.Lock()
	defer h.mu.Unlock()

	// 查找录音会话
	var recordingID string
	var rec *recording.Recording
	for id, r := range h.activeRecordings {
		if r.Conn == conn {
			recordingID = id
			rec = r
			break
		}
	}

	if recordingID == "" {
		log.Printf("No active recording found for connection %v", conn.RemoteAddr())
		return
	}

	log.Printf("Stopping recording session: %s", recordingID)

	// 添加一个短暂的延迟，等待最后的音频数据
	time.Sleep(500 * time.Millisecond)

	// 保存元数据到数据库
	metadata := &recording.RecordingMetadata{
		ID:        rec.ID,
		Title:     rec.Title,
		MeetingID: rec.MeetingID,
		StartTime: rec.StartTime,
		EndTime:   time.Now(),
		AudioPath: fmt.Sprintf("recordings/%s", rec.ID),
		Status:    "completed",
	}

	if err := h.db.Create(metadata).Error; err != nil {
		log.Printf("Error saving recording metadata: %v", err)
		// 即使保存元数据失败，我们仍然继续处理
	}

	// 清理资源
	delete(h.activeRecordings, recordingID)

	// 确保最后一次保存
	if cleaner, ok := h.storage.(interface{ CleanBuffer(string) }); ok {
		defer cleaner.CleanBuffer(recordingID) // 使用 defer 确保在函数结束时清理
	}

	// 发送确认消息给客户端
	response := recording.Message{
		Type: "recording_stopped",
		Data: map[string]interface{}{
			"recording_id": recordingID,
			"meeting_id":   rec.MeetingID,
			"status":       "completed",
		},
	}

	if err := conn.WriteJSON(response); err != nil {
		log.Printf("Error sending recording stopped confirmation: %v", err)
	}
}

// 生成唯一ID的辅助函数
func generateID() string {
	// 实现一个生成唯一ID的函数，可以使用 UUID 或其他方式
	return "rec_" + time.Now().Format("20060102150405")
}

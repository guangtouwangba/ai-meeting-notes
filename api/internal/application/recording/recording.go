package application

import (
	"encoding/json"
	"github.com/gorilla/websocket"
	"github.com/guangtouwangba/ai-meeting-notes/configs"
	application "github.com/guangtouwangba/ai-meeting-notes/internal/application/storage"
	"github.com/guangtouwangba/ai-meeting-notes/internal/domain/recording"
	"log"
	"sync"
	"time"
)

// RecordingHandler 处理录音相关的逻辑
type RecordingHandler struct {
	activeRecordings map[string]*recording.Recording
	mu               sync.RWMutex
	storage          application.Storage
}

// NewRecordingHandler 创建新的 RecordingHandler
func NewRecordingHandler(config configs.Config) (*RecordingHandler, error) {
	storage, err := application.NewStorage(config)
	if err != nil {
		return nil, err
	}
	return &RecordingHandler{
		activeRecordings: make(map[string]*recording.Recording),
		storage:          storage,
	}, nil
}

// StartRecording 开始录音
func (h *RecordingHandler) StartRecording(conn *websocket.Conn, data interface{}) {
	h.mu.Lock()
	defer h.mu.Unlock()

	// 解析开始录音的参数
	startData, ok := data.(map[string]interface{})
	if !ok {
		log.Println("Invalid start r data format")
		return
	}

	// 创建新的录音会话
	r := &recording.Recording{
		ID:        generateID(), // 实现一个生成唯一ID的函数
		MeetingID: startData["meeting_id"].(string),
		Status:    "r",
		Conn:      conn,
	}

	// 保存录音会话
	h.activeRecordings[r.ID] = r

	// 发送确认消息给客户端
	response := recording.Message{
		Type: "recording_started",
		Data: map[string]string{
			"recording_id": r.ID,
			"status":       r.Status,
		},
	}

	if err := conn.WriteJSON(response); err != nil {
		log.Printf("Error sending r started confirmation: %v", err)
	}

	log.Printf("Started r session: %s", r.ID)
}

// ProcessAudioData 处理音频数据
func (h *RecordingHandler) ProcessAudioData(conn *websocket.Conn, data interface{}) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	// 查找对应的录音会话
	var r *recording.Recording
	for _, r := range h.activeRecordings {
		if r.Conn == conn {
			r = r
			break
		}
	}

	if r == nil {
		log.Println("No active r found for this connection")
		return
	}

	// 处理音频数据
	audioData, ok := data.(map[string]interface{})
	if !ok {
		log.Println("Invalid audio data format")
		return
	}

	// 将音频数据转换为 []byte
	// 假设 audioData 中包含音频的字节数据，可能需要根据实际情况进行调整
	audioBytes, err := json.Marshal(audioData) // 将 map 转换为 JSON 字符串
	if err != nil {
		log.Println("Error marshaling audio data:", err)
		return
	}

	// 保存音频数据
	err = h.storage.SaveRecording(audioBytes, r.ID) // 传递 []byte 类型的数据
	if err != nil {
		log.Println("Error saving recording:", err)
		return
	}

	// TODO: 实现实时转录逻辑

	// 3. 发送转录结果给客户端
	//transcript, err := h.transcriptionService.TranscribeAudio(audioData)
	//if err != nil {
	//	log.Printf("Error transcribing audio: %v", err)
	//	return
	//}

	// 发送处理结果给客户端
	response := recording.Message{
		Type: "audio_processed",
		Data: map[string]interface{}{
			"recording_id": r.ID,
			"status":       "processed",
			// 添加转录结果等其他数据
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

	// 查找并移除录音会话
	var recordingID string
	for id, r := range h.activeRecordings {
		if r.Conn == conn {
			recordingID = id
			break
		}
	}

	if recordingID == "" {
		log.Println("No active recording found for this connection")
		return
	}

	// 清理资源
	r := h.activeRecordings[recordingID]
	delete(h.activeRecordings, recordingID)

	// TODO: 实现录音完成后的处理逻辑
	// 1. 保存完整的录音文件
	// 2. 更新数据库记录
	// 3. 生成最终��转录文本

	// 发送确认消息给客户端
	response := recording.Message{
		Type: "recording_stopped",
		Data: map[string]interface{}{
			"recording_id": recordingID,
			"meeting_id":   r.MeetingID,
			"status":       "completed",
		},
	}

	if err := conn.WriteJSON(response); err != nil {
		log.Printf("Error sending recording stopped confirmation: %v", err)
	}

	log.Printf("Stopped recording session: %s", recordingID)
}

// 生成唯一ID的辅助函数
func generateID() string {
	// 实现一个生成唯一ID的函数，可以使用 UUID 或其他方式
	return "rec_" + time.Now().Format("20060102150405")
}

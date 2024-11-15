package main

import (
	"encoding/json"
	"log"
	"math/rand"
	"testing"
	"time"

	"github.com/gorilla/websocket"
	"github.com/guangtouwangba/ai-meeting-notes/internal/domain/recording"
)

const (
	websocketServerURL = "ws://localhost:8080/ws/recording"
	numMessages        = 10
	messageSize        = 1024
	messageInterval    = 100 * time.Millisecond
)

func Test_server(t *testing.T) {
	// 连接到WebSocket服务器
	c, _, err := websocket.DefaultDialer.Dial(websocketServerURL, nil)
	if err != nil {
		log.Fatal("dial:", err)
	}
	defer c.Close()

	// 启动一个goroutine来读取服务器的响应
	go func() {
		for {
			_, message, err := c.ReadMessage()
			if err != nil {
				log.Println("read:", err)
				return
			}
			// 解析服务器响应
			var response recording.Message
			if err := json.Unmarshal(message, &response); err != nil {
				log.Printf("Error parsing response: %v", err)
				continue
			}
			log.Printf("Received message type: %s, data: %+v", response.Type, response.Data)
		}
	}()

	// 发送开始录音消息
	startMsg := recording.Message{
		Type: "start_recording",
		Data: map[string]interface{}{
			"meeting_id": "test_meeting_" + time.Now().Format("20060102150405"),
			"title":      "Test Recording",
		},
	}

	log.Printf("Sending start recording message: %+v", startMsg)
	if err := c.WriteJSON(startMsg); err != nil {
		t.Fatalf("Failed to send start message: %v", err)
	}

	// 等待一会儿确保录音已经开始
	time.Sleep(time.Second)

	// 发送模拟的音频数据
	for i := 0; i < numMessages; i++ {
		audioData := generateRandomAudioData(messageSize)

		// 发送音频数据消息
		audioMsg := recording.Message{
			Type: "audio_data",
			Data: map[string]interface{}{
				"audio":     audioData,
				"timestamp": time.Now().Unix(),
			},
		}

		if err := c.WriteJSON(audioMsg); err != nil {
			t.Fatalf("Failed to send audio data: %v", err)
		}
		log.Printf("Sent audio data chunk %d", i+1)
		time.Sleep(messageInterval)
	}

	// 发送停止录音消息
	stopMsg := recording.Message{
		Type: "stop_recording",
		Data: map[string]interface{}{},
	}

	log.Printf("Sending stop recording message")
	if err := c.WriteJSON(stopMsg); err != nil {
		t.Fatalf("Failed to send stop message: %v", err)
	}

	// 等待一段时间以确保所有响应都被接收
	time.Sleep(2 * time.Second)
}

// 生成随机的"音频"数据
func generateRandomAudioData(size int) []byte {
	audioData := make([]byte, size)
	rand.Read(audioData)
	return audioData
}

// 添加一个辅助函数来打印消息内容
func prettyPrint(v interface{}) string {
	b, _ := json.MarshalIndent(v, "", "  ")
	return string(b)
}

// 添加一个测试用例来测试连接和基本消息
func Test_Connection(t *testing.T) {
	// 连接到WebSocket服务器
	c, _, err := websocket.DefaultDialer.Dial(websocketServerURL, nil)
	if err != nil {
		t.Fatalf("Failed to connect to WebSocket server: %v", err)
	}
	defer c.Close()

	// 发送一个简单的消息来测试连接
	testMsg := recording.Message{
		Type: "start_recording",
		Data: map[string]interface{}{
			"meeting_id": "test_connection",
			"title":      "Connection Test",
		},
	}

	if err := c.WriteJSON(testMsg); err != nil {
		t.Fatalf("Failed to send test message: %v", err)
	}

	// 等待并读取响应
	_, message, err := c.ReadMessage()
	if err != nil {
		t.Fatalf("Failed to read response: %v", err)
	}

	var response recording.Message
	if err := json.Unmarshal(message, &response); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if response.Type != "recording_started" {
		t.Errorf("Expected response type 'recording_started', got '%s'", response.Type)
	}

	// 发送停止消息
	stopMsg := recording.Message{
		Type: "stop_recording",
		Data: map[string]interface{}{},
	}

	if err := c.WriteJSON(stopMsg); err != nil {
		t.Fatalf("Failed to send stop message: %v", err)
	}

	// 等待最后的响应
	time.Sleep(time.Second)
}

package infrastructure

import (
	"context"
	"fmt"
	"log"
	"os"
	"sync"
)

type LocalStorage struct {
	basePath     string
	audioBuffers map[string][]byte
	mu           sync.Mutex
}

func (s *LocalStorage) GetRecording(ctx context.Context, recordingID string) ([]byte, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	filename := fmt.Sprintf("recordings/%s.webm", recordingID)
	data, err := os.ReadFile(filename)
	if err != nil {
		return nil, fmt.Errorf("failed to read audio file: %v", err)
	}
	return data, nil
}

func NewLocalStorage(basePath string) *LocalStorage {
	// 如果basePath为空，则使用默认路径
	if basePath == "" {
		basePath = "./recordings"
	}
	return &LocalStorage{
		basePath:     basePath,
		audioBuffers: make(map[string][]byte),
	}
}

func (s *LocalStorage) SaveRecording(ctx context.Context, data []byte, recordingID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	log.Printf("Saving recording data: size=%d bytes, recordingID=%s", len(data), recordingID)

	// 确保目录存在
	if err := os.MkdirAll("recordings", 0755); err != nil {
		return fmt.Errorf("failed to create recordings directory: %v", err)
	}

	// 初始化或追加数据
	if _, exists := s.audioBuffers[recordingID]; !exists {
		log.Printf("Initializing buffer for recording %s", recordingID)
		s.audioBuffers[recordingID] = data
	} else {
		log.Printf("Appending data to existing buffer for recording %s", recordingID)
		s.audioBuffers[recordingID] = append(s.audioBuffers[recordingID], data...)
	}

	log.Printf("Total buffer size for recording %s: %d bytes", recordingID, len(s.audioBuffers[recordingID]))

	// 写入完整文件
	filename := fmt.Sprintf("recordings/%s.webm", recordingID)
	if err := os.WriteFile(filename, s.audioBuffers[recordingID], 0644); err != nil {
		return fmt.Errorf("failed to write audio file: %v", err)
	}

	log.Printf("Successfully saved recording to %s", filename)
	return nil
}

func (s *LocalStorage) CleanBuffer(recordingID string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.audioBuffers, recordingID)
}

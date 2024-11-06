package infrastructure

import (
	"os"
	"path/filepath"
)

type LocalStorage struct {
	basePath string
}

func NewLocalStorage(basePath string) *LocalStorage {
	// 如果basePath为空，则使用默认路径
	if basePath == "" {
		basePath = "./recordings"
	}
	return &LocalStorage{basePath: basePath}
}

func (s *LocalStorage) SaveRecording(data []byte, recordingID string) error {
	filePath := filepath.Join(s.basePath, recordingID)
	return os.WriteFile(filePath, data, 0644)
}

func (s *LocalStorage) GetRecording(recordingID string) ([]byte, error) {
	filePath := filepath.Join(s.basePath, recordingID)
	return os.ReadFile(filePath)
}

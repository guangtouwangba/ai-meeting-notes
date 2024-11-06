package application

import (
	"fmt"
	"github.com/guangtouwangba/ai-meeting-notes/configs"
	infrastructure "github.com/guangtouwangba/ai-meeting-notes/internal/infrastructure/storage"
)

type Storage interface {
	SaveRecording(data []byte, recordingID string) error
	GetRecording(recordingID string) ([]byte, error)
}

func NewStorage(config configs.Config) (Storage, error) {
	switch config.StorageType {
	case "local":
		return &infrastructure.LocalStorage{}, nil
	}
	return nil, fmt.Errorf("invalid storage type: %s", config.StorageType)
}

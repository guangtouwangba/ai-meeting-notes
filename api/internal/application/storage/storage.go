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
		return infrastructure.NewLocalStorage(""), nil
	case "aws":
		return infrastructure.NewAwsStorage(
			infrastructure.AWSConfig{
				Region:     config.AWSRegion,
				AccessKey:  config.AWSAccessKey,
				SecretKey:  config.AWSSecretKey,
				BucketName: config.BucketName,
			},
		), nil
	}
	return nil, fmt.Errorf("invalid storage type: %s", config.StorageType)
}

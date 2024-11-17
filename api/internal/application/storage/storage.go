package application

import (
	"context"
	"fmt"
	"github.com/guangtouwangba/ai-meeting-notes/configs"
	infrastructure "github.com/guangtouwangba/ai-meeting-notes/internal/infrastructure/storage"
)

type Storage interface {
	SaveRecording(ctx context.Context, data []byte, recordingID string) error
	GetRecording(ctx context.Context, recordingID string) ([]byte, error)
}

func NewStorage(config configs.Config) (Storage, error) {
	switch config.StorageType {
	case "local":
		return infrastructure.NewLocalStorage(""), nil
	case "aws":
		storage, err := infrastructure.NewAwsStorage(
			infrastructure.AWSConfig{
				Region:     config.AWSRegion,
				AccessKey:  config.AWSAccessKey,
				SecretKey:  config.AWSSecretKey,
				BucketName: config.BucketName,
			},
		)
		if err != nil {
			return nil, fmt.Errorf("failed to create AWS storage: %v", err)
		}
		return storage, nil
	}
	return nil, fmt.Errorf("invalid storage type: %s", config.StorageType)
}

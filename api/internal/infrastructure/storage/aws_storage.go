package infrastructure

import (
	"bytes"
	"context"
	"fmt"
	"github.com/sirupsen/logrus"
	"io"
	"sync"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type AwsStorage struct {
	bucketName   string
	s3Client     *s3.Client
	audioBuffers map[string][]byte
	mu           sync.Mutex
}

type AWSConfig struct {
	Region     string
	AccessKey  string
	SecretKey  string
	BucketName string
	Endpoint   string
}

func NewAwsStorage(awsConfig AWSConfig) (*AwsStorage, error) {
	if awsConfig.Endpoint == "" {
		awsConfig.Endpoint = fmt.Sprintf("https://s3.%s.amazonaws.com", awsConfig.Region)
	}

	cfg, err := config.LoadDefaultConfig(context.Background(),
		config.WithRegion(awsConfig.Region),
		config.WithCredentialsProvider(aws.CredentialsProviderFunc(func(ctx context.Context) (aws.Credentials, error) {
			return aws.Credentials{
				AccessKeyID:     awsConfig.AccessKey,
				SecretAccessKey: awsConfig.SecretKey,
			}, nil
		})))

	if err != nil {
		return nil, fmt.Errorf("unable to load SDK config: %w", err)
	}

	client := s3.NewFromConfig(cfg)

	return &AwsStorage{
		s3Client:     client,
		bucketName:   awsConfig.BucketName,
		audioBuffers: make(map[string][]byte),
	}, nil
}

func (s *AwsStorage) SaveRecording(ctx context.Context, data []byte, recordingID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	logrus.Infof("Processing recording data: size=%d bytes, recordingID=%s", len(data), recordingID)

	if _, exists := s.audioBuffers[recordingID]; !exists {
		logrus.Infof("Initializing buffer for recording %s", recordingID)
		s.audioBuffers[recordingID] = data
	} else {
		logrus.Infof("Appending data to existing buffer for recording %s", recordingID)
		s.audioBuffers[recordingID] = append(s.audioBuffers[recordingID], data...)
	}

	totalSize := len(s.audioBuffers[recordingID])
	logrus.Infof("Total buffer size for recording %s: %d bytes", recordingID, totalSize)

	key := fmt.Sprintf("recordings/%s.webm", recordingID)

	_, err := s.s3Client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(s.bucketName),
		Key:         aws.String(key),
		Body:        bytes.NewReader(s.audioBuffers[recordingID]),
		ContentType: aws.String("audio/webm"),
	})
	if err != nil {
		logrus.Errorf("Failed to save recording to S3: %v", err)
		return fmt.Errorf("failed to save recording to S3: %w", err)
	}

	logrus.Infof("Successfully saved recording %s to S3", recordingID)
	return nil
}

func (s *AwsStorage) GetRecording(ctx context.Context, recordingID string) ([]byte, error) {
	key := fmt.Sprintf("recordings/%s.webm", recordingID)

	resp, err := s.s3Client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(s.bucketName),
		Key:    aws.String(key),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get recording from S3: %w", err)
	}
	defer resp.Body.Close()
	return io.ReadAll(resp.Body)
}

func (s *AwsStorage) CleanBuffer(recordingID string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.audioBuffers, recordingID)
	logrus.Infof("Cleaned buffer for recording %s", recordingID)
}

package infrastructure

import (
	"bytes"
	"context"
	"fmt"
	"io"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type AwsStorage struct {
	bucketName string
	s3Client   *s3.Client
}

type AWSConfig struct {
	Region     string
	AccessKey  string
	SecretKey  string
	BucketName string
}

func NewAwsStorage(awsConfig AWSConfig) *AwsStorage {
	client := s3.NewFromConfig(aws.Config{
		Region: awsConfig.Region,
		Credentials: aws.CredentialsProviderFunc(func(ctx context.Context) (aws.Credentials, error) {
			return aws.Credentials{
				AccessKeyID:     awsConfig.AccessKey,
				SecretAccessKey: awsConfig.SecretKey,
			}, nil
		}),
	})
	return &AwsStorage{
		s3Client:   client,
		bucketName: awsConfig.BucketName,
	}
}

func (s *AwsStorage) SaveRecording(data []byte, recordingID string) error {
	_, err := s.s3Client.PutObject(context.Background(), &s3.PutObjectInput{
		Bucket: aws.String(s.bucketName),
		Key:    aws.String(recordingID),
		Body:   bytes.NewReader(data),
	})
	if err != nil {
		return fmt.Errorf("failed to save recording to S3: %w", err)
	}
	return nil
}

func (s *AwsStorage) GetRecording(recordingID string) ([]byte, error) {
	resp, err := s.s3Client.GetObject(context.Background(), &s3.GetObjectInput{
		Bucket: aws.String(s.bucketName),
		Key:    aws.String(recordingID),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get recording from S3: %w", err)
	}
	defer resp.Body.Close()
	return io.ReadAll(resp.Body)
}

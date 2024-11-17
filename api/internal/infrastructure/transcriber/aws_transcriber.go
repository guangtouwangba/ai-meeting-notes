package transcriber

import (
	"context"
	"fmt"
	"github.com/aws/aws-sdk-go-v2/aws"
	transcriberType "github.com/aws/aws-sdk-go-v2/service/transcribe/types"
	"github.com/aws/aws-sdk-go-v2/service/transcribestreaming/types"
	"github.com/guangtouwangba/ai-meeting-notes/internal/application/transcriber"
	"io"
	"time"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/transcribe"
	"github.com/aws/aws-sdk-go-v2/service/transcribestreaming"
)

type AWSTranscriber struct {
	streamingClient *transcribestreaming.Client
	batchClient     *transcribe.Client
	config          AWSTranscriberConfig
}

type AWSTranscriberConfig struct {
	Region    string
	AccessKey string
	SecretKey string
}

func NewAWSTranscriber(configs AWSTranscriberConfig) (*AWSTranscriber, error) {
	// 创建 AWS 配置
	cfg, err := config.LoadDefaultConfig(context.Background(),
		config.WithRegion(configs.Region),
		config.WithCredentialsProvider(aws.CredentialsProviderFunc(func(ctx context.Context) (aws.Credentials, error) {
			return aws.Credentials{
				AccessKeyID:     configs.AccessKey,
				SecretAccessKey: configs.SecretKey,
			}, nil
		})))

	if err != nil {
		return nil, fmt.Errorf("unable to load AWS SDK config: %w", err)
	}

	// 创建流式和批处理客户端
	streamingClient := transcribestreaming.NewFromConfig(cfg)
	batchClient := transcribe.NewFromConfig(cfg)

	return &AWSTranscriber{
		streamingClient: streamingClient,
		batchClient:     batchClient,
		config:          configs,
	}, nil
}

// StartStreamTranscription 实现实时流式转录
func (t *AWSTranscriber) StartStreamTranscription(
	ctx context.Context,
	config transcriber.TranscriptionConfig,
	callback transcriber.TranscriptionCallback,
) (chan<- []byte, <-chan error, error) {
	audioChan := make(chan []byte, 100)
	errChan := make(chan error, 1)

	// 创建流式转录请求
	input := &transcribestreaming.StartStreamTranscriptionInput{
		LanguageCode:         types.LanguageCode(getAWSLanguageCode(config.Language)),
		MediaEncoding:        types.MediaEncodingPcm,
		MediaSampleRateHertz: aws.Int32(16000),
	}

	go func() {
		defer close(errChan)

		// 创建事件流
		stream, err := t.streamingClient.StartStreamTranscription(ctx, input)
		if err != nil {
			errChan <- fmt.Errorf("failed to start stream transcription: %w", err)
			return
		}

		eventStream := stream.GetStream()

		// 处理音频输入
		go func() {
			for audioChunk := range audioChan {
				if err := eventStream.Send(ctx, &types.AudioStreamMemberAudioEvent{
					Value: types.AudioEvent{
						AudioChunk: audioChunk,
					},
				}); err != nil {
					errChan <- fmt.Errorf("failed to send audio chunk: %w", err)
					return
				}
			}
		}()

		// 处理转录结果
		for event := range eventStream.Events() {
			// 使用类型断言获取 TranscriptEvent
			if transcriptEvent, ok := event.(*types.TranscriptResultStreamMemberTranscriptEvent); ok {
				// 现在可以安全地访问 Value 字段
				result := transcriptEvent.Value

				// 处理转录结果
				for _, res := range result.Transcript.Results {
					// 只处理非部分结果
					if !res.IsPartial {
						// 构建转录结果
						transcriptionResult := transcriber.TranscriptionResult{
							Text: *res.Alternatives[0].Transcript,
						}

						// 如果有置信度信息
						if len(res.Alternatives[0].Items) > 0 && res.Alternatives[0].Items[0].Confidence != nil {
							transcriptionResult.Confidence = float64(*res.Alternatives[0].Items[0].Confidence)
						}

						// 如果启用了时间戳
						if len(res.Alternatives[0].Items) > 0 {
							var timestamps []transcriber.TimeStamp
							for _, item := range res.Alternatives[0].Items {
								timestamp := transcriber.TimeStamp{
									Word:      *item.Content,
									StartTime: int64(item.StartTime * 1000), // 转换为毫秒
									EndTime:   int64(item.EndTime * 1000),   // 转换为毫秒
								}
								timestamps = append(timestamps, timestamp)
							}
							transcriptionResult.Timestamps = timestamps
						}

						// 调用回调
						if err := callback(transcriptionResult); err != nil {
							errChan <- fmt.Errorf("callback error: %w", err)
							return
						}
					}
				}
			}
		}
	}()

	return audioChan, errChan, nil
}

// TranscribeFile 实现文件转录
func (t *AWSTranscriber) TranscribeFile(
	ctx context.Context,
	audioSource string,
	format transcriber.AudioFormat,
	config transcriber.TranscriptionConfig,
) (*transcriber.TranscriptionResult, error) {
	jobName := fmt.Sprintf("transcription-%d", time.Now().Unix())

	input := &transcribe.StartTranscriptionJobInput{
		TranscriptionJobName: aws.String(jobName),
		Media: &transcriberType.Media{
			MediaFileUri: aws.String(audioSource),
		},
		LanguageCode: getAWSLanguageCode(config.Language),
		Settings: &transcriberType.Settings{
			ShowSpeakerLabels: aws.Bool(true),
			MaxSpeakerLabels:  aws.Int32(2),
		},
	}

	_, err := t.batchClient.StartTranscriptionJob(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("failed to start transcription job: %w", err)
	}

	// 等待任务完成
	for {
		output, err := t.batchClient.GetTranscriptionJob(ctx, &transcribe.GetTranscriptionJobInput{
			TranscriptionJobName: aws.String(jobName),
		})
		if err != nil {
			return nil, fmt.Errorf("failed to get transcription job status: %w", err)
		}

		status := output.TranscriptionJob.TranscriptionJobStatus
		if status == "COMPLETED" {
			// 处理并返回结果
			return processTranscriptionResult(output.TranscriptionJob.Transcript)
		} else if status == "FAILED" {
			return nil, fmt.Errorf("transcription job failed: %v",
				output.TranscriptionJob.FailureReason)
		}

		time.Sleep(5 * time.Second)
	}
}

// TranscribeReader 实现从 Reader 转录
func (t *AWSTranscriber) TranscribeReader(
	ctx context.Context,
	reader io.Reader,
	format transcriber.AudioFormat,
	config transcriber.TranscriptionConfig,
) (*transcriber.TranscriptionResult, error) {
	// 创建一个缓冲通道
	//audioChan := make(chan []byte, 100)
	resultChan := make(chan transcriber.TranscriptionResult, 1)
	errChan := make(chan error, 1)

	// 启动流式转录
	inputChan, transcribeErrChan, err := t.StartStreamTranscription(ctx, config,
		func(result transcriber.TranscriptionResult) error {
			resultChan <- result
			return nil
		})
	if err != nil {
		return nil, fmt.Errorf("failed to start stream transcription: %w", err)
	}

	// 读取音频数据并发送
	go func() {
		buffer := make([]byte, 1024)
		for {
			n, err := reader.Read(buffer)
			if err == io.EOF {
				close(inputChan)
				break
			}
			if err != nil {
				errChan <- fmt.Errorf("failed to read audio data: %w", err)
				return
			}
			inputChan <- buffer[:n]
		}
	}()

	// 等待结果或错误
	select {
	case result := <-resultChan:
		return &result, nil
	case err := <-transcribeErrChan:
		return nil, err
	case err := <-errChan:
		return nil, err
	case <-ctx.Done():
		return nil, ctx.Err()
	}
}

// GetTranscriptionStatus 实现获取转录状态
func (t *AWSTranscriber) GetTranscriptionStatus(
	ctx context.Context,
	taskID string,
) (transcriber.TranscriptionStatus, error) {
	output, err := t.batchClient.GetTranscriptionJob(ctx, &transcribe.GetTranscriptionJobInput{
		TranscriptionJobName: aws.String(taskID),
	})
	if err != nil {
		return transcriber.TranscriptionStatus{}, fmt.Errorf("failed to get transcription status: %w", err)
	}

	status := transcriber.TranscriptionStatus{
		TaskID: taskID,
		Status: string(output.TranscriptionJob.TranscriptionJobStatus),
	}

	if output.TranscriptionJob.CompletionTime != nil {
		if output.TranscriptionJob.TranscriptionJobStatus == "COMPLETED" {
			result, err := processTranscriptionResult(output.TranscriptionJob.Transcript)
			if err != nil {
				return status, err
			}
			status.Result = result
		}
	}

	return status, nil
}

// CancelTranscription 实现取消转录任务
func (t *AWSTranscriber) CancelTranscription(ctx context.Context, taskID string) error {
	_, err := t.batchClient.DeleteTranscriptionJob(ctx, &transcribe.DeleteTranscriptionJobInput{
		TranscriptionJobName: aws.String(taskID),
	})
	if err != nil {
		return fmt.Errorf("failed to cancel transcription job: %w", err)
	}
	return nil
}

// 辅助函数
func getAWSLanguageCode(language string) transcriberType.LanguageCode {
	switch language {
	case "zh-CN":
		return transcriberType.LanguageCodeZhCn
	case "en-US":
		return transcriberType.LanguageCodeEnUs
	default:
		return transcriberType.LanguageCodeEnUs
	}
}

func processTranscriptionResult(transcript *transcriberType.Transcript) (*transcriber.TranscriptionResult, error) {
	// 处理转录结果
	// 这里需要根据实际的 AWS 响应格式进行解析
	return &transcriber.TranscriptionResult{
		Text: "Processed transcript",
		// ... 其他字段
	}, nil
}

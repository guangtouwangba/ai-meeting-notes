package transcriber

import (
	"context"
	"io"
)

// AudioSource 定义音频来源类型
type AudioSource int

const (
	// AudioSourceStream 实时音频流
	AudioSourceStream AudioSource = iota
	// AudioSourceFile 已存储的音频文件
	AudioSourceFile
)

// AudioFormat 定义音频格式
type AudioFormat struct {
	// MimeType 音频MIME类型，如 "audio/webm"
	MimeType string
	// SampleRate 采样率，如 16000
	SampleRate int
	// Channels 声道数，如 1（单声道）或 2（立体声）
	Channels int
	// Encoding 编码方式，如 "LINEAR16", "OPUS" 等
	Encoding string
}

// TranscriptionConfig 转录配置
type TranscriptionConfig struct {
	// Language 音频语言，如 "zh-CN"
	Language string
	// EnablePunctuation 是否启用标点符号
	EnablePunctuation bool
	// EnableWordTimestamps 是否启用词级别时间戳
	EnableWordTimestamps bool
	// CustomVocabulary 自定义词汇列表
	CustomVocabulary []string
}

// TranscriptionResult 转录结果
type TranscriptionResult struct {
	// Text 转录文本
	Text string
	// Confidence 置信度 0-1
	Confidence float64
	// Timestamps 时间戳信息（如果启用）
	Timestamps []TimeStamp
	// Segments 分段信息
	Segments []Segment
}

// TimeStamp 时间戳信息
type TimeStamp struct {
	// Word 单词或短语
	Word string
	// StartTime 开始时间（毫秒）
	StartTime int64
	// EndTime 结束时间（毫秒）
	EndTime int64
}

// Segment 音频分段信息
type Segment struct {
	// Text 分段文本
	Text string
	// StartTime 开始时间（毫秒）
	StartTime int64
	// EndTime 结束时间（毫秒）
	EndTime int64
	// SpeakerID 说话人ID（如果支持说话人分离）
	SpeakerID string
}

// TranscriptionCallback 转录回调函数
type TranscriptionCallback func(TranscriptionResult) error

// Transcriber 转录器接口
type Transcriber interface {
	// StartStreamTranscription 开始流式转录
	// 返回一个用于发送音频数据的 channel 和一个错误 channel
	StartStreamTranscription(ctx context.Context, config TranscriptionConfig, callback TranscriptionCallback) (chan<- []byte, <-chan error, error)

	// TranscribeFile 转录已存储的音频文件
	// audioSource 可以是本地文件路径、URL 或 云存储路径
	TranscribeFile(ctx context.Context, audioSource string, format AudioFormat, config TranscriptionConfig) (*TranscriptionResult, error)

	// TranscribeReader 从 io.Reader 转录音频
	TranscribeReader(ctx context.Context, reader io.Reader, format AudioFormat, config TranscriptionConfig) (*TranscriptionResult, error)

	// GetTranscriptionStatus 获取转录任务状态
	GetTranscriptionStatus(ctx context.Context, taskID string) (TranscriptionStatus, error)

	// CancelTranscription 取消转录任务
	CancelTranscription(ctx context.Context, taskID string) error
}

// TranscriptionStatus 转录任务状态
type TranscriptionStatus struct {
	// TaskID 任务ID
	TaskID string
	// Status 状态：queued, processing, completed, failed
	Status string
	// Progress 进度（0-100）
	Progress int
	// Error 错误信息（如果有）
	Error string
	// Result 转录结果（如果完成）
	Result *TranscriptionResult
}

// TranscriberFactory 转录器工厂
type TranscriberFactory interface {
	// CreateTranscriber 创建转录器实例
	CreateTranscriber(config map[string]interface{}) (Transcriber, error)
}

func NewTranscriber(config map[string]interface{}) (Transcriber, error) {
	return nil, nil
}

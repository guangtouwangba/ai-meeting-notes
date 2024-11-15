package recording

import "time"

type RecordingMetadata struct {
	ID        string    `json:"id" gorm:"primaryKey"`
	Title     string    `json:"title"`
	MeetingID string    `json:"meeting_id"`
	StartTime time.Time `json:"start_time"`
	EndTime   time.Time `json:"end_time"`
	AudioPath string    `json:"audio_path"` // 音频文件的存储路径
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

package meeting

import (
	"context"
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"
)

// Meeting 代表一个会议实体
type Meeting struct {
	ID                  string              `json:"id" gorm:"primaryKey;type:uuid"`
	Title               string              `json:"title"`
	Description         string              `json:"description"`
	TargetLang          string              `json:"target_lang"`
	SourceLang          string              `json:"source_lang"`
	StartTime           time.Time           `json:"start_time"`
	EndTime             time.Time           `json:"end_time"`
	Speaker             string              `json:"speaker"`
	TranscriberSettings TranscriberSettings `json:"transcriber_settings" gorm:"type:jsonb"` // 使用 JSONB 类型
}

// TranscriberSettings 转录设置
type TranscriberSettings struct {
	RealTimeTranslation      bool `json:"real_time_translation"`
	SpeakerIdentification    bool `json:"speaker_identification"`
	TechnicalTermRecognition bool `json:"technical_term_recognition"`
}

// Scan 实现 sql.Scanner 接口
func (ts *TranscriberSettings) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("failed to unmarshal JSONB value")
	}

	return json.Unmarshal(bytes, &ts)
}

// Value 实现 driver.Valuer 接口
func (ts TranscriberSettings) Value() (driver.Value, error) {
	return json.Marshal(ts)
}

// PaginatedMeetings 分页响应结构
type PaginatedMeetings struct {
	Total    int64      `json:"total"`     // 总记录数
	Page     int        `json:"page"`      // 当前页码
	PageSize int        `json:"page_size"` // 每页大小
	Data     []*Meeting `json:"data"`      // 会议列表
}

type Repository interface {
	Create(ctx context.Context, meeting *Meeting) error
	GetByID(ctx context.Context, id string) (*Meeting, error)
	GetPaginated(ctx context.Context, page, pageSize int) (*PaginatedMeetings, error)
	Update(ctx context.Context, meeting *Meeting) error
	Delete(ctx context.Context, id string) error
}

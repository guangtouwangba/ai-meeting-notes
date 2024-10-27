package meeting

import (
	"context"
	"time"
)

// Meeting 代表一个会议实体
type Meeting struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	StartTime time.Time `json:"start_time"`
	EndTime   time.Time `json:"end_time"`
}

// Repository 定义了会议仓储的接口
type Repository interface {
	Create(ctx context.Context, meeting *Meeting) error
	GetByID(ctx context.Context, id string) (*Meeting, error)
	GetAll(ctx context.Context) ([]*Meeting, error)
	Update(ctx context.Context, meeting *Meeting) error
	Delete(ctx context.Context, id string) error
}

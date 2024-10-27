package meeting

import (
	"context"
	"time"
)

// internal/domain/meeting/meeting.go
type Meeting struct {
	ID        string
	Title     string
	StartTime time.Time
	Status    MeetingStatus
	// ...其他字段
}

type MeetingRepository interface {
	Create(ctx context.Context, meeting *Meeting) error
	FindByID(ctx context.Context, id string) (*Meeting, error)
	// ...其他方法
}

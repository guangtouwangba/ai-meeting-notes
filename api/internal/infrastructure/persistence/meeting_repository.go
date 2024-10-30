package persistence

import (
	"context"

	"github.com/google/uuid"
	"github.com/guangtouwangba/ai-meeting-notes/internal/domain/meeting"
	"gorm.io/gorm"
)

type MeetingRepository struct {
	db *gorm.DB
}

func NewMeetingRepository(db *gorm.DB) meeting.Repository {
	return &MeetingRepository{db: db}
}

func (r *MeetingRepository) Create(ctx context.Context, meeting *meeting.Meeting) error {
	// 生成新的 UUID 作为会议 ID
	meeting.ID = uuid.New().String()
	return r.db.WithContext(ctx).Create(meeting).Error
}

func (r *MeetingRepository) GetByID(ctx context.Context, id string) (*meeting.Meeting, error) {
	var m meeting.Meeting
	if err := r.db.WithContext(ctx).First(&m, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *MeetingRepository) GetPaginated(ctx context.Context, page, pageSize int) (*meeting.PaginatedMeetings, error) {
	var total int64
	var meetings []*meeting.Meeting

	// 计算总记录数
	if err := r.db.WithContext(ctx).Model(&meeting.Meeting{}).Count(&total).Error; err != nil {
		return nil, err
	}

	// 获取分页数据
	offset := (page - 1) * pageSize
	if err := r.db.WithContext(ctx).
		Offset(offset).
		Limit(pageSize).
		Order("start_time DESC"). // 按开始时间倒序排序
		Find(&meetings).Error; err != nil {
		return nil, err
	}

	return &meeting.PaginatedMeetings{
		Total:    total,
		Page:     page,
		PageSize: pageSize,
		Data:     meetings,
	}, nil
}

func (r *MeetingRepository) Update(ctx context.Context, meeting *meeting.Meeting) error {
	return r.db.WithContext(ctx).Save(meeting).Error
}

func (r *MeetingRepository) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&meeting.Meeting{}, "id = ?", id).Error
}

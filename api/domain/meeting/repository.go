package meeting

import (
	"context"
	"errors"

	"gorm.io/gorm"
)

// GormRepository 是Repository接口的GORM实现
type GormRepository struct {
	db *gorm.DB
}

// NewGormRepository 创建一个新的GormRepository实例
func NewGormRepository(db *gorm.DB) *GormRepository {
	return &GormRepository{db: db}
}

// Create 创建一个新的会议
func (r *GormRepository) Create(ctx context.Context, meeting *Meeting) error {
	return r.db.WithContext(ctx).Create(meeting).Error
}

// GetByID 根据ID获取会议
func (r *GormRepository) GetByID(ctx context.Context, id string) (*Meeting, error) {
	var meeting Meeting
	if err := r.db.WithContext(ctx).First(&meeting, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("会议未找到")
		}
		return nil, err
	}
	return &meeting, nil
}

// GetAll 获取所有会议
func (r *GormRepository) GetAll(ctx context.Context) ([]*Meeting, error) {
	var meetings []*Meeting
	if err := r.db.WithContext(ctx).Find(&meetings).Error; err != nil {
		return nil, err
	}
	return meetings, nil
}

// Update 更新会议信息
func (r *GormRepository) Update(ctx context.Context, meeting *Meeting) error {
	result := r.db.WithContext(ctx).Save(meeting)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("会议未找到")
	}
	return nil
}

// Delete 删除会议
func (r *GormRepository) Delete(ctx context.Context, id string) error {
	result := r.db.WithContext(ctx).Delete(&Meeting{}, "id = ?", id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("会议未找到")
	}
	return nil
}

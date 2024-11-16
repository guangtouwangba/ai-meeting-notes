-- 检查数据库是否存在，如果不存在则创建
SELECT 'CREATE DATABASE meeting_assistant'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'meeting_assistant')\gexec

-- 切换到新数据库
\c meeting_assistant;

-- 创建 recording_metadata 表
CREATE TABLE IF NOT EXISTS recording_metadata (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    meeting_id VARCHAR(255) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    audio_path VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_recording_metadata_updated_at
    BEFORE UPDATE ON recording_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 这里可以添加其他初始化操作，比如创建表等 
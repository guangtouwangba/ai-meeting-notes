-- 检查数据库是否存在，如果不存在则创建
SELECT 'CREATE DATABASE meeting_assistant'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'meeting_assistant')\gexec

-- 切换到新数据库
\c meeting_assistant;

-- 这里可以添加其他初始化操作，比如创建表等 
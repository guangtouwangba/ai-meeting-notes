package configs

import (
	"fmt"
	"log"
	"path/filepath"
	"runtime"

	"github.com/spf13/viper"
)

type Config struct {
	DBDriver    string `mapstructure:"DB_DRIVER"`
	DBHost      string `mapstructure:"DB_HOST"`
	DBPort      string `mapstructure:"DB_PORT"`
	DBUser      string `mapstructure:"DB_USER"`
	DBPassword  string `mapstructure:"DB_PASSWORD"`
	DBName      string `mapstructure:"DB_NAME"`
	StorageType string `mapstructure:"STORAGE_TYPE"`
}

func LoadConfig() (config Config, err error) {
	// 获取当前文件的路径
	_, b, _, _ := runtime.Caller(0)
	basepath := filepath.Dir(b)

	// 设置配置文件的路径
	viper.AddConfigPath(filepath.Join(basepath, "..")) // 回到项目根目录
	viper.SetConfigName(".env")
	viper.SetConfigType("env")

	viper.AutomaticEnv()

	err = viper.ReadInConfig()
	if err != nil {
		log.Printf("Error reading config file: %v", err)
		return
	}

	err = viper.Unmarshal(&config)
	if err != nil {
		log.Printf("Error unmarshaling config: %v", err)
		return
	}

	// 打印所有配置项
	log.Println("Configuration loaded successfully:")
	log.Printf("DBDriver: %s", config.DBDriver)
	log.Printf("DBHost: %s", config.DBHost)
	log.Printf("DBPort: %s", config.DBPort)
	log.Printf("DBUser: %s", config.DBUser)
	log.Printf("DBPassword: %s", "********") // 出于安全考虑,不打印实际密码
	log.Printf("DBName: %s", config.DBName)
	log.Printf("StorageType: %s", config.StorageType)

	// 打印 Viper 中的所有键值对
	for _, key := range viper.AllKeys() {
		if key != "DB_PASSWORD" {
			log.Printf("%s: %s", key, viper.GetString(key))
		} else {
			log.Printf("%s: ********", key)
		}
	}

	// 设置默认的StorageType
	if config.StorageType == "" {
		config.StorageType = "local"
	}

	return
}

func (c *Config) GetDSN() string {
	// PostgreSQL 的 DSN 格式
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Asia/Shanghai",
		c.DBHost,
		c.DBUser,
		c.DBPassword,
		c.DBName,
		c.DBPort,
	)
	// 出于安全考虑，不打印包含密码的完整 DSN
	safeDsn := fmt.Sprintf("host=%s user=%s dbname=%s port=%s",
		c.DBHost,
		c.DBUser,
		c.DBName,
		c.DBPort,
	)
	log.Printf("Connecting to database with DSN: %s", safeDsn)
	return dsn
}

func GetConfig() Config {
	config, err := LoadConfig()
	if err != nil {
		log.Fatalf("无法加载配置: %v", err)
	}
	return config
}

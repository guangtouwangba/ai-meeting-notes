package configs

import (
	"fmt"
	"log"
	"path/filepath"
	"runtime"

	"github.com/spf13/viper"
)

type Config struct {
	DBDriver   string `mapstructure:"DB_DRIVER"`
	DBHost     string `mapstructure:"DB_HOST"`
	DBPort     string `mapstructure:"DB_PORT"`
	DBUser     string `mapstructure:"DB_USER"`
	DBPassword string `mapstructure:"DB_PASSWORD"`
	DBName     string `mapstructure:"DB_NAME"`
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

	// 打印 Viper 中的所有键值对
	for _, key := range viper.AllKeys() {
		if key != "DB_PASSWORD" {
			log.Printf("%s: %s", key, viper.GetString(key))
		} else {
			log.Printf("%s: ********", key)
		}
	}

	return
}

func (c *Config) GetDSN() string {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		c.DBUser, c.DBPassword, c.DBHost, c.DBPort, c.DBName)
	log.Printf("Generated DSN: %s", dsn)
	return dsn
}

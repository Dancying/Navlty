package internal

import "os"

// Config 应用配置
type Config struct {
	ServicePort  string
	DataDir      string
	LogLevel     string
	Compression  bool
}

// LoadConfig 从环境变量加载配置
func LoadConfig() Config {
	return Config{
		ServicePort: envOr("NAVLTY_SERVICE_PORT", "10400"),
		DataDir:     envOr("NAVLTY_DATA_DIR", "/config"),
		LogLevel:    envOr("NAVLTY_LOG_LEVEL", "info"),
		Compression: envOr("NAVLTY_ENABLE_COMPRESSION", "false") == "true",
	}
}

// envOr 读取环境变量为空时返回默认值
func envOr(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

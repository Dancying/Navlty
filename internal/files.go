package internal

import (
	"encoding/json"
	"os"
	"path/filepath"
	"time"
)

var dataDirectory = envOr("NAVLTY_DATA_DIR", "/config")

// envOr 读取环境变量，为空时返回默认值
func envOr(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

// loadJSONData 读取并解码 JSON 文件
func loadJSONData(fileName string, v interface{}) error {
	path := filepath.Join(dataDirectory, fileName)
	file, err := os.ReadFile(path)
	if err != nil {
		return err
	}

	if err := json.Unmarshal(file, v); err != nil {
		FileLogger.Printf("%s | WARN | FILES | Could not parse data file fileName=%s err=\"%v\"", time.Now().Format("2006-01-02 15:04:05"), fileName, err)
		return err
	}
	return nil
}

// saveJSONData 编码并写入 JSON 文件
func saveJSONData(fileName string, v interface{}) error {
	if err := os.MkdirAll(dataDirectory, 0755); err != nil {
		CriticalLogger.Printf("%s | ERROR | FILES | Failed to create data directory err=\"%v\"", time.Now().Format("2006-01-02 15:04:05"), err)
		return err
	}

	path := filepath.Join(dataDirectory, fileName)
	file, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		FileLogger.Printf("%s | ERROR | FILES | Failed to serialize data fileName=%s err=\"%v\"", time.Now().Format("2006-01-02 15:04:05"), fileName, err)
		return err
	}
	return os.WriteFile(path, file, 0644)
}

package internal

import (
	"encoding/json"
	"log"
	"os"
	"path/filepath"
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
		log.Printf("warning: could not parse data file %s: %v", fileName, err)
		return err
	}
	return nil
}

// saveJSONData 编码并写入 JSON 文件
func saveJSONData(fileName string, v interface{}) error {
	if err := os.MkdirAll(dataDirectory, 0755); err != nil {
		log.Printf("error: failed to create data directory: %v", err)
		return err
	}

	path := filepath.Join(dataDirectory, fileName)
	file, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		log.Printf("error: failed to serialize data for %s: %v", fileName, err)
		return err
	}
	return os.WriteFile(path, file, 0644)
}

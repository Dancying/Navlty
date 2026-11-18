package internal

import (
	"encoding/json"
	"os"
	"path/filepath"
)

var DataDirectory string

// loadJSONData 读取并解码 JSON 文件
func loadJSONData(fileName string, v interface{}) error {
	path := filepath.Join(DataDirectory, fileName)
	file, err := os.ReadFile(path)
	if err != nil {
		return err
	}

	if err := json.Unmarshal(file, v); err != nil {
		FileLogger.Printf("%s | WARN | FILES | Could not parse data file fileName=%s err=\"%v\"", LogTime(), fileName, err)
		return err
	}
	return nil
}

// saveJSONData 编码并写入 JSON 文件
func saveJSONData(fileName string, v interface{}) error {
	if err := os.MkdirAll(DataDirectory, 0755); err != nil {
		CriticalLogger.Printf("%s | ERROR | FILES | Failed to create data directory err=\"%v\"", LogTime(), err)
		return err
	}

	path := filepath.Join(DataDirectory, fileName)
	file, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		FileLogger.Printf("%s | ERROR | FILES | Failed to serialize data fileName=%s err=\"%v\"", LogTime(), fileName, err)
		return err
	}
	return os.WriteFile(path, file, 0644)
}

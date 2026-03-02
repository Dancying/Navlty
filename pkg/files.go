package pkg

import (
	"encoding/json"
	"log"
	"os"
	"path/filepath"
	"strings"
)

const (
	dataDirectory = "data"
	cssDirectory  = "web/css"
	jsDirectory   = "web/js"
)

// loadJSONData 读取并解码一个 JSON 文件，如果文件不存在则返回错误。
func loadJSONData(fileName string, v interface{}) error {
	path := filepath.Join(dataDirectory, fileName)
	file, err := os.ReadFile(path)
	if err != nil {
		return err
	}

	if err := json.Unmarshal(file, v); err != nil {
		log.Printf("warning: could not parse data file %s: %v", fileName, err)
	}
	return nil
}

// saveJSONData 将数据编码为 JSON 并写入文件，如果目录不存在则创建它。
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

// loadStaticAssets 将一个目录中所有匹配后缀的文件内容合并成一个字符串。
func loadStaticAssets(dir, suffix string) string {
	var builder strings.Builder
	files, err := os.ReadDir(dir)
	if err != nil {
		log.Printf("warning: could not read directory %s: %v", dir, err)
		return ""
	}

	for _, file := range files {
		if !file.IsDir() && strings.HasSuffix(file.Name(), suffix) {
			content, err := os.ReadFile(filepath.Join(dir, file.Name()))
			if err != nil {
				log.Printf("warning: could not read file %s: %v", file.Name(), err)
				continue
			}
			builder.Write(content)
			builder.WriteString("\n")
		}
	}
	return builder.String()
}

// loadAllStaticAssets 加载并返回所有 CSS 和 JavaScript 资源。
func loadAllStaticAssets() (string, string) {
	css := loadStaticAssets(cssDirectory, ".css")
	js := loadStaticAssets(jsDirectory, ".js")
	return css, js
}

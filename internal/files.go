package internal

import (
	"encoding/json"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/tdewolff/minify/v2"
	"github.com/tdewolff/minify/v2/css"
	"github.com/tdewolff/minify/v2/html"
	"github.com/tdewolff/minify/v2/js"
	jsonminify "github.com/tdewolff/minify/v2/json"
)

const (
	dataDirectory      = "data"
	publicCSSDirectory = "web/css/public"
	publicJSDirectory  = "web/js/public"
	authCSSDirectory   = "web/css/auth"
	authJSDirectory    = "web/js/auth"
)

var m *minify.M

// 包初始化时，设置压缩器
func init() {
	m = minify.New()
	m.AddFunc("text/css", css.Minify)
	m.AddFunc("application/javascript", js.Minify)
	m.AddFunc("application/json", jsonminify.Minify)
	m.AddFunc("text/html", html.Minify)
}

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

// loadStaticAssets 将一个目录中所有匹配后缀的文件内容合并并压缩成一个字符串。
func loadStaticAssets(dir, suffix string) string {
	var builder strings.Builder
	files, err := os.ReadDir(dir)
	if err != nil {
		log.Printf("warning: could not read directory %s: %v", dir, err)
		return ""
	}

	var mime string
	switch suffix {
	case ".css":
		mime = "text/css"
	case ".js":
		mime = "application/javascript"
	default:
		mime = "application/octet-stream"
	}

	for _, file := range files {
		if !file.IsDir() && strings.HasSuffix(file.Name(), suffix) {
			content, err := os.ReadFile(filepath.Join(dir, file.Name()))
			if err != nil {
				log.Printf("warning: could not read file %s: %v", file.Name(), err)
				continue
			}

			minifiedContent, err := m.Bytes(mime, content)
			if err != nil {
				log.Printf("warning: could not minify file %s: %v", file.Name(), err)
				builder.Write(content)
			} else {
				builder.Write(minifiedContent)
			}
			builder.WriteString("\n")
		}
	}
	return builder.String()
}

// LoadPublicAssets 加载并返回所有公共的 CSS 和 JavaScript 资源。
func LoadPublicAssets() (string, string) {
	css := loadStaticAssets(publicCSSDirectory, ".css")
	js := loadStaticAssets(publicJSDirectory, ".js")
	return css, js
}

// LoadAuthAssets 加载并返回所有需要认证的 CSS 和 JavaScript 资源。
func LoadAuthAssets() (string, string) {
	css := loadStaticAssets(authCSSDirectory, ".css")
	js := loadStaticAssets(authJSDirectory, ".js")
	return css, js
}

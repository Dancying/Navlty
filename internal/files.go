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

var (
	dataDirectory      = envOr("NAVLTY_DATA_DIR", "/config")
	publicCSSDirectory = "web/css/public"
	publicJSDirectory  = "web/js/public"
	authCSSDirectory   = "web/css/auth"
	authJSDirectory    = "web/js/auth"
	themesDirectory    = "web/css/themes"
)

var m *minify.M

// init 初始化压缩器
func init() {
	m = minify.New()
	m.AddFunc("text/css", css.Minify)
	m.AddFunc("application/javascript", js.Minify)
	m.AddFunc("application/json", jsonminify.Minify)
	m.AddFunc("text/html", html.Minify)
}

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

// loadStaticAssets 合并并压缩目录下指定后缀的资源
func loadStaticAssets(dir, suffix string) string {
	var builder strings.Builder
	files, err := os.ReadDir(dir)
	if err != nil {
		log.Printf("warning: could not read directory %s: %v", dir, err)
		return ""
	}

	mime := map[string]string{".css": "text/css", ".js": "application/javascript"}[suffix]
	if mime == "" {
		mime = "application/octet-stream"
	}

	for _, file := range files {
		if file.IsDir() || !strings.HasSuffix(file.Name(), suffix) { continue }

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
	return builder.String()
}

// LoadPublicAssets 加载公共 CSS 和 JS 资源
func LoadPublicAssets() (string, string) {
	return loadStaticAssets(publicCSSDirectory, ".css"), loadStaticAssets(publicJSDirectory, ".js")
}

// LoadAuthAssets 加载认证 CSS 和 JS 资源
func LoadAuthAssets() (string, string) {
	return loadStaticAssets(authCSSDirectory, ".css"), loadStaticAssets(authJSDirectory, ".js")
}

// LoadThemeCSS 加载指定主题的 CSS 文件
func LoadThemeCSS(themeName string) string {
	if themeName == "" { themeName = "cool-white" }
	themeFile := filepath.Join(themesDirectory, themeName+".css")
	content, err := os.ReadFile(themeFile)
	if err != nil {
		log.Printf("warning: could not load theme file %s: %v", themeFile, err)
		return ""
	}

	minifiedContent, err := m.Bytes("text/css", content)
	if err != nil {
		log.Printf("warning: could not minify theme file %s: %v", themeFile, err)
		return string(content)
	}
	return string(minifiedContent)
}


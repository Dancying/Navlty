package internal

import (
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/tdewolff/minify/v2"
	"github.com/tdewolff/minify/v2/css"
	"github.com/tdewolff/minify/v2/html"
	"github.com/tdewolff/minify/v2/js"
	jsonminify "github.com/tdewolff/minify/v2/json"
)

var (
	publicCSSDirectory = "web/css/public"
	publicJSDirectory  = "web/js/public"
	authCSSDirectory   = "web/css/auth"
	authJSDirectory    = "web/js/auth"
	themesDirectory    = "web/css/themes"
)

// mimeTypes 后缀与 MIME 类型的映射
var mimeTypes = map[string]string{
	".css": "text/css",
	".js":  "application/javascript",
}

// m 全局压缩器实例
var m *minify.M

// init 初始化压缩器
func init() {
	m = minify.New()
	m.AddFunc("text/css", css.Minify)
	m.AddFunc("application/javascript", js.Minify)
	m.AddFunc("application/json", jsonminify.Minify)
	m.AddFunc("text/html", html.Minify)
}

// assetCache 静态资源压缩结果缓存
var assetCache struct {
	publicCSS string
	publicJS  string
	authCSS   string
	authJS    string
	themes    map[string]string
}

// WarmAssetCache 启动时预压缩全部静态资源与主题文件
func WarmAssetCache() {
	start := time.Now()
	assetCache.publicCSS = loadStaticAssets(publicCSSDirectory, ".css")
	assetCache.publicJS = loadStaticAssets(publicJSDirectory, ".js")
	assetCache.authCSS = loadStaticAssets(authCSSDirectory, ".css")
	assetCache.authJS = loadStaticAssets(authJSDirectory, ".js")
	assetCache.themes = make(map[string]string)
	entries, err := os.ReadDir(themesDirectory)
	if err != nil {
		CriticalLogger.Printf("%s | ERROR | ASSETS | Could not read theme directory dir=%s err=\"%v\"", time.Now().Format("2006-01-02 15:04:05"), themesDirectory, err)
	}
	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".css") {
			continue
		}
		name := strings.TrimSuffix(entry.Name(), ".css")
		assetCache.themes[name] = minifyThemeFile(filepath.Join(themesDirectory, entry.Name()))
	}
	FileLogger.Printf("%s | INFO | ASSETS | Asset cache warmed duration=%dms", time.Now().Format("2006-01-02 15:04:05"), time.Since(start).Milliseconds())
}

// loadStaticAssets 合并并压缩目录下指定后缀的资源
func loadStaticAssets(dir, suffix string) string {
	files, err := os.ReadDir(dir)
	if err != nil {
		CriticalLogger.Printf("%s | ERROR | ASSETS | Could not read directory dir=%s err=\"%v\"", time.Now().Format("2006-01-02 15:04:05"), dir, err)
		return ""
	}

	mime := mimeTypes[suffix]
	if mime == "" {
		mime = "application/octet-stream"
	}

	var builder strings.Builder
	for _, file := range files {
		if file.IsDir() || !strings.HasSuffix(file.Name(), suffix) { continue }

		content, err := minifyFile(filepath.Join(dir, file.Name()), mime)
		if err != nil {
			CriticalLogger.Printf("%s | ERROR | ASSETS | Could not read file file=%s err=\"%v\"", time.Now().Format("2006-01-02 15:04:05"), file.Name(), err)
			continue
		}

		builder.WriteString(content)
		builder.WriteString("\n")
	}
	return builder.String()
}

// minifyFile 读取文件并按 MIME 压缩，读取失败返回错误，压缩失败回退原文
func minifyFile(path, mime string) (string, error) {
	content, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}

	minified, err := m.Bytes(mime, content)
	if err != nil {
		FileLogger.Printf("%s | WARN | ASSETS | Could not minify file path=%s err=\"%v\"", time.Now().Format("2006-01-02 15:04:05"), path, err)
		return string(content), nil
	}
	return string(minified), nil
}

// LoadPublicAssets 加载公共 CSS 和 JS 资源
func LoadPublicAssets() (string, string) {
	return assetCache.publicCSS, assetCache.publicJS
}

// LoadAuthAssets 加载认证 CSS 和 JS 资源
func LoadAuthAssets() (string, string) {
	return assetCache.authCSS, assetCache.authJS
}

// LoadThemeCSS 加载指定主题的 CSS 文件
func LoadThemeCSS(themeName string) string {
	if themeName == "" { themeName = "cool-white" }
	if cached, ok := assetCache.themes[themeName]; ok {
		return cached
	}
	return minifyThemeFile(filepath.Join(themesDirectory, themeName+".css"))
}

// minifyThemeFile 读取并压缩单个主题文件
func minifyThemeFile(themeFile string) string {
	content, err := minifyFile(themeFile, "text/css")
	if err != nil {
		CriticalLogger.Printf("%s | ERROR | ASSETS | Could not load theme file themeFile=%s err=\"%v\"", time.Now().Format("2006-01-02 15:04:05"), themeFile, err)
		return ""
	}
	return content
}

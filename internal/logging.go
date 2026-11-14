package internal

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

// statusWriter 记录响应状态码的写入器
type statusWriter struct {
	http.ResponseWriter
	status int
}

// WriteHeader 在写入响应头时记录状态码
func (sw *statusWriter) WriteHeader(status int) {
	sw.status = status
	sw.ResponseWriter.WriteHeader(status)
}

type Level int

const (
	InfoLevel Level = iota
	WarnLevel
	ErrorLevel
	FatalLevel
)

var (
	CriticalLogger *log.Logger
	FileLogger     *log.Logger
	stdWriter      *fileWriter
	logLevel       Level
)

// parseLogLevel 解析日志等级字符串
func parseLogLevel(s string) Level {
	switch strings.ToLower(s) {
	case "warn":
		return WarnLevel
	case "error":
		return ErrorLevel
	case "fatal":
		return FatalLevel
	default:
		return InfoLevel
	}
}

// levelFilterWriter 按等级过滤日志写入器
type levelFilterWriter struct {
	inner   io.Writer
	minLevel Level
}

// extractLevel 从日志内容中提取等级
func extractLevel(p []byte) Level {
	s := string(p)
	idx := strings.Index(s, "|")
	if idx < 0 {
		return InfoLevel
	}
	rest := s[idx+1:]
	field := rest
	if end := strings.Index(rest, "|"); end >= 0 {
		field = rest[:end]
	}
	switch strings.TrimSpace(field) {
	case "FATAL":
		return FatalLevel
	case "ERROR":
		return ErrorLevel
	case "WARN":
		return WarnLevel
	default:
		return InfoLevel
	}
}

// Write 实现 io.Writer 接口并按等级过滤
func (w *levelFilterWriter) Write(p []byte) (int, error) {
	if extractLevel(p) < w.minLevel {
		return len(p), nil
	}
	return w.inner.Write(p)
}

// InitLog 初始化统一日志文件，所有文件日志合并写入同一个按天文件
func InitLog(dataDir string) error {
	if dataDir == "" {
		dataDir = "/config"
	}
	logDir := filepath.Join(dataDir, "logs")
	if err := os.MkdirAll(logDir, 0755); err != nil {
		return err
	}

	cleanupOldLogs(logDir)

	writer, err := newFileWriter(logDir, "app")
	if err != nil {
		return err
	}
	stdWriter = writer

	logLevel = parseLogLevel(os.Getenv("NAVLTY_LOG_LEVEL"))

	fileFilter := &levelFilterWriter{inner: stdWriter, minLevel: logLevel}
	stderrFilter := &levelFilterWriter{inner: os.Stderr, minLevel: logLevel}

	CriticalLogger = log.New(io.MultiWriter(stderrFilter, fileFilter), "", 0)
	FileLogger = log.New(fileFilter, "", 0)
	return nil
}

// cleanupOldLogs 删除超过7天的日志文件
func cleanupOldLogs(dir string) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return
	}

	cutoff := time.Now().AddDate(0, 0, -7)

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		name := entry.Name()
		if !strings.HasSuffix(name, ".log") || !strings.HasPrefix(name, "app-") {
			continue
		}
		idx := strings.Index(name, "-")
		dateStr := name[idx+1 : len(name)-len(".log")]
		t, err := time.Parse("2006-01-02", dateStr)
		if err != nil {
			continue
		}
		if t.Before(cutoff) {
			os.Remove(filepath.Join(dir, name))
		}
	}
}

// FlushLogs 刷新并关闭统一日志文件
func FlushLogs() {
	if stdWriter != nil {
		stdWriter.close()
	}
}

// fileWriter 按天轮转的日志写入器，每条写入后立即落盘
type fileWriter struct {
	dir   string
	prefix string
	date  string
	file  *os.File
	mu    sync.Mutex
}

// newFileWriter 创建按天轮转的日志写入器
func newFileWriter(dir, prefix string) (*fileWriter, error) {
	w := &fileWriter{
		dir:   dir,
		prefix: prefix,
		date:  time.Now().Format("2006-01-02"),
	}
	if err := w.rotate(time.Now()); err != nil {
		return nil, err
	}
	return w, nil
}

// rotate 判断日期是否变化并切换日志文件
func (w *fileWriter) rotate(t time.Time) error {
	date := t.Format("2006-01-02")
	if date == w.date && w.file != nil {
		return nil
	}

	if w.file != nil {
		w.file.Sync()
		w.file.Close()
	}

	logFile := filepath.Join(w.dir, fmt.Sprintf("%s-%s.log", w.prefix, date))
	f, err := os.OpenFile(logFile, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		return err
	}

	w.date = date
	w.file = f
	return nil
}

// Write 实现 io.Writer 接口并立即落盘
func (w *fileWriter) Write(p []byte) (int, error) {
	w.mu.Lock()
	defer w.mu.Unlock()
	if err := w.rotate(time.Now()); err != nil {
		return 0, err
	}
	n, err := w.file.Write(p)
	if err != nil {
		return n, err
	}
	if err := w.file.Sync(); err != nil {
		return n, err
	}
	return n, nil
}

// close 关闭日志文件
func (w *fileWriter) close() error {
	w.mu.Lock()
	defer w.mu.Unlock()
	if w.file != nil {
		w.file.Sync()
		return w.file.Close()
	}
	return nil
}

// LoggingMiddleware 记录HTTP请求访问日志到统一日志文件
func LoggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		sw := &statusWriter{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(sw, r)

		if FileLogger != nil {
			FileLogger.Printf("%s | INFO | ACCESS | %s %s %s %d %dms",
				time.Now().Format("2006-01-02 15:04:05"),
				r.Method,
				r.URL.Path,
				r.Proto,
				sw.status,
				time.Since(start).Milliseconds(),
			)
		}
	})
}

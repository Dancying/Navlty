package internal

import (
	"log"
	"net/http"
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

// LoggingMiddleware 记录每个请求的方法、路径、状态码和耗时
func LoggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		sw := &statusWriter{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(sw, r)
		log.Printf("%s %s %d %dms", r.Method, r.URL.Path, sw.status, time.Since(start).Milliseconds())
	})
}

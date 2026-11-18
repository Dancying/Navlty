package internal

import (
	"bytes"
	"compress/gzip"
	"io"
	"net/http"
	"strconv"
	"strings"

	"github.com/andybalholm/brotli"
)

// minCompressSize 小于该字节数的响应不压缩
const minCompressSize = 1024

// compressibleTypes 可压缩的内容类型前缀列表
var compressibleTypes = []string{
	"text/",
	"application/json",
	"application/javascript",
	"application/xml",
	"application/xhtml+xml",
	"image/svg+xml",
}

// CompressionEnabled 压缩开关，由 main.go 启动时设置
var CompressionEnabled bool

// CompressMiddleware 响应压缩中间件
func CompressMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !CompressionEnabled {
			next.ServeHTTP(w, r)
			return
		}

		encoding := selectEncoding(r.Header.Get("Accept-Encoding"))
		if encoding == "" {
			next.ServeHTTP(w, r)
			return
		}

		cw := &compressWriter{ResponseWriter: w, encoding: encoding}
		next.ServeHTTP(cw, r)
		cw.finish()
	})
}

// selectEncoding 解析 Accept-Encoding 选择优先编码
func selectEncoding(header string) string {
	best := ""
	bestQ := 0.0
	for _, part := range strings.Split(header, ",") {
		part = strings.TrimSpace(part)
		if part == "" { continue }

		name := part
		q := 1.0
		if idx := strings.Index(part, ";"); idx >= 0 {
			name = strings.TrimSpace(part[:idx])
			for _, param := range strings.Split(part[idx+1:], ";") {
				param = strings.TrimSpace(param)
				if strings.HasPrefix(param, "q=") {
					if parsed, err := strconv.ParseFloat(param[2:], 64); err == nil {
						q = parsed
					} else {
						FileLogger.Printf("%s | WARN | COMPRESS | Invalid q value in Accept-Encoding value=%s", LogTime(), param[2:])
					}
				}
			}
		}

		name = strings.ToLower(name)
		if name != "br" && name != "gzip" { continue }
		if q > bestQ {
			best = name
			bestQ = q
		}
	}
	return best
}

// compressWriter 缓存响应内容的写入器
type compressWriter struct {
	http.ResponseWriter
	encoding    string
	buf         bytes.Buffer
	status      int
	wroteHeader bool
}

// WriteHeader 记录响应状态码
func (cw *compressWriter) WriteHeader(status int) {
	cw.status = status
	cw.wroteHeader = true
}

// Write 写入响应内容到缓冲区
func (cw *compressWriter) Write(b []byte) (int, error) {
	if !cw.wroteHeader { cw.WriteHeader(http.StatusOK) }
	return cw.buf.Write(b)
}

// finish 根据内容类型和大小决定是否压缩响应
func (cw *compressWriter) finish() {
	status := cw.status
	if status == 0 { status = http.StatusOK }

	size := cw.buf.Len()
	contentType := cw.Header().Get("Content-Type")
	if contentType == "" { contentType = http.DetectContentType(cw.buf.Bytes()) }

	if size < minCompressSize || !isCompressible(contentType) {
		cw.Header().Set("Content-Length", strconv.Itoa(size))
		cw.ResponseWriter.WriteHeader(status)
		io.Copy(cw.ResponseWriter, &cw.buf)
		return
	}

	cw.Header().Del("Content-Length")
	cw.Header().Set("Content-Encoding", cw.encoding)
	if cw.Header().Get("Vary") == "" { cw.Header().Set("Vary", "Accept-Encoding") }
	cw.ResponseWriter.WriteHeader(status)

	var enc io.WriteCloser
	switch cw.encoding {
	case "br":
		enc = brotli.NewWriterLevel(cw.ResponseWriter, brotli.BestCompression)
	case "gzip":
		enc, _ = gzip.NewWriterLevel(cw.ResponseWriter, gzip.BestCompression)
	}
	if enc != nil {
		defer enc.Close()
		io.Copy(enc, &cw.buf)
	}
}

// isCompressible 判断内容类型是否可压缩
func isCompressible(contentType string) bool {
	ct := strings.ToLower(contentType)
	if idx := strings.Index(ct, ";"); idx >= 0 { ct = strings.TrimSpace(ct[:idx]) }
	for _, prefix := range compressibleTypes {
		if strings.HasPrefix(ct, prefix) { return true }
	}
	return false
}

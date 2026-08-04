package internal

import (
	"bytes"
	"compress/gzip"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"
	"strings"

	"github.com/andybalholm/brotli"
)

// minCompressSize 小于该字节数的响应不压缩，避免小响应的压缩开销。
const minCompressSize = 1024

// compressibleTypes 可压缩的内容类型前缀列表。
var compressibleTypes = []string{
	"text/",
	"application/json",
	"application/javascript",
	"application/xml",
	"application/xhtml+xml",
	"image/svg+xml",
}

// CompressMiddleware 根据请求的 Accept-Encoding 对可压缩的响应进行 brotli 或 gzip 压缩。
// 优先级：brotli (br) > gzip。
// 压缩默认关闭，仅当环境变量 NAVLTY_ENABLE_COMPRESSION=true 时启用。
func CompressMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !compressionEnabled() {
			next.ServeHTTP(w, r)
			return
		}

		encoding := selectEncoding(r.Header.Get("Accept-Encoding"))
		if encoding == "" {
			next.ServeHTTP(w, r)
			return
		}

		cw := &compressWriter{
			ResponseWriter: w,
			encoding:       encoding,
		}
		next.ServeHTTP(cw, r)
		cw.finish()
	})
}

// compressionEnabled 检查环境变量 NAVLTY_ENABLE_COMPRESSION 是否为 true。
// 默认为 false，只有显式设置为 "true"（不区分大小写）时才启用压缩。
func compressionEnabled() bool {
	return strings.EqualFold(os.Getenv("NAVLTY_ENABLE_COMPRESSION"), "true")
}

// selectEncoding 解析 Accept-Encoding 请求头，返回优先选择的编码。
// 支持 br 和 gzip，考虑 q 值权重。返回空字符串表示不支持任何压缩编码。
func selectEncoding(header string) string {
	type candidate struct {
		name string
		q    float64
	}

	var candidates []candidate
	for _, part := range strings.Split(header, ",") {
		part = strings.TrimSpace(part)
		if part == "" {
			continue
		}

		name := part
		q := 1.0
		if idx := strings.Index(part, ";"); idx >= 0 {
			name = strings.TrimSpace(part[:idx])
			for _, param := range strings.Split(part[idx+1:], ";") {
				param = strings.TrimSpace(param)
				if strings.HasPrefix(param, "q=") {
					fmt.Sscanf(param[2:], "%f", &q)
				}
			}
		}

		if q > 0 {
			candidates = append(candidates, candidate{name: strings.ToLower(name), q: q})
		}
	}

	// 按 q 值从高到低排序（简单插入排序）
	for i := 0; i < len(candidates); i++ {
		for j := i + 1; j < len(candidates); j++ {
			if candidates[j].q > candidates[i].q {
				candidates[i], candidates[j] = candidates[j], candidates[i]
			}
		}
	}

	// 在支持的编码中按优先级选择：br > gzip
	best := ""
	bestQ := 0.0
	for _, c := range candidates {
		if c.name != "br" && c.name != "gzip" {
			continue
		}
		if c.q > bestQ {
			best = c.name
			bestQ = c.q
		}
	}
	return best
}

// compressWriter 缓存响应内容，在 handler 完成后决定是否压缩并写入底层。
type compressWriter struct {
	http.ResponseWriter
	encoding    string
	buf         bytes.Buffer
	status      int
	wroteHeader bool
}

func (cw *compressWriter) WriteHeader(status int) {
	cw.status = status
	cw.wroteHeader = true
}

func (cw *compressWriter) Write(b []byte) (int, error) {
	if !cw.wroteHeader {
		cw.WriteHeader(http.StatusOK)
	}
	return cw.buf.Write(b)
}

// finish 在 handler 返回后，根据内容类型和大小决定是否压缩响应。
func (cw *compressWriter) finish() {
	status := cw.status
	if status == 0 {
		status = http.StatusOK
	}

	size := cw.buf.Len()
	contentType := cw.Header().Get("Content-Type")
	if contentType == "" {
		contentType = http.DetectContentType(cw.buf.Bytes())
	}

	// 不压缩的情况：太小、内容类型不可压缩
	if size < minCompressSize || !isCompressible(contentType) {
		cw.Header().Set("Content-Length", strconv.Itoa(size))
		cw.ResponseWriter.WriteHeader(status)
		io.Copy(cw.ResponseWriter, &cw.buf)
		return
	}

	// 压缩的情况
	h := cw.Header()
	h.Del("Content-Length")
	h.Set("Content-Encoding", cw.encoding)
	if h.Get("Vary") == "" {
		h.Set("Vary", "Accept-Encoding")
	}
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

// isCompressible 判断内容类型是否可压缩。
func isCompressible(contentType string) bool {
	ct := strings.ToLower(contentType)
	if idx := strings.Index(ct, ";"); idx >= 0 {
		ct = strings.TrimSpace(ct[:idx])
	}
	for _, prefix := range compressibleTypes {
		if strings.HasPrefix(ct, prefix) {
			return true
		}
	}
	return false
}

package pkg

import (
	"encoding/json"
	"log"
	"net/http"
)

// respondWithError 是一个用于发送 JSON 格式错误响应的辅助函数。
func respondWithError(w http.ResponseWriter, code int, message string) {
	respondWithJSON(w, code, map[string]string{"error": message})
}

// respondWithJSON 是一个用于发送 JSON 格式响应的通用辅助函数。
func respondWithJSON(w http.ResponseWriter, code int, payload interface{}) {
	response, err := json.Marshal(payload)
	if err != nil {
		log.Printf("error: failed to marshal JSON response: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	// 使用 minifier 压缩 JSON 数据
	minifiedResponse, err := m.Bytes("application/json", response)
	if err != nil {
		log.Printf("warning: could not minify JSON response: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(code)
		w.Write(response)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	w.Write(minifiedResponse)
}

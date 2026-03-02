package pkg

import (
	"encoding/json"
	"net/http"
)

// respondWithError 是一个用于发送 JSON 格式错误响应的辅助函数。
func respondWithError(w http.ResponseWriter, code int, message string) {
	respondWithJSON(w, code, map[string]string{"error": message})
}

// respondWithJSON 是一个用于发送 JSON 格式响应的通用辅助函数。
func respondWithJSON(w http.ResponseWriter, code int, payload interface{}) {
	response, _ := json.Marshal(payload)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	w.Write(response)
}

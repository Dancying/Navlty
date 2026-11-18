package internal

import (
	"encoding/json"
	"net/http"
)

// respondWithError 发送 JSON 错误响应
func respondWithError(w http.ResponseWriter, code int, message string) {
	respondWithJSON(w, code, map[string]string{"error": message})
}

// respondWithJSON 发送 JSON 响应
func respondWithJSON(w http.ResponseWriter, code int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")

	response, err := json.Marshal(payload)
	if err != nil {
		FileLogger.Printf("%s | ERROR | UTILS | Failed to marshal JSON response err=\"%v\"", LogTime(), err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	minifiedResponse, err := m.Bytes("application/json", response)
	if err != nil {
		FileLogger.Printf("%s | WARN | UTILS | Could not minify JSON response err=\"%v\"", LogTime(), err)
		w.WriteHeader(code)
		w.Write(response)
		return
	}

	w.WriteHeader(code)
	w.Write(minifiedResponse)
}

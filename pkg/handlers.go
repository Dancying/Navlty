package pkg

import (
	"bytes"
	"encoding/json"
	"html/template"
	"net/http"
	"strings"
)

// RenderPage 使用数据渲染主 HTML 页面。
func RenderPage(w http.ResponseWriter, r *http.Request) {
	pageData := LoadPageData()

	templatePath := "index.html"
	t, err := template.New("index.html").Funcs(template.FuncMap{
		"safeCSS": func(s string) template.CSS { return template.CSS(s) },
		"safeJS":  func(s string) template.JS { return template.JS(s) },
		"isURLOrBase64": func(s string) bool {
			return strings.HasPrefix(s, "http") || strings.HasPrefix(s, "data:image")
		},
	}).ParseFiles(templatePath)

	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Error parsing template: "+err.Error())
		return
	}

	var buf bytes.Buffer
	if err := t.Execute(&buf, pageData); err != nil {
		respondWithError(w, http.StatusInternalServerError, "Error executing template: "+err.Error())
		return
	}

	minifiedHTML, err := m.Bytes("text/html", buf.Bytes())
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Error minifying HTML: "+err.Error())
		w.Write(buf.Bytes())
		return
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Write(minifiedHTML)
}

// HandleSettings 根据 HTTP 方法路由设置相关的请求。
func HandleSettings(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		getSettings(w)
	case http.MethodPost:
		saveSettings(w, r)
	default:
		respondWithError(w, http.StatusMethodNotAllowed, "Invalid request method")
	}
}

// HandleLinks 根据 HTTP 方法处理链接相关的请求。
func HandleLinks(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		links := LoadLinks()
		respondWithJSON(w, http.StatusOK, links)
	case http.MethodPost:
		var links []Link
		if err := json.NewDecoder(r.Body).Decode(&links); err != nil {
			respondWithError(w, http.StatusBadRequest, "Invalid data format: "+err.Error())
			return
		}

		if err := SaveLinks(links); err != nil {
			respondWithError(w, http.StatusInternalServerError, "Failed to save links: "+err.Error())
			return
		}

		respondWithJSON(w, http.StatusOK, map[string]string{"message": "Links updated successfully"})
	default:
		respondWithError(w, http.StatusMethodNotAllowed, "Invalid request method")
	}
}

// HandleBulkAddLinks 处理批量添加新链接的请求。
func HandleBulkAddLinks(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondWithError(w, http.StatusMethodNotAllowed, "Invalid request method")
		return
	}

	var newLinks []Link
	if err := json.NewDecoder(r.Body).Decode(&newLinks); err != nil {
		respondWithError(w, http.StatusBadRequest, "Error decoding request body: "+err.Error())
		return
	}

	links := LoadLinks()
	links = append(links, newLinks...)

	if err := SaveLinks(links); err != nil {
		respondWithError(w, http.StatusInternalServerError, "Error writing updated links: "+err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]string{"status": "success"})
}

// getSettings 处理获取当前网站设置的请求。
func getSettings(w http.ResponseWriter) {
	settings := LoadSettings()
	respondWithJSON(w, http.StatusOK, settings)
}

// saveSettings 处理保存新网站设置的请求。
func saveSettings(w http.ResponseWriter, r *http.Request) {
	var newSettings Settings
	if err := json.NewDecoder(r.Body).Decode(&newSettings); err != nil {
		respondWithError(w, http.StatusBadRequest, "Error decoding request body: "+err.Error())
		return
	}

	if err := SaveSettings(&newSettings); err != nil {
		respondWithError(w, http.StatusInternalServerError, "Error saving settings: "+err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]string{"status": "success"})
}

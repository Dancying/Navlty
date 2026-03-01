package internal

import (
	"bytes"
	"encoding/json"
	"fmt"
	"html/template"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

// RenderPage renders the main HTML page.
func RenderPage(w http.ResponseWriter, r *http.Request) {
	pageData, err := LoadPageData()
	if err != nil {
		http.Error(w, fmt.Sprintf("Error loading page data: %v", err), http.StatusInternalServerError)
		return
	}

	templatePath := filepath.Join("web", "templates", "index.html")
	t, err := template.New("index.html").Funcs(template.FuncMap{
		"safeCSS": func(s string) template.CSS { return template.CSS(s) },
		"safeJS":  func(s string) template.JS { return template.JS(s) },
	}).ParseFiles(templatePath)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error parsing template: %v", err), http.StatusInternalServerError)
		return
	}

	var buf bytes.Buffer
	if err := t.Execute(&buf, pageData); err != nil {
		http.Error(w, fmt.Sprintf("Error executing template: %v", err), http.StatusInternalServerError)
		return
	}

	w.Write(buf.Bytes())
}

// HandleSettings routes settings requests based on HTTP method.
func HandleSettings(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		getSettings(w, r)
	case http.MethodPost:
		saveSettings(w, r)
	default:
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
	}
}

func getSettings(w http.ResponseWriter, r *http.Request) {
	config, err := LoadSettings()
	if err != nil {
		if os.IsNotExist(err) {
			http.Error(w, "Settings file not found", http.StatusNotFound)
		} else {
			http.Error(w, "Error loading settings: "+err.Error(), http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(config); err != nil {
		http.Error(w, "Error encoding settings response", http.StatusInternalServerError)
	}
}

func saveSettings(w http.ResponseWriter, r *http.Request) {
	var newSettings Config
	if err := json.NewDecoder(r.Body).Decode(&newSettings); err != nil {
		http.Error(w, "Error decoding request body: "+err.Error(), http.StatusBadRequest)
		return
	}

	if err := SaveSettings(&newSettings); err != nil {
		http.Error(w, "Error saving settings: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

// HandleBulkAddLinks handles the bulk addition of new links.
func HandleBulkAddLinks(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	var newLinks []Link
	if err := json.NewDecoder(r.Body).Decode(&newLinks); err != nil {
		http.Error(w, "Error decoding request body: "+err.Error(), http.StatusBadRequest)
		return
	}

	links, err := LoadLinks()
	if err != nil && !os.IsNotExist(err) {
		http.Error(w, "Error reading links data: "+err.Error(), http.StatusInternalServerError)
		return
	}

	links = append(links, newLinks...)

	if err := SaveLinks(links); err != nil {
		http.Error(w, "Error writing updated links: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

// HandleIconUpload handles file uploads for icons.
func HandleIconUpload(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	if err := r.ParseMultipartForm(10 << 20); err != nil { // 10 MB limit
		http.Error(w, "Error parsing multipart form", http.StatusInternalServerError)
		return
	}

	file, handler, err := r.FormFile("icon")
	if err != nil {
		http.Error(w, "Error retrieving the file", http.StatusInternalServerError)
		return
	}
	defer file.Close()

	uploadDir := filepath.Join("web", "static", "uploads")
	if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
		if err := os.MkdirAll(uploadDir, 0755); err != nil {
			http.Error(w, "Error creating upload directory", http.StatusInternalServerError)
			return
		}
	}

	filename := fmt.Sprintf("%d_%s", time.Now().UnixNano(), filepath.Base(handler.Filename))
	dstPath := filepath.Join(uploadDir, filename)

	dst, err := os.Create(dstPath)
	if err != nil {
		http.Error(w, "Error creating the file", http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		http.Error(w, "Error copying the file", http.StatusInternalServerError)
		return
	}

	url := filepath.ToSlash(filepath.Join("/static", "uploads", filename))

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(map[string]string{"url": url}); err != nil {
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
	}
}

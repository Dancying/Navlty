package internal

import (
	"bytes"
	"encoding/json"
	"fmt"
	"html/template"
	"io"
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

func mustReadFile(path string) []byte {
	content, err := ioutil.ReadFile(path)
	if err != nil {
		panic(fmt.Sprintf("failed to read file %s: %v", path, err))
	}
	return content
}

// RenderPage serves the main page.
func RenderPage(w http.ResponseWriter, r *http.Request) {
	config := GetConfig()

	// Read JS files
	jsFiles := []string{
		"web/static/js/modal.js",
		"web/static/js/ui.js",
	}
	var jsContent bytes.Buffer
	for _, file := range jsFiles {
		jsContent.Write(mustReadFile(file))
		jsContent.WriteString("\n") // Add a newline between files
	}

	// Read CSS files
	cssFiles := []string{
		"web/static/css/buttons.css",
		"web/static/css/form.css",
		"web/static/css/header.css",
		"web/static/css/links.css",
		"web/static/css/modal.css",
		"web/static/css/panels.css",
	}
	var cssContent bytes.Buffer
	for _, file := range cssFiles {
		cssContent.Write(mustReadFile(file))
		cssContent.WriteString("\n") // Add a newline between files
	}

	templatePath := filepath.Join("web", "templates", "index.html")
	templateContent, err := ioutil.ReadFile(templatePath)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error reading template file: %v", err), http.StatusInternalServerError)
		return
	}

	t, err := template.New("index.html").Funcs(template.FuncMap{
		"safeCSS": func(s string) template.CSS { return template.CSS(s) },
		"safeJS":  func(s string) template.JS { return template.JS(s) },
	}).Parse(string(templateContent))
	if err != nil {
		http.Error(w, fmt.Sprintf("Error parsing template: %v", err), http.StatusInternalServerError)
		return
	}

	// Create a temporary struct to hold all data for the template
	pageData := struct {
		*Config
		JS  string
		CSS string
	}{
		Config: &config,
		JS:     jsContent.String(),
		CSS:    cssContent.String(),
	}

	if err := t.Execute(w, pageData); err != nil {
		http.Error(w, fmt.Sprintf("Error executing template: %v", err), http.StatusInternalServerError)
	}
}

// SaveData handles the AJAX request to save updated data.
func SaveData(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Error reading request body", http.StatusInternalServerError)
		return
	}

	if err := ioutil.WriteFile("config/config.json", body, 0644); err != nil {
		http.Error(w, "Error writing to file", http.StatusInternalServerError)
		return
	}

	// Reload data after saving
	if err := LoadData(); err != nil {
		http.Error(w, "Error reloading data", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

// HandleBulkAddLinks handles the bulk addition of links.
func HandleBulkAddLinks(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	var newLinksData []map[string]string
	if err := json.NewDecoder(r.Body).Decode(&newLinksData); err != nil {
		http.Error(w, "Error decoding request body: "+err.Error(), http.StatusBadRequest)
		return
	}

	var newLinks []Link
	for _, linkData := range newLinksData {
		newLink := Link{
			Title:   linkData["title"],
			URL:     linkData["url"],
			Desc:    linkData["desc"],
			IconURL: linkData["icon_url"],
			Panel:   linkData["panel"],
		}
		newLinks = append(newLinks, newLink)
	}

	linksFilePath := filepath.Join("data", "links.json")
	file, err := ioutil.ReadFile(linksFilePath)

	var allLinks []Link
	if err != nil {
		if os.IsNotExist(err) {
			allLinks = newLinks
		} else {
			http.Error(w, "Error reading links data", http.StatusInternalServerError)
			return
		}
	} else {
		var existingLinks []Link
		if len(file) > 0 {
			if err := json.Unmarshal(file, &existingLinks); err != nil {
				http.Error(w, "Error unmarshalling links data", http.StatusInternalServerError)
				return
			}
		}
		allLinks = append(existingLinks, newLinks...)
	}

	updatedData, err := json.MarshalIndent(allLinks, "", "  ")
	if err != nil {
		http.Error(w, "Error marshalling updated links", http.StatusInternalServerError)
		return
	}

	// Ensure the data directory exists
	if err := os.MkdirAll(filepath.Dir(linksFilePath), 0755); err != nil {
		http.Error(w, "Error creating data directory", http.StatusInternalServerError)
		return
	}

	if err := ioutil.WriteFile(linksFilePath, updatedData, 0644); err != nil {
		http.Error(w, "Error writing updated links", http.StatusInternalServerError)
		return
	}

	if err := LoadData(); err != nil {
		http.Error(w, "Error reloading data", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

// HandleIconUpload handles icon uploads.
func HandleIconUpload(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	if err := r.ParseMultipartForm(10 << 20); err != nil {
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
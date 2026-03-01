package internal

import (
	"encoding/json"
	"fmt"
	"html/template"
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"
)

// RenderPage serves the main page.
func RenderPage(w http.ResponseWriter, r *http.Request) {
	config := GetConfig()

	templatePath := filepath.Join("web", "templates", "index.html")

	// Read the template file content into a string.
	content, err := ioutil.ReadFile(templatePath)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error reading template file: %v", err), http.StatusInternalServerError)
		return
	}

	// Create a new template, add functions, and then parse the string content.
	t, err := template.New("index.html").Funcs(template.FuncMap{
		"safeCSS": func(s string) template.CSS {
			return template.CSS(s)
		},
		"safeJS": func(s string) template.JS {
			return template.JS(s)
		},
	}).Parse(string(content))

	if err != nil {
		http.Error(w, fmt.Sprintf("Error parsing template: %v", err), http.StatusInternalServerError)
		return
	}

	// Execute the template.
	if err := t.Execute(w, config); err != nil {
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
        isPrimary := false
        if panel, ok := linkData["panel"]; ok && panel == "primary" {
            isPrimary = true
        }

        newLink := Link{
            Title:     linkData["title"],
            URL:       linkData["url"],
            Desc:      linkData["desc"],
            IconURL:   linkData["icon_url"],
            IsPrimary: isPrimary,
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

package handlers

import (
	"encoding/json"
	"fmt"
	"html/template"
	"io/ioutil"
	"net/http"

	"navlty/internal/data"
)

// RenderPage serves the main page.
func RenderPage(w http.ResponseWriter, r *http.Request) {
	config := data.GetConfig()

	t, err := template.New("index").Funcs(template.FuncMap{
		// The `toJSON` function is now defined in the data package.
		"toJSON": func(v interface{}) (template.JS, error) {
			a, err := json.Marshal(v)
			if err != nil {
				return "", err
			}
			return template.JS(a), nil
		},
	}).ParseFiles("templates/index.html")

	if err != nil {
		http.Error(w, fmt.Sprintf("Error parsing template: %v", err), http.StatusInternalServerError)
		return
	}

	if err := t.ExecuteTemplate(w, "index.html", config); err != nil {
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

	if err := ioutil.WriteFile("data.json", body, 0644); err != nil {
		http.Error(w, "Error writing to file", http.StatusInternalServerError)
		return
	}

	// Reload data after saving
	if err := data.LoadData(); err != nil {
		http.Error(w, "Error reloading data", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

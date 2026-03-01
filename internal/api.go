package internal

import (
	"encoding/json"
	"io/ioutil"
	"net/http"
)

func HandleSettings(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	var updatedConfig Config
	if err := json.NewDecoder(r.Body).Decode(&updatedConfig); err != nil {
		http.Error(w, "Error decoding request body", http.StatusBadRequest)
		return
	}

	config.SiteTitle = updatedConfig.SiteTitle
	config.AvatarURL = updatedConfig.AvatarURL
	config.CustomCSS = updatedConfig.CustomCSS
	config.ExternalJS = updatedConfig.ExternalJS

	// Save the updated config to config.json
	file, err := json.MarshalIndent(config, "", " ")
	if err != nil {
		http.Error(w, "Error marshalling config", http.StatusInternalServerError)
		return
	}

	if err := ioutil.WriteFile("config/config.json", file, 0644); err != nil {
		http.Error(w, "Error writing config file", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

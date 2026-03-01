package internal

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"strings"
)

// Config holds the application's configuration.
var config Config

// Link represents a single link.
type Config struct {
	SiteTitle      string              `json:"siteTitle"`
	AvatarURL      string              `json:"avatarURL"`
	CustomCSS      string              `json:"customCSS"`
	ExternalJS     []string            `json:"externalJS"`
	PrimaryLinks   map[string][]Link   `json:"-"` // Grouped by category
	SecondaryLinks map[string][]Link   `json:"-"` // Grouped by category
	JS             string              `json:"-"`
	CSS            string              `json:"-"`
}

type Link struct {
	Title    string `json:"title"`
	URL      string `json:"url"`
	Desc     string `json:"desc"`
	IconURL  string `json:"icon_url"`
	Panel    string `json:"panel"`    // "primary" or "secondary"
	Category string `json:"category,omitempty"`
}

// LoadData loads all necessary data from files.
func LoadData() error {
	// Load main config
	configFile, err := ioutil.ReadFile("config/config.json")
	if err != nil {
		if os.IsNotExist(err) {
			config = Config{ SiteTitle: "Navlty Dashboard", AvatarURL: "" }
			if err := os.MkdirAll("config", 0755); err != nil { return err }
			file, _ := json.MarshalIndent(config, "", " ")
			_ = ioutil.WriteFile("config/config.json", file, 0644)
		} else { return err }
	} else {
		if err := json.Unmarshal(configFile, &config); err != nil { return err }
	}

	// Set default values
	if config.SiteTitle == "" { config.SiteTitle = "Navlty Dashboard" }

	// Load links and group them
	linksFile, err := ioutil.ReadFile("config/links.json")
	if err != nil {
		if !os.IsNotExist(err) { log.Printf("warning: could not load links data: %v", err) }
	} else {
		var allLinks []Link
		if err := json.Unmarshal(linksFile, &allLinks); err != nil { return err }

		config.PrimaryLinks = make(map[string][]Link)
		config.SecondaryLinks = make(map[string][]Link)

		for _, link := range allLinks {
			if link.Category == "" { link.Category = "未分类" }

			if link.Panel == "primary" {
				config.PrimaryLinks[link.Category] = append(config.PrimaryLinks[link.Category], link)
			} else {
				config.SecondaryLinks[link.Category] = append(config.SecondaryLinks[link.Category], link)
			}
		}
	}

	// Load CSS
	config.CSS, err = loadStaticAssets("web/static/css", ".css")
	if err != nil { log.Printf("warning: could not load css: %v", err) }

	// Load JS
	config.JS, err = loadStaticAssets("web/static/js", ".js")
	if err != nil { log.Printf("warning: could not load js: %v", err) }

	return nil
}

// loadStaticAssets reads all files from a directory with a given suffix and concatenates them.
func loadStaticAssets(dir, suffix string) (string, error) {
	var builder strings.Builder
	files, err := ioutil.ReadDir(dir)
	if err != nil { return "", err }

	for _, file := range files {
		if !file.IsDir() && strings.HasSuffix(file.Name(), suffix) {
			content, err := ioutil.ReadFile(filepath.Join(dir, file.Name()))
			if err != nil { return "", err }
			builder.Write(content)
			builder.WriteString("\n")
		}
	}
	return builder.String(), nil
}


// GetConfig returns the current configuration.
func GetConfig() Config {
	return config
}

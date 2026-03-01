package internal

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
)

// Config holds the application's configuration.
type Config struct {
	SiteName       string   `json:"siteName"`
	SiteIcon       string   `json:"siteIcon"`
	SiteTitle      string   `json:"siteTitle"`
	AvatarURL      string   `json:"avatarURL"`
	BackgroundURL  string   `json:"backgroundURL"`
	BackgroundBlur int      `json:"backgroundBlur"`
	CardsPerRow    int      `json:"cardsPerRow"`
	CustomCSS      string   `json:"customCSS"`
	ExternalJS     []string `json:"externalJS"`

	// Fields for template rendering, not from config.json
	ExternalJSStr  string            `json:"-"`
	PrimaryLinks   map[string][]Link `json:"-"`
	SecondaryLinks map[string][]Link `json:"-"`
	CSS            string            `json:"-"`
	JS             string            `json:"-"`
}

// Link represents a single link.
type Link struct {
	Title    string `json:"title"`
	URL      string `json:"url"`
	Desc     string `json:"desc"`
	IconURL  string `json:"icon_url"`
	Panel    string `json:"panel"`
	Category string `json:"category,omitempty"`
}

const (
	configDir      = "config"
	settingsFile   = "config.json"
	linksFile      = "links.json"
	staticCSSDir   = "web/static/css"
	staticJSDir    = "web/static/js"
)

// LoadSettings reads and unmarshals the config.json file.
func LoadSettings() (*Config, error) {
	path := filepath.Join(configDir, settingsFile)
	file, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return &Config{}, nil // Return default config if not found
		}
		return nil, fmt.Errorf("failed to read settings file: %w", err)
	}

	var config Config
	if err := json.Unmarshal(file, &config); err != nil {
		return nil, fmt.Errorf("failed to unmarshal settings: %w", err)
	}
	return &config, nil
}

// SaveSettings saves the provided settings to the config.json file.
func SaveSettings(settings *Config) error {
	path := filepath.Join(configDir, settingsFile)
	file, err := json.MarshalIndent(settings, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal settings: %w", err)
	}
	return os.WriteFile(path, file, 0644)
}

// LoadLinks reads and unmarshals the links.json file.
func LoadLinks() ([]Link, error) {
	path := filepath.Join(configDir, linksFile)
	file, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return []Link{}, nil // Return empty slice if not found
		}
		return nil, fmt.Errorf("failed to read links file: %w", err)
	}

	var links []Link
	if err := json.Unmarshal(file, &links); err != nil {
		return nil, fmt.Errorf("failed to unmarshal links: %w", err)
	}
	return links, nil
}

// SaveLinks saves a slice of links to the links.json file.
func SaveLinks(links []Link) error {
	path := filepath.Join(configDir, linksFile)
	file, err := json.MarshalIndent(links, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal links: %w", err)
	}
	return os.WriteFile(path, file, 0644)
}

// LoadPageData reads all necessary data from disk for page rendering.
func LoadPageData() (*Config, error) {
	config, err := LoadSettings()
	if err != nil {
		return nil, err
	}

	config.ExternalJSStr = strings.Join(config.ExternalJS, "\n")

	links, err := LoadLinks()
	if err != nil {
		log.Printf("warning: could not load links data: %v", err)
	} else {
		config.PrimaryLinks = make(map[string][]Link)
		config.SecondaryLinks = make(map[string][]Link)
		for _, link := range links {
			if link.Category == "" {
				link.Category = "未分类"
			}
			if link.Panel == "primary" {
				config.PrimaryLinks[link.Category] = append(config.PrimaryLinks[link.Category], link)
			} else {
				config.SecondaryLinks[link.Category] = append(config.SecondaryLinks[link.Category], link)
			}
		}
	}

	config.CSS, err = loadStaticAssets(staticCSSDir, ".css")
	if err != nil {
		log.Printf("warning: could not load css: %v", err)
	}
	config.JS, err = loadStaticAssets(staticJSDir, ".js")
	if err != nil {
		log.Printf("warning: could not load js: %v", err)
	}

	return config, nil
}

// loadStaticAssets reads all files from a directory and concatenates them.
func loadStaticAssets(dir, suffix string) (string, error) {
	var builder strings.Builder
	files, err := os.ReadDir(dir)
	if err != nil {
		return "", err
	}

	for _, file := range files {
		if !file.IsDir() && strings.HasSuffix(file.Name(), suffix) {
			content, err := os.ReadFile(filepath.Join(dir, file.Name()))
			if err != nil {
				return "", err
			}
			builder.Write(content)
			builder.WriteString("\n")
		}
	}
	return builder.String(), nil
}

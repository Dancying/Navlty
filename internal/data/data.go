package data

import (
	"encoding/json"
	"io/ioutil"
	"os"
)

// Config holds the application's configuration data.
type Config struct {
	SiteTitle      string `json:"siteTitle"`
	AvatarURL      string `json:"avatarURL"`
	PrimaryLinks   []Link `json:"primaryLinks"`
	SecondaryLinks []Link `json:"secondaryLinks"`
	CSS            string `json:"-"` // Ignored by JSON encoder
	JS             string `json:"-"` // Ignored by JSON encoder
}

// Link represents a single hyperlink.
type Link struct {
	Title string `json:"title"`
	URL   string `json:"url"`
	Desc  string `json:"desc,omitempty"`
}

var config *Config

// LoadData reads and parses the JSON data file.
func LoadData() error {
	file, err := os.Open("data.json")
	if err != nil {
		return err
	}
	defer file.Close()

	bytes, err := ioutil.ReadAll(file)
	if err != nil {
		return err
	}

	// Unmarshal the main config
	if err := json.Unmarshal(bytes, &config); err != nil {
		return err
	}

	// Load CSS files
	css, err := loadCSS("static/css/base.css", "static/css/header.css", "static/css/panels.css")
	if err != nil {
		return err
	}
	config.CSS = css

	// Load JS
	js, err := ioutil.ReadFile("static/js/script.js")
	if err != nil {
		return err
	}
	config.JS = string(js)

	return nil
}

// GetConfig returns the loaded configuration.
func GetConfig() *Config {
	return config
}

// ToJSON converts the config object back to a JSON string for the editor.
func (c *Config) ToJSON() (string, error) {
	bytes, err := json.MarshalIndent(c, "", "  ")
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}

// loadCSS reads and concatenates multiple CSS files.
func loadCSS(files ...string) (string, error) {
	var css string
	for _, file := range files {
		content, err := ioutil.ReadFile(file)
		if err != nil {
			return "", err
		}
		css += string(content) + "\n"
	}
	return css, nil
}

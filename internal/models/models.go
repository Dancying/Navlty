package models

import "html/template"

// Link represents a single link in the navigation.
type Link struct {
	Title     string `json:"title"`
	URL       string `json:"url"`
	Icon      string `json:"icon"`
	Desc      string `json:"desc"`
	IsPrimary bool   `json:"isPrimary"`
}

// Config represents the overall configuration for the site.
type Config struct {
	SiteTitle string `json:"siteTitle"`
	AvatarURL string `json:"avatarURL"`
	Links     []Link `json:"links"`
}

// PageData holds all the data for rendering the index template.
type PageData struct {
	Config
	CSS template.CSS
	JS  template.JS
}

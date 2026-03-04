package pkg

import (
	"log"
	"os"
	"strings"
)

const (
	authFileName     = "auth.json"
	linksFileName    = "links.json"
	settingsFileName = "settings.json"
)

// LoadPageData 读取渲染页面所需的全部数据。
func LoadPageData() *PageData {
	settings := LoadSettings()

	pageData := &PageData{
		Settings:      *settings,
		ExternalJSStr: strings.Join(settings.ExternalJS, "\n"),
	}

	pageData.PrimaryLinks, pageData.SecondaryLinks = processLinks()
	pageData.CSS, pageData.JS = loadAllStaticAssets()

	return pageData
}

// processLinks 加载链接并按 JSON 文件中的顺序归类到面板。
func processLinks() ([]LinkCategory, []LinkCategory) {
	links := LoadLinks()

	var primaryCategories []LinkCategory
	var secondaryCategories []LinkCategory
	primaryCategoryIndex := make(map[string]int)
	secondaryCategoryIndex := make(map[string]int)

	for _, link := range links {
		if link.Category == "" {
			link.Category = "Uncategorized"
		}

		if link.Panel == "primary" {
			if index, ok := primaryCategoryIndex[link.Category]; ok {
				primaryCategories[index].Links = append(primaryCategories[index].Links, link)
			} else {
				primaryCategoryIndex[link.Category] = len(primaryCategories)
				primaryCategories = append(primaryCategories, LinkCategory{
					Name:  link.Category,
					Links: []Link{link},
				})
			}
		} else {
			if index, ok := secondaryCategoryIndex[link.Category]; ok {
				secondaryCategories[index].Links = append(secondaryCategories[index].Links, link)
			} else {
				secondaryCategoryIndex[link.Category] = len(secondaryCategories)
				secondaryCategories = append(secondaryCategories, LinkCategory{
					Name:  link.Category,
					Links: []Link{link},
				})
			}
		}
	}

	return primaryCategories, secondaryCategories
}

// LoadSettings 读取设置，如果文件不存在则创建一个默认文件。
func LoadSettings() *Settings {
	settings := &Settings{}
	if err := loadJSONData(settingsFileName, settings); err != nil {
		if os.IsNotExist(err) {
			log.Println("info: settings.json not found, creating with default values")
			defaultSettings := &Settings{
				SiteName:       "Navlty - A Lightweight Dashboard",
				SiteTitle:      "Navlty Dashboard",
				CardsPerRow:    2,
				BackgroundBlur: 8,
                BackgroundURL:  "",
			}
			if err := SaveSettings(defaultSettings); err != nil {
				log.Printf("error: failed to save default settings: %v", err)
				return defaultSettings
			}
			return defaultSettings
		}
		log.Printf("warning: could not load settings: %v", err)
	}
	return settings
}

// SaveSettings 将给定的设置保存到磁盘。
func SaveSettings(settings *Settings) error {
	return saveJSONData(settingsFileName, settings)
}

// LoadLinks 读取链接，如果文件不存在则创建一个默认文件。
func LoadLinks() []Link {
	var links []Link
	if err := loadJSONData(linksFileName, &links); err != nil {
		if os.IsNotExist(err) {
			log.Println("info: links.json not found, creating with default values")
			defaultLinks := []Link{
				{
					URL:      "https://www.google.com",
					Title:    "Google",
					Desc:     "The world's most popular search engine.",
					IconURL:  "https://api.iconify.design/logos/google-icon.svg",
					Panel:    "primary",
					Category: "Demo",
				},
				{
					URL:      "https://www.github.com",
					Title:    "GitHub",
					Desc:     "Platform for software development and version control.",
					IconURL:  "https://api.iconify.design/logos/github-icon.svg",
					Panel:    "primary",
					Category: "Demo",
				},
			}
			if err := SaveLinks(defaultLinks); err != nil {
				log.Printf("error: failed to save default links: %v", err)
				return defaultLinks
			}
			return defaultLinks
		}
		log.Printf("warning: could not load links: %v", err)
	}
	if links == nil {
		return []Link{}
	}
	return links
}

// SaveLinks 将给定的链接保存到磁盘。
func SaveLinks(links []Link) error {
	return saveJSONData(linksFileName, links)
}

// LoadAuth 从 auth.json 加载身份验证数据
func LoadAuth() *Auth {
	var auth Auth
	loadJSONData(authFileName, &auth)
	return &auth
}

// SaveAuth 将身份验证数据保存到 auth.json
func SaveAuth(auth *Auth) {
	saveJSONData(authFileName, auth)
}

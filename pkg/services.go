package pkg

import (
	"log"
	"os"
	"strings"
)

const (
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

// processLinks 加载链接并将其分类到不同的面板。
func processLinks() (map[string][]Link, map[string][]Link) {
	links := LoadLinks()
	primaryLinks := make(map[string][]Link)
	secondaryLinks := make(map[string][]Link)

	for _, link := range links {
		if link.Category == "" {
			link.Category = "Uncategorized"
		}
		if link.Panel == "primary" {
			primaryLinks[link.Category] = append(primaryLinks[link.Category], link)
		} else {
			secondaryLinks[link.Category] = append(secondaryLinks[link.Category], link)
		}
	}
	return primaryLinks, secondaryLinks
}

// LoadSettings 读取设置，如果文件不存在则创建一个默认文件。
func LoadSettings() *Settings {
	settings := &Settings{}
	if err := loadJSONData(settingsFileName, settings); err != nil {
		if os.IsNotExist(err) {
			log.Println("info: settings.json not found, creating with default values")
			defaultSettings := &Settings{
				SiteName:       "Navlty - A lightweight dashboard",
				SiteTitle:      "Navlty Dashboard",
				CardsPerRow:    2,
				BackgroundBlur: 8,
			}
			if err := SaveSettings(defaultSettings); err != nil {
				log.Printf("error: failed to save default settings: %v", err)
				return defaultSettings // 返回内存中的默认值
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
				return defaultLinks // 返回内存中的默认值
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

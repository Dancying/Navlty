package pkg

import (
	"log"
	"os"
	"strings"

	"github.com/google/uuid"
)

const (
	authFileName     = "auth.json"
	linksFileName    = "links.json"
	settingsFileName = "settings.json"
)

// loadOrCreate 尝试从文件加载数据，如果失败（特别是文件不存在时），则调用 factory 函数创建并保存默认数据
func loadOrCreate[T any](fileName string, factory func() T) T {
	var data T
	if err := loadJSONData(fileName, &data); err != nil {
		if os.IsNotExist(err) {
			log.Printf("info: %s not found, creating with default values", fileName)
			defaultData := factory()
			if err := saveJSONData(fileName, defaultData); err != nil {
				log.Printf("error: failed to save default %s: %v", fileName, err)
			}
			return defaultData
		}
		log.Printf("warning: could not load %s: %v", fileName, err)
	}
	return data
}

// LoadPageData 读取渲染页面所需的全部数据。
func LoadPageData() *PageData {
	settings := LoadSettings()

	pageData := &PageData{
		Settings:      *settings,
		ExternalJSStr: strings.Join(settings.ExternalJS, "\n"),
	}

	panels := LoadLinks()
	pageData.PrimaryLinks = panels["primary"]
	pageData.SecondaryLinks = panels["secondary"]

	pageData.CSS, pageData.JS = loadAllStaticAssets()

	return pageData
}

// LoadSettings 读取设置，如果文件不存在则创建一个默认文件。
func LoadSettings() *Settings {
	return loadOrCreate(settingsFileName, func() *Settings {
		return &Settings{
			SiteName:       "Navlty - A Lightweight Dashboard",
			SiteTitle:      "Navlty Dashboard",
			CardsPerRow:    2,
			BackgroundBlur: 8,
			BackgroundURL:  "",
		}
	})
}

// SaveSettings 将给定的设置保存到磁盘。
func SaveSettings(settings *Settings) error {
	return saveJSONData(settingsFileName, settings)
}

// LoadLinks 读取链接，如果文件不存在则创建一个默认文件。
func LoadLinks() map[string][]LinkCategory {
	panels := loadOrCreate(linksFileName, func() map[string][]LinkCategory {
		return map[string][]LinkCategory{
			"primary": {
				{
					Name: "Demo",
					Links: []Link{
						{
							ID:      uuid.NewString(),
							Title:   "Google",
							URL:     "https://www.google.com",
							Desc:    "The world's most popular search engine.",
							IconURL: "https://api.iconify.design/logos/google-icon.svg",
							Sort:    0,
						},
						{
							ID:      uuid.NewString(),
							Title:   "GitHub",
							URL:     "https://www.github.com",
							Desc:    "Platform for software development and version control.",
							IconURL: "https://api.iconify.design/logos/github-icon.svg",
							Sort:    1,
						},
					},
				},
			},
		}
	})

	if panels == nil {
		return make(map[string][]LinkCategory)
	}
	return panels
}

// SaveLinks 将给定的链接保存到磁盘。
func SaveLinks(panels map[string][]LinkCategory) error {
	return saveJSONData(linksFileName, panels)
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

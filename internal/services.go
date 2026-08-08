package internal

import (
	"log"
	"os"
	"sort"

	"github.com/google/uuid"
)

const (
	authFileName     = "auth.json"
	linksFileName    = "links.json"
	settingsFileName = "settings.json"
)

// loadOrCreate 加载数据，文件不存在时创建默认数据
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

// LoadPageData 读取页面渲染所需数据
func LoadPageData() *PageData {
	settings := LoadSettings()
	panels := LoadLinks()

	return &PageData{
		Settings:       *settings,
		PrimaryLinks:   panels["primary"],
		SecondaryLinks: panels["secondary"],
	}
}

// LoadSettings 读取设置，不存在时创建默认设置
func LoadSettings() *Settings {
	return loadOrCreate(settingsFileName, func() *Settings {
		return &Settings{
			SiteName:       "Navlty - A Lightweight Dashboard",
			SiteTitle:      "Navlty Dashboard",
			CardsPerRow:    2,
			BackgroundBlur: 8,
			BackgroundURL:  "",
			Theme:          "cool-white",
		}
	})
}

// SaveSettings 保存设置
func SaveSettings(settings *Settings) error {
	return saveJSONData(settingsFileName, settings)
}

// LoadLinks 读取链接，不存在时创建默认链接
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

	for _, categories := range panels {
		for i := range categories {
			sort.Slice(categories[i].Links, func(j, k int) bool {
				return categories[i].Links[j].Sort < categories[i].Links[k].Sort
			})
		}
	}

	return panels
}

// SaveLinks 保存链接
func SaveLinks(panels map[string][]LinkCategory) error {
	return saveJSONData(linksFileName, panels)
}

// LoadAuth 加载身份验证数据
func LoadAuth() *Auth {
	var auth Auth
	loadJSONData(authFileName, &auth)
	return &auth
}

// SaveAuth 保存身份验证数据
func SaveAuth(auth *Auth) {
	saveJSONData(authFileName, auth)
}

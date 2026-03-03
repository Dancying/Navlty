package pkg

// Settings 定义了网站的配置信息。
type Settings struct {
	SiteName       string   `json:"siteName"`
	SiteIcon       string   `json:"siteIcon"`
	SiteTitle      string   `json:"siteTitle"`
	AvatarURL      string   `json:"avatarURL"`
	BackgroundURL  string   `json:"backgroundURL"`
	BackgroundBlur int      `json:"backgroundBlur"`
	CardsPerRow    int      `json:"cardsPerRow"`
	CustomCSS      string   `json:"customCSS"`
	ExternalJS     []string `json:"externalJS"`
}

// LinkCategory 定义了链接的分类。
type LinkCategory struct {
	Name  string
	Links []Link
}

// PageData 包含了页面渲染所需的全部数据。
type PageData struct {
	Settings
	ExternalJSStr  string
	PrimaryLinks   []LinkCategory
	SecondaryLinks []LinkCategory
	CSS            string
	JS             string
}

// Link 代表一个链接条目。
type Link struct {
	Title    string `json:"title"`
	URL      string `json:"url"`
	Desc     string `json:"desc"`
	IconURL  string `json:"icon_url"`
	Panel    string `json:"panel"`
	Category string `json:"category,omitempty"`
}

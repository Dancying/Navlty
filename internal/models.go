package internal

import "encoding/json"

// Auth 定义了授权文件的结构
type Auth struct {
	PasswordHash string `json:"password_hash"`
}

// Link 代表一个链接条目。
type Link struct {
	ID      string `json:"id"`
	Title   string `json:"title"`
	URL     string `json:"url"`
	Desc    string `json:"desc"`
	IconURL string `json:"icon_url"`
	Sort    int    `json:"sort"`
}

// LinkCategory 定义了链接的分类。
type LinkCategory struct {
	Name  string `json:"name"`
	Links []Link `json:"links"`
}

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

// PageData 包含了页面渲染所需的全部数据。
type PageData struct {
	Settings
	ExternalJSStr  string
	PrimaryLinks   []LinkCategory
	SecondaryLinks []LinkCategory
	CSS            string
	JS             string
}

// BatchAction 定义了批量操作的通用结构
type BatchAction struct {
	Action  string          `json:"action"`
	Payload json.RawMessage `json:"payload"`
}

// CreateLinksPayload 定义了 CREATE_LINKS 操作的数据
type CreateLinksPayload struct {
	Panel    string `json:"panel"`
	Category string `json:"category"`
	Links    []Link `json:"links"`
}

// DeleteLinksPayload 定义了 DELETE_LINKS 操作的数据
type DeleteLinksPayload struct {
	IDs []string `json:"ids"`
}

// UpdateLinkItem 定义了 UPDATE_LINKS 中单个链接的更新数据
type UpdateLinkItem struct {
	ID      string          `json:"id"`
	Updates json.RawMessage `json:"updates"`
}

// MoveLinksPayload 定义了 MOVE_LINKS 操作的数据
type MoveLinksPayload struct {
	IDs    []string `json:"ids"`
	Target struct {
		Panel    string `json:"panel"`
		Category string `json:"category"`
	} `json:"target"`
}

// DeleteCategoryPayload 定义了 DELETE_CATEGORIES 操作的数据
type DeleteCategoryPayload struct {
	Panel    string `json:"panel"`
	Category string `json:"category"`
}

// ReorderCategoriesPayload 定义了 REORDER_CATEGORIES 操作的数据
type ReorderCategoriesPayload struct {
	Panel                string   `json:"panel"`
	OrderedCategoryNames []string `json:"orderedCategoryNames"`
}

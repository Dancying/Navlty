package pkg

import (
	"bytes"
	"encoding/json"
	"html/template"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
)

// RenderPage 使用数据渲染主 HTML 页面。
func RenderPage(w http.ResponseWriter, r *http.Request) {
	pageData := LoadPageData()

	templatePath := "index.html"
	t, err := template.New("index.html").Funcs(template.FuncMap{
		"safeCSS": func(s string) template.CSS { return template.CSS(s) },
		"safeJS":  func(s string) template.JS { return template.JS(s) },
		"isURLOrBase64": func(s string) bool {
			return strings.HasPrefix(s, "http") || strings.HasPrefix(s, "data:image")
		},
	}).ParseFiles(templatePath)

	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Error parsing template: "+err.Error())
		return
	}

	var buf bytes.Buffer
	if err := t.Execute(&buf, pageData); err != nil {
		respondWithError(w, http.StatusInternalServerError, "Error executing template: "+err.Error())
		return
	}

	minifiedHTML, err := m.Bytes("text/html", buf.Bytes())
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Error minifying HTML: "+err.Error())
		w.Write(buf.Bytes())
		return
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Write(minifiedHTML)
}

// HandleSettings 根据 HTTP 方法路由设置相关的请求。
func HandleSettings(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		getSettings(w)
	case http.MethodPost:
		saveSettings(w, r)
	case http.MethodPatch:
		patchSettings(w, r)
	default:
		respondWithError(w, http.StatusMethodNotAllowed, "Invalid request method")
	}
}

// HandleLinks 根据 HTTP 方法处理链接相关的请求。
func HandleLinks(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		links := LoadLinks()
		respondWithJSON(w, http.StatusOK, links)
	case http.MethodPost:
		var panels map[string][]LinkCategory
		if err := json.NewDecoder(r.Body).Decode(&panels); err != nil {
			respondWithError(w, http.StatusBadRequest, "Invalid data format: "+err.Error())
			return
		}

		for _, categories := range panels {
			for i := range categories {
				maxSort := -1
				for _, link := range categories[i].Links {
					if link.Sort > maxSort {
						maxSort = link.Sort
					}
				}

				for j := range categories[i].Links {
					if categories[i].Links[j].ID == "" {
						categories[i].Links[j].ID = uuid.NewString()
						maxSort++
						categories[i].Links[j].Sort = maxSort
					}
				}
			}
		}

		if err := SaveLinks(panels); err != nil {
			respondWithError(w, http.StatusInternalServerError, "Failed to save links: "+err.Error())
			return
		}

		respondWithJSON(w, http.StatusOK, map[string]string{"message": "Links updated successfully"})
	default:
		respondWithError(w, http.StatusMethodNotAllowed, "Invalid request method")
	}
}

// getSettings 处理获取当前网站设置的请求。
func getSettings(w http.ResponseWriter) {
	settings := LoadSettings()
	respondWithJSON(w, http.StatusOK, settings)
}

// saveSettings 处理保存新网站设置的请求。
func saveSettings(w http.ResponseWriter, r *http.Request) {
	var newSettings Settings
	if err := json.NewDecoder(r.Body).Decode(&newSettings); err != nil {
		respondWithError(w, http.StatusBadRequest, "Error decoding request body: "+err.Error())
		return
	}

	if err := SaveSettings(&newSettings); err != nil {
		respondWithError(w, http.StatusInternalServerError, "Error saving settings: "+err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]string{"status": "success"})
}

// patchSettings 处理对网站设置的局部更新请求。
func patchSettings(w http.ResponseWriter, r *http.Request) {
	currentSettings := LoadSettings()

	var currentSettingsMap map[string]interface{}
	settingsBytes, err := json.Marshal(currentSettings)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to serialize current settings: "+err.Error())
		return
	}
	json.Unmarshal(settingsBytes, &currentSettingsMap)

	var updates map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request body: "+err.Error())
		return
	}

	for key, value := range updates {
		currentSettingsMap[key] = value
	}

	updatedBytes, err := json.Marshal(currentSettingsMap)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to serialize updated settings: "+err.Error())
		return
	}

	var updatedSettings Settings
	if err := json.Unmarshal(updatedBytes, &updatedSettings); err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to apply updates to settings structure: "+err.Error())
		return
	}

	if err := SaveSettings(&updatedSettings); err != nil {
		respondWithError(w, http.StatusInternalServerError, "Error saving settings: "+err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]string{"status": "success"})
}

// HandleAuth 处理用户登录请求
func HandleAuth(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondWithError(w, http.StatusMethodNotAllowed, "Invalid request method")
		return
	}

	var creds struct {
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	auth := LoadAuth()

	if auth.PasswordHash == "" {
		hashedPassword, err := HashPassword(creds.Password)
		if err != nil {
			respondWithError(w, http.StatusInternalServerError, "Failed to hash password")
			return
		}
		auth.PasswordHash = hashedPassword
		SaveAuth(auth)

		createAndSetSessionCookie(w)
		respondWithJSON(w, http.StatusOK, map[string]interface{}{"success": true, "message": "访问密码设置成功"})
		return
	}

	if CheckPasswordHash(creds.Password, auth.PasswordHash) {
		createAndSetSessionCookie(w)
		respondWithJSON(w, http.StatusOK, map[string]interface{}{"success": true, "message": "验证成功"})
	} else {
		respondWithJSON(w, http.StatusUnauthorized, map[string]interface{}{"success": false, "message": "访问密码错误"})
	}
}

// HandleLogout 处理用户登出请求
func HandleLogout(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("session_token")
	if err != nil {
		w.WriteHeader(http.StatusOK)
		return
	}

	deleteSession(cookie.Value)

	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    "",
		Expires:  time.Unix(0, 0),
		HttpOnly: true,
		Path:     "/",
	})

	w.WriteHeader(http.StatusOK)
}

// HandleChangePassword 处理修改密码请求
func HandleChangePassword(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondWithError(w, http.StatusMethodNotAllowed, "Invalid request method")
		return
	}

	var creds struct {
		CurrentPassword string `json:"currentPassword"`
		NewPassword     string `json:"newPassword"`
	}

	if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	auth := LoadAuth()

	if !CheckPasswordHash(creds.CurrentPassword, auth.PasswordHash) {
		respondWithJSON(w, http.StatusUnauthorized, map[string]interface{}{"success": false, "message": "当前密码不正确"})
		return
	}

	hashedPassword, err := HashPassword(creds.NewPassword)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to hash new password")
		return
	}

	auth.PasswordHash = hashedPassword
	SaveAuth(auth)

	InvalidateAllSessions()

	respondWithJSON(w, http.StatusOK, map[string]interface{}{"success": true, "message": "密码修改成功"})
}

// HandleAuthStatus 检查系统是否已设置管理员密码
func HandleAuthStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		respondWithError(w, http.StatusMethodNotAllowed, "Invalid request method")
		return
	}

	auth := LoadAuth()

	respondWithJSON(w, http.StatusOK, map[string]bool{
		"isPasswordSet": auth.PasswordHash != "",
	})
}

// createAndSetSessionCookie 创建一个新的会话并将其作为 cookie 设置到 HTTP 响应中。
func createAndSetSessionCookie(w http.ResponseWriter) {
	sessionToken := createSession()
	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    sessionToken,
		HttpOnly: true,
		Path:     "/",
	})
}

// findOrCreateCategory 在一个分类列表中查找指定名称的分类，如果找不到则创建并返回它。
func findOrCreateCategory(categories *[]LinkCategory, categoryName string) *LinkCategory {
	for i := range *categories {
		if (*categories)[i].Name == categoryName {
			return &(*categories)[i]
		}
	}

	newCategory := LinkCategory{Name: categoryName, Links: []Link{}}
	*categories = append(*categories, newCategory)
	return &(*categories)[len(*categories)-1]
}

// HandleLinksBatch 处理所有链接的批量事务操作
func HandleLinksBatch(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondWithError(w, http.StatusMethodNotAllowed, "Invalid request method")
		return
	}

	var actions []BatchAction
	if err := json.NewDecoder(r.Body).Decode(&actions); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid actions format: "+err.Error())
		return
	}

	panels := LoadLinks()

	for _, action := range actions {
		switch action.Action {
		case "CREATE_LINKS":
			var payload CreateLinksPayload
			if err := json.Unmarshal(action.Payload, &payload); err != nil {
				respondWithError(w, http.StatusBadRequest, "Invalid CREATE_LINKS payload: "+err.Error())
				return
			}

			targetPanel, panelExists := panels[payload.Panel]
			if !panelExists {
				targetPanel = []LinkCategory{}
			}

			targetCategory := findOrCreateCategory(&targetPanel, payload.Category)

			maxSort := -1
			for _, link := range targetCategory.Links {
				if link.Sort > maxSort {
					maxSort = link.Sort
				}
			}

			for _, newLink := range payload.Links {
				maxSort++
				newLink.ID = uuid.NewString()
				newLink.Sort = maxSort
				targetCategory.Links = append(targetCategory.Links, newLink)
			}
			panels[payload.Panel] = targetPanel

		case "DELETE_LINKS":
			var payload DeleteLinksPayload
			if err := json.Unmarshal(action.Payload, &payload); err != nil {
				respondWithError(w, http.StatusBadRequest, "Invalid DELETE_LINKS payload: "+err.Error())
				return
			}
			idsToDelete := make(map[string]struct{})
			for _, id := range payload.IDs {
				idsToDelete[id] = struct{}{}
			}

			for panelKey, categories := range panels {
				for i := range categories {
					var remainingLinks []Link
					for _, link := range categories[i].Links {
						if _, found := idsToDelete[link.ID]; !found {
							remainingLinks = append(remainingLinks, link)
						}
					}
					panels[panelKey][i].Links = remainingLinks
				}
			}

		case "UPDATE_LINKS":
			var payload []UpdateLinkItem
			if err := json.Unmarshal(action.Payload, &payload); err != nil {
				respondWithError(w, http.StatusBadRequest, "Invalid UPDATE_LINKS payload: "+err.Error())
				return
			}
			updatesMap := make(map[string]json.RawMessage)
			for _, item := range payload {
				updatesMap[item.ID] = item.Updates
			}

			for _, categories := range panels {
				for i := range categories {
					for j := range categories[i].Links {
						link := &categories[i].Links[j]
						if updates, found := updatesMap[link.ID]; found {
							if err := json.Unmarshal(updates, link); err != nil {
								respondWithError(w, http.StatusBadRequest, "Failed to apply updates to link "+link.ID)
								return
							}
						}
					}
				}
			}

		case "MOVE_LINKS":
			var payload MoveLinksPayload
			if err := json.Unmarshal(action.Payload, &payload); err != nil {
				respondWithError(w, http.StatusBadRequest, "Invalid MOVE_LINKS payload: "+err.Error())
				return
			}
			idsToMove := make(map[string]struct{})
			for _, id := range payload.IDs {
				idsToMove[id] = struct{}{}
			}

			var movedLinks []Link
			for panelKey, categories := range panels {
				for i := range categories {
					var remainingLinks []Link
					for _, link := range categories[i].Links {
						if _, found := idsToMove[link.ID]; found {
							movedLinks = append(movedLinks, link)
						} else {
							remainingLinks = append(remainingLinks, link)
						}
					}
					panels[panelKey][i].Links = remainingLinks
				}
			}

			targetPanel, panelExists := panels[payload.Target.Panel]
			if !panelExists {
				targetPanel = []LinkCategory{}
			}

			targetCategory := findOrCreateCategory(&targetPanel, payload.Target.Category)

			maxSort := -1
			for _, link := range targetCategory.Links {
				if link.Sort > maxSort {
					maxSort = link.Sort
				}
			}

			for _, link := range movedLinks {
				maxSort++
				link.Sort = maxSort
				targetCategory.Links = append(targetCategory.Links, link)
			}
			panels[payload.Target.Panel] = targetPanel

		case "DELETE_CATEGORIES":
			var payload []DeleteCategoryPayload
			if err := json.Unmarshal(action.Payload, &payload); err != nil {
				respondWithError(w, http.StatusBadRequest, "Invalid DELETE_CATEGORIES payload: "+err.Error())
				return
			}

			for _, catToDelete := range payload {
				if categories, ok := panels[catToDelete.Panel]; ok {
					var remainingCategories []LinkCategory
					for _, category := range categories {
						if category.Name != catToDelete.Category {
							remainingCategories = append(remainingCategories, category)
						}
					}
					panels[catToDelete.Panel] = remainingCategories
				}
			}
		case "REORDER_CATEGORIES":
			var payload ReorderCategoriesPayload
			if err := json.Unmarshal(action.Payload, &payload); err != nil {
				respondWithError(w, http.StatusBadRequest, "Invalid REORDER_CATEGORIES payload: "+err.Error())
				return
			}

			currentCategories, panelExists := panels[payload.Panel]
			if !panelExists {
				respondWithError(w, http.StatusBadRequest, "Panel not found for reordering: "+payload.Panel)
				return
			}

			categoryMap := make(map[string]LinkCategory)
			for _, category := range currentCategories {
				categoryMap[category.Name] = category
			}

			reorderedCategories := make([]LinkCategory, 0, len(payload.OrderedCategoryNames))
			for _, categoryName := range payload.OrderedCategoryNames {
				if category, found := categoryMap[categoryName]; found {
					reorderedCategories = append(reorderedCategories, category)
				}
			}
			panels[payload.Panel] = reorderedCategories

		default:
			respondWithError(w, http.StatusBadRequest, "Unknown action: "+action.Action)
			return
		}
	}

	if err := SaveLinks(panels); err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to save links after batch update: "+err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]string{"message": "Batch update successful"})
}

package internal

import (
	"bytes"
	"encoding/json"
	"fmt"
	"html/template"
	"net/http"
	"strings"
	"time"
)

// renderIcon 根据图标类型生成 HTML
func renderIcon(icon string) template.HTML {
	if strings.HasPrefix(icon, "http") || strings.HasPrefix(icon, "data:image") {
		return template.HTML(fmt.Sprintf(`<img src="%s" class="icon">`, icon))
	}
	if strings.HasPrefix(icon, "<svg") && strings.HasSuffix(icon, "</svg>") {
		if !strings.Contains(icon, "class=") { return template.HTML(strings.Replace(icon, "<svg", `<svg class="icon"`, 1)) }
		return template.HTML(icon)
	}
	return template.HTML(fmt.Sprintf(`<i data-feather="%s" class="icon"></i>`, icon))
}

// RenderPage 渲染主 HTML 页面
func RenderPage(w http.ResponseWriter, r *http.Request) {
	pageData := LoadPageData()
	publicCSS, publicJS := LoadPublicAssets()

	themeCSS := LoadThemeCSS(pageData.Theme)

	cookie, err := r.Cookie("session_token")
	if err == nil && IsSessionValid(cookie.Value) {
		authCSS, authJS := LoadAuthAssets()
		pageData.CSS = publicCSS + "\n" + authCSS + "\n" + themeCSS
		pageData.JS = publicJS + "\n" + authJS
	} else {
		pageData.CSS = publicCSS + "\n" + themeCSS
		pageData.JS = publicJS
	}

	templatePath := "web/index.html"
	t, parseErr := template.New("index.html").Funcs(template.FuncMap{
		"safeCSS":    func(s string) template.CSS { return template.CSS(s) },
		"safeJS":     func(s string) template.JS { return template.JS(s) },
		"safeHTML":   func(s string) template.HTML { return template.HTML(s) },
		"renderIcon": renderIcon,
	}).ParseFiles(templatePath)
	if parseErr != nil {
		respondWithError(w, http.StatusInternalServerError, "Error parsing template: "+parseErr.Error())
		return
	}

	var buf bytes.Buffer
	if execErr := t.Execute(&buf, pageData); execErr != nil {
		respondWithError(w, http.StatusInternalServerError, "Error executing template: "+execErr.Error())
		return
	}

	minifiedHTML, minErr := m.Bytes("text/html", buf.Bytes())
	if minErr != nil {
		respondWithError(w, http.StatusInternalServerError, "Error minifying HTML: "+minErr.Error())
		w.Write(buf.Bytes())
		return
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Write(minifiedHTML)
}

// HandleSettings 根据请求方法处理设置
func HandleSettings(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		getSettings(w)
	case http.MethodPatch:
		patchSettings(w, r)
	default:
		respondWithError(w, http.StatusMethodNotAllowed, "Invalid request method")
	}
}

// getLinks 获取所有链接
func getLinks(w http.ResponseWriter, r *http.Request) {
	respondWithJSON(w, http.StatusOK, LoadLinks())
}

// getSettings 获取网站设置
func getSettings(w http.ResponseWriter) {
	respondWithJSON(w, http.StatusOK, LoadSettings())
}

// patchSettings 局部更新网站设置
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
		if key == "theme" && value == "" {
			value = "cool-white"
		}
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

// HandleAuth 处理用户登录
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

// HandleLogout 处理用户登出
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

// HandleChangePassword 处理修改密码
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

// HandleAuthStatus 检查管理员密码是否已设置
func HandleAuthStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		respondWithError(w, http.StatusMethodNotAllowed, "Invalid request method")
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]bool{
		"isPasswordSet": LoadAuth().PasswordHash != "",
	})
}

// createAndSetSessionCookie 创建会话并设置 Cookie
func createAndSetSessionCookie(w http.ResponseWriter) {
	sessionToken := createSession()
	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    sessionToken,
		HttpOnly: true,
		Path:     "/",
	})
}

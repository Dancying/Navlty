package pkg

import (
	"encoding/json"
	"net/http"
	"sync"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// session 代表一个用户会话
type session struct {
	// expiry time.Time // 不再需要 expiry
}

// sessions 是一个线程安全的会话存储
var (
	sessions = make(map[string]session)
	mu       sync.Mutex
)

// createSession 创建一个新的会话并返回会话令牌
func createSession() string {
	sessionToken := uuid.NewString()
	mu.Lock()
	sessions[sessionToken] = session{}
	mu.Unlock()
	return sessionToken
}

// IsSessionValid 检查会话令牌是否有效
func IsSessionValid(sessionToken string) bool {
	mu.Lock()
	defer mu.Unlock()
	_, exists := sessions[sessionToken]
	return exists
}

// deleteSession 删除一个会话
func deleteSession(sessionToken string) {
	mu.Lock()
	delete(sessions, sessionToken)
	mu.Unlock()
}

// AuthMiddleware 是一个中间件，用于保护需要认证的路由
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("session_token")
		if err != nil {
			if err == http.ErrNoCookie {
				respondWithError(w, http.StatusUnauthorized, "Unauthorized: Access is denied. Please log in.")
				return
			}
			respondWithError(w, http.StatusBadRequest, "Bad Request")
			return
		}

		sessionToken := cookie.Value
		if !IsSessionValid(sessionToken) {
			respondWithError(w, http.StatusUnauthorized, "Unauthorized: Session is invalid or expired.")
			return
		}

		next.ServeHTTP(w, r)
	})
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

	// 如果是首次启动，设置密码
	if auth.PasswordHash == "" {
		hashedPassword, err := HashPassword(creds.Password)
		if err != nil {
			respondWithError(w, http.StatusInternalServerError, "Failed to hash password")
			return
		}
		auth.PasswordHash = hashedPassword
		SaveAuth(auth)

		sessionToken := createSession()
		http.SetCookie(w, &http.Cookie{
			Name:     "session_token",
			Value:    sessionToken,
			HttpOnly: true,
			Path:     "/",
		})
		respondWithJSON(w, http.StatusOK, map[string]interface{}{"success": true, "message": "访问密码设置成功"})
		return
	}

	// 验证密码
	if CheckPasswordHash(creds.Password, auth.PasswordHash) {
		sessionToken := createSession()
		http.SetCookie(w, &http.Cookie{
			Name:     "session_token",
			Value:    sessionToken,
			HttpOnly: true,
			Path:     "/",
		})
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

    // 使所有旧的会话无效
    mu.Lock()
    sessions = make(map[string]session)
    mu.Unlock()

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

// HashPassword 对密码进行哈希处理
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}

// CheckPasswordHash 验证密码和哈希值是否匹配
func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

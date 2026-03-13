package internal

import (
	"net/http"
	"slices"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

const sessionDuration = 24 * time.Hour

// createSession 创建一个新的会话，并将其添加到 auth.json 中
func createSession() string {
	newSession := Session{
		Token:   uuid.NewString(),
		Expires: time.Now().Add(sessionDuration).Unix(),
	}
	auth := LoadAuth()
	if auth.Sessions == nil {
		auth.Sessions = []Session{}
	}
	auth.Sessions = append(auth.Sessions, newSession)
	SaveAuth(auth)
	return newSession.Token
}

// IsSessionValid 检查给定的会话令牌是否有效，并清理过期的会话
func IsSessionValid(sessionToken string) bool {
	auth := LoadAuth()
	currentTime := time.Now().Unix()
	validSessions := []Session{}
	found := false

	for _, s := range auth.Sessions {
		if s.Expires > currentTime {
			validSessions = append(validSessions, s)
			if s.Token == sessionToken {
				found = true
			}
		}
	}

	if len(validSessions) < len(auth.Sessions) {
		auth.Sessions = validSessions
		SaveAuth(auth)
	}

	return found
}

// deleteSession 从 auth.json 中移除一个会话令牌
func deleteSession(sessionToken string) {
	auth := LoadAuth()
	auth.Sessions = slices.DeleteFunc(auth.Sessions, func(s Session) bool {
		return s.Token == sessionToken
	})
	SaveAuth(auth)
}

// InvalidateAllSessions 清除 auth.json 中的所有会话令牌
func InvalidateAllSessions() {
	auth := LoadAuth()
	auth.Sessions = []Session{}
	SaveAuth(auth)
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

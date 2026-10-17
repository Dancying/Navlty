package internal

import (
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

const sessionDuration = 24 * time.Hour

// sessionCache 会话内存缓存
var sessionCache = struct {
	sync.RWMutex
	tokens map[string]int64
}{tokens: make(map[string]int64)}

// createSession 创建新会话并持久化
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

	sessionCache.Lock()
	sessionCache.tokens[newSession.Token] = newSession.Expires
	sessionCache.Unlock()
	return newSession.Token
}

// IsSessionValid 检查会话令牌是否有效
func IsSessionValid(sessionToken string) bool {
	sessionCache.RLock()
	expires, found := sessionCache.tokens[sessionToken]
	sessionCache.RUnlock()
	if found && expires > time.Now().Unix() { return true }

	auth := LoadAuth()
	currentTime := time.Now().Unix()
	validSessions := []Session{}
	found = false

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

	sessionCache.Lock()
	sessionCache.tokens = make(map[string]int64)
	for _, s := range validSessions {
		sessionCache.tokens[s.Token] = s.Expires
	}
	sessionCache.Unlock()
	return found
}

// deleteSession 移除会话令牌
func deleteSession(sessionToken string) {
	auth := LoadAuth()
	validSessions := auth.Sessions[:0]
	for _, s := range auth.Sessions {
		if s.Token != sessionToken {
			validSessions = append(validSessions, s)
		}
	}
	auth.Sessions = validSessions
	SaveAuth(auth)

	sessionCache.Lock()
	delete(sessionCache.tokens, sessionToken)
	sessionCache.Unlock()
}

// InvalidateAllSessions 清除所有会话令牌
func InvalidateAllSessions() {
	auth := LoadAuth()
	auth.Sessions = []Session{}
	SaveAuth(auth)

	sessionCache.Lock()
	sessionCache.tokens = make(map[string]int64)
	sessionCache.Unlock()
}

// AuthMiddleware 认证中间件
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

		if !IsSessionValid(cookie.Value) {
			respondWithError(w, http.StatusUnauthorized, "Unauthorized: Session is invalid or expired.")
			return
		}

		next.ServeHTTP(w, r)
	})
}

// HashPassword 密码哈希处理
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("error: failed to hash password: %v", err)
		return "", err
	}
	return string(bytes), nil
}

// CheckPasswordHash 校验密码与哈希值
func CheckPasswordHash(password, hash string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) == nil
}

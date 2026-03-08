package pkg

import (
	"net/http"
	"sync"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// session 代表一个用户会话
type session struct {
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

// InvalidateAllSessions 使所有当前会话无效
func InvalidateAllSessions() {
	mu.Lock()
	sessions = make(map[string]session)
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

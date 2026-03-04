package pkg

import (
	"net/http"
)

// RegisterHandlers 注册所有应用的 HTTP 路由
func RegisterHandlers() {
	// 创建一个新的 HTTP 服务复用器
	mux := http.NewServeMux()

	// 公共路由
	mux.HandleFunc("/", RenderPage)
	mux.HandleFunc("/auth/status", HandleAuthStatus)
	mux.HandleFunc("/auth/login", HandleAuth)
	mux.HandleFunc("/auth/logout", HandleLogout)

	// 受保护的 API 路由
	api := http.NewServeMux()
	api.HandleFunc("/api/settings", HandleSettings)
	api.HandleFunc("/api/links", HandleLinks)
	api.HandleFunc("/api/links/bulk", HandleBulkAddLinks)

	// 为所有 /api/ 路由应用认证中间件
	mux.Handle("/api/", AuthMiddleware(api))

	// 将复用器设置为默认的 HTTP 处理器
	http.Handle("/", mux)
}

package internal

import "net/http"

// NewRouter 构建并返回应用路由
func NewRouter() http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("/", RenderPage)
	mux.HandleFunc("/auth/status", HandleAuthStatus)
	mux.HandleFunc("/auth/login", HandleAuth)
	mux.HandleFunc("/auth/logout", HandleLogout)

	api := http.NewServeMux()
	api.HandleFunc("/api/settings", HandleSettings)
	api.HandleFunc("/api/links", getLinks)
	api.HandleFunc("/api/links/actions", HandleLinksBatch)
	api.HandleFunc("/api/auth/passwd", HandleChangePassword)

	mux.Handle("/api/", AuthMiddleware(api))

	return CompressMiddleware(mux)
}

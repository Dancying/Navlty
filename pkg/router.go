package pkg

import (
	"net/http"
)

func RegisterHandlers() {
	http.HandleFunc("/", RenderPage)
	http.HandleFunc("/api/settings", HandleSettings)
	http.HandleFunc("/api/links/bulk", HandleBulkAddLinks)
}

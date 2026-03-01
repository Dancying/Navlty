package main

import (
	"log"
	"net/http"
	"path/filepath"

	"navlty/internal"
)

func main() {
	fs := http.FileServer(http.Dir(filepath.Join("web", "static")))
	http.Handle("/static/", http.StripPrefix("/static/", fs))

	http.HandleFunc("/", internal.RenderPage)
	http.HandleFunc("/api/settings", internal.HandleSettings)
	http.HandleFunc("/api/links/bulk", internal.HandleBulkAddLinks)

	log.Println("Starting server on :8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}

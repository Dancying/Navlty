package main

import (
	"log"
	"net/http"

	"navlty/internal"
)

func main() {
	http.HandleFunc("/", internal.RenderPage)
	http.HandleFunc("/api/settings", internal.HandleSettings)
	http.HandleFunc("/api/links/bulk", internal.HandleBulkAddLinks)

	log.Println("Starting server on :8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}

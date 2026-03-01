package main

import (
	"log"
	"net/http"

	"navlty/internal"
)

func main() {
	// Initial load of data
	if err := internal.LoadData(); err != nil {
		log.Fatalf("Failed to load data: %v", err)
	}

	// Setup HTTP server
	http.HandleFunc("/", internal.RenderPage)
	http.HandleFunc("/api/save", internal.SaveData)
    http.HandleFunc("/api/links/bulk", internal.HandleBulkAddLinks)
    http.HandleFunc("/api/upload/icon", internal.HandleIconUpload) // New route

	// Serve static files
	fs := http.FileServer(http.Dir("web/static"))
	http.Handle("/static/", http.StripPrefix("/static/", fs))

	// Start the server
	log.Println("Server starting on port 8080...")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}

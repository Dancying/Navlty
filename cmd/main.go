package main

import (
	"log"
	"net/http"

	"navlty/internal"
)

func main() {
	// Load data on startup
	if err := internal.LoadData(); err != nil {
		log.Fatalf("failed to load data: %v", err)
	}

	// Setup HTTP server
	http.HandleFunc("/", internal.RenderPage)
	http.HandleFunc("/save", internal.SaveData)
	http.HandleFunc("/api/links/bulk", internal.HandleBulkAddLinks) // Handle bulk link additions

	// Serve static files
	fs := http.FileServer(http.Dir("web/static"))
	http.Handle("/static/", http.StripPrefix("/static/", fs))

	log.Println("Server starting on :8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("server failed to start: %v", err)
	}
}

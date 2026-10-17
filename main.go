package main

import (
	"log"
	"net/http"
	"os"

	"navlty/internal"
)

func main() {
	port := os.Getenv("NAVLTY_SERVICE_PORT")
	if port == "" { port = "10400" }

	addr := ":" + port
	internal.WarmAssetCache()
	if err := internal.ParseTemplate("web/index.html"); err != nil {
		log.Fatalf("Failed to parse template: %v", err)
	}
	log.Printf("Starting server on %s", addr)
	if err := http.ListenAndServe(addr, internal.NewRouter()); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}

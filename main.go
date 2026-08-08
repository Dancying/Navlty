package main

import (
	"log"
	"net/http"
	"os"

	"navlty/internal"
)

func main() {
	port := os.Getenv("NAVLTY_SERVICE_PORT")
	if port == "" {
		port = "8080"
	}

	addr := ":" + port
	log.Printf("Starting server on %s", addr)
	if err := http.ListenAndServe(addr, internal.NewRouter()); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}

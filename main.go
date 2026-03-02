package main

import (
	"log"
	"net/http"

	"navlty/pkg"
)

func main() {
	pkg.RegisterHandlers()

	log.Println("Starting server on :8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}

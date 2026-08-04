package main

import (
	"log"
	"net/http"
	"os"

	"navlty/internal"
)

func main() {
	internal.RegisterHandlers()

	// 通过环境变量 NAVLTY_SERVICE_PORT 控制服务端口，默认 8080
	port := os.Getenv("NAVLTY_SERVICE_PORT")
	if port == "" {
		port = "8080"
	}

	addr := ":" + port
	log.Printf("Starting server on %s", addr)
	if err := http.ListenAndServe(addr, nil); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}

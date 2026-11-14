package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"navlty/internal"
)

func main() {
	defer internal.FlushLogs()

	port := os.Getenv("NAVLTY_SERVICE_PORT")
	if port == "" { port = "10400" }

	addr := ":" + port

	if err := internal.InitLog(os.Getenv("NAVLTY_DATA_DIR")); err != nil {
		log.Fatalf("%s | FATAL | SERVER | Failed to init log err=\"%v\"", time.Now().Format("2006-01-02 15:04:05"), err)
	}

	internal.WarmAssetCache()
	if err := internal.ParseTemplate("web/index.html"); err != nil {
		internal.CriticalLogger.Fatalf("%s | FATAL | SERVER | Failed to parse template err=\"%v\"", time.Now().Format("2006-01-02 15:04:05"), err)
	}
	internal.FileLogger.Printf("%s | INFO | SERVER | Starting addr=%s", time.Now().Format("2006-01-02 15:04:05"), addr)
	if err := http.ListenAndServe(addr, internal.NewRouter()); err != nil {
		internal.CriticalLogger.Fatalf("%s | FATAL | SERVER | Failed to start err=\"%v\"", time.Now().Format("2006-01-02 15:04:05"), err)
	}
}

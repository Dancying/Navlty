package main

import (
	"log"
	"net/http"

	"navlty/internal"
)

func main() {
	defer internal.FlushLogs()

	cfg := internal.LoadConfig()

	addr := ":" + cfg.ServicePort

	if err := internal.InitLog(cfg.DataDir, cfg.LogLevel); err != nil {
		log.Fatalf("%s | FATAL | SERVER | Failed to init log err=\"%v\"", internal.LogTime(), err)
	}

	internal.DataDirectory = cfg.DataDir
	internal.CompressionEnabled = cfg.Compression

	internal.WarmAssetCache()
	if err := internal.ParseTemplate("web/index.html"); err != nil {
		internal.CriticalLogger.Fatalf("%s | FATAL | SERVER | Failed to parse template err=\"%v\"", internal.LogTime(), err)
	}
	internal.FileLogger.Printf("%s | INFO | SERVER | Starting addr=%s", internal.LogTime(), addr)
	if err := http.ListenAndServe(addr, internal.NewRouter()); err != nil {
		internal.CriticalLogger.Fatalf("%s | FATAL | SERVER | Failed to start err=\"%v\"", internal.LogTime(), err)
	}
}

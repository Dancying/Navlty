package main

import (
	"compress/gzip"
	"io"
	"log"
	"net/http"

	"navlty/internal/data"
	"navlty/internal/handlers"
)

type gzipResponseWriter struct {
	io.Writer
	http.ResponseWriter
}

func (w gzipResponseWriter) Write(b []byte) (int, error) {
	return w.Writer.Write(b)
}

func gzipHandler(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Encoding", "gzip")
		gz := gzip.NewWriter(w)
		defer gz.Close()
		gzw := gzipResponseWriter{Writer: gz, ResponseWriter: w}
		next.ServeHTTP(gzw, r)
	})
}

func main() {
	data.LoadData()

	mux := http.NewServeMux()
	mux.HandleFunc("/", handlers.RenderPage)
	mux.HandleFunc("/api/save", handlers.SaveData)

	// Serve static files
	fs := http.FileServer(http.Dir("web/static"))
	mux.Handle("/static/", http.StripPrefix("/static/", fs))

	log.Println("Starting server on :8080")
	if err := http.ListenAndServe(":8080", gzipHandler(mux)); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}

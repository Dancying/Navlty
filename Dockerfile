FROM golang:1.22-alpine AS builder
WORKDIR /navlty
COPY go.mod go.sum ./
RUN go mod download && go mod verify
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /navlty/navlty .
FROM alpine:latest
WORKDIR /navlty
COPY --from=builder /navlty/navlty .
COPY web ./web
EXPOSE 8080
CMD ["/navlty/navlty"]

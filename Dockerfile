FROM golang:1.26-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download && go mod verify
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app/navlty .

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/navlty .
COPY web ./web
ENV NAVLTY_DATA_DIR=/config
ENV NAVLTY_SERVICE_PORT=10400
EXPOSE 10400
VOLUME ["/config"]
CMD ["/app/navlty"]

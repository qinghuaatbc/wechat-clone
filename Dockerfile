FROM golang:1.25-alpine AS builder

ENV GOTOOLCHAIN=auto

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o wechat-clone ./cmd/server/

FROM alpine:latest

WORKDIR /app
COPY --from=builder /app/wechat-clone .
COPY web-react/dist ./web-react/dist

EXPOSE 8080
CMD ["./wechat-clone"]
